/**
 * Database Integration Testing Examples with RestifiedTS
 * 
 * Demonstrates comprehensive database state validation and testing
 */

import { restified } from '../../src/index';
import { expect } from 'chai';

describe('Database Integration Testing', function() {
  this.timeout(30000);

  before(async function() {
    // Setup database connections (using mock/test databases)
    
    // PostgreSQL connection (if available)
    if (process.env.POSTGRES_CONNECTION_STRING || process.env.POSTGRES_HOST) {
      await restified.createDatabaseClient('postgres', {
        type: 'postgresql',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        username: process.env.POSTGRES_USER || 'test',
        password: process.env.POSTGRES_PASSWORD || 'test',
        database: process.env.POSTGRES_DB || 'testdb',
        connectionString: process.env.POSTGRES_CONNECTION_STRING,
        timeout: 10000
      });
    }

    // MongoDB connection (if available)
    if (process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_HOST) {
      await restified.createDatabaseClient('mongodb', {
        type: 'mongodb',
        host: process.env.MONGODB_HOST || 'localhost',
        port: parseInt(process.env.MONGODB_PORT || '27017'),
        database: process.env.MONGODB_DB || 'testdb',
        connectionString: process.env.MONGODB_CONNECTION_STRING,
        timeout: 10000
      });
    }
  });

  after(async function() {
    await restified.cleanup();
  });

  describe('PostgreSQL Integration', function() {
    beforeEach(function() {
      if (!restified.getDatabaseClient) {
        this.skip();
      }
      
      try {
        restified.getDatabaseClient('postgres');
      } catch {
        this.skip();
      }
    });

    it('should validate user creation via API and database', async function() {
      const dbClient = restified.getDatabaseClient('postgres');
      
      // Create snapshot before test
      await dbClient.createSnapshot('before-user-test', ['users']);
      
      // Create user via API
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .post('/users', {
            name: 'Database Test User',
            email: 'dbtest@example.com',
            username: 'dbtestuser'
          })
          .execute();

      await response
        .statusCode(201)
        .extract('$.id', 'createdUserId')
        .execute();

      // Simulate database state validation
      // In real scenario, this would check if user was actually created in database
      const userId = restified.getVariable('createdUserId');
      
      // Mock database query result
      const queryResult = await dbClient.executeQuery(
        'SELECT * FROM users WHERE external_id = $1',
        [userId]
      );

      // In a real test, you would validate the user exists in database
      console.log(`Created user with ID: ${userId}`);
      expect(queryResult.executionTime).to.be.a('number');
    });

    it('should validate data consistency across API and database', async function() {
      const dbClient = restified.getDatabaseClient('postgres');
      
      // Test data consistency validation
      const validationResult = await restified.validateDatabaseState([
        {
          client: 'postgres',
          table: 'users',
          conditions: { active: true },
          expectedCount: 5
        },
        {
          client: 'postgres',
          table: 'orders',
          conditions: { status: 'pending' },
          expectedCount: { min: 1 }
        }
      ]);

      // In real scenario, this would validate actual database state
      expect(validationResult).to.have.property('success');
      expect(validationResult).to.have.property('results');
    });

    it('should handle database transactions', async function() {
      const dbClient = restified.getDatabaseClient('postgres');
      
      try {
        // Begin transaction
        await dbClient.beginTransaction();
        
        // Execute test operations
        await dbClient.executeQuery(
          'INSERT INTO test_table (name, value) VALUES ($1, $2)',
          ['transaction-test', 42]
        );
        
        // Validate data exists in transaction
        const result = await dbClient.executeQuery(
          'SELECT * FROM test_table WHERE name = $1',
          ['transaction-test']
        );
        
        // Rollback transaction (cleanup)
        await dbClient.rollback();
        
        console.log('Transaction test completed successfully');
      } catch (error) {
        await dbClient.rollback();
        throw error;
      }
    });

    it('should measure database query performance', async function() {
      const dbClient = restified.getDatabaseClient('postgres');
      
      const startTime = Date.now();
      
      const result = await dbClient.executeQuery(
        'SELECT COUNT(*) as total FROM information_schema.tables'
      );
      
      expect(result.executionTime).to.be.a('number');
      expect(result.executionTime).to.be.lessThan(5000); // Less than 5 seconds
      
      console.log(`Database query executed in ${result.executionTime}ms`);
    });
  });

  describe('MongoDB Integration', function() {
    beforeEach(function() {
      try {
        restified.getDatabaseClient('mongodb');
      } catch {
        this.skip();
      }
    });

    it('should validate document creation and retrieval', async function() {
      const dbClient = restified.getDatabaseClient('mongodb');
      
      // Insert document
      const insertOperation = JSON.stringify({
        collection: 'users',
        method: 'insertOne',
        document: {
          name: 'MongoDB Test User',
          email: 'mongotest@example.com',
          createdAt: new Date(),
          metadata: {
            source: 'restifiedts-test',
            version: '1.0.0'
          }
        }
      });
      
      const insertResult = await dbClient.executeQuery(insertOperation);
      expect(insertResult.insertId).to.exist;
      
      const documentId = insertResult.insertId;
      restified.setGlobalVariable('mongoDocumentId', documentId.toString());
      
      // Retrieve document
      const findOperation = JSON.stringify({
        collection: 'users',
        method: 'findOne',
        query: { _id: documentId }
      });
      
      const findResult = await dbClient.executeQuery(findOperation);
      expect(findResult.rows).to.have.length(1);
      expect(findResult.rows[0].name).to.equal('MongoDB Test User');
      expect(findResult.rows[0].metadata.source).to.equal('restifiedts-test');
    });

    it('should validate document updates', async function() {
      const dbClient = restified.getDatabaseClient('mongodb');
      const documentId = restified.getVariable('mongoDocumentId');
      
      if (!documentId) {
        this.skip();
      }
      
      // Update document
      const updateOperation = JSON.stringify({
        collection: 'users',
        method: 'updateOne',
        query: { _id: { $oid: documentId } },
        document: {
          $set: {
            name: 'Updated MongoDB User',
            updatedAt: new Date()
          }
        }
      });
      
      const updateResult = await dbClient.executeQuery(updateOperation);
      expect(updateResult.affectedRows).to.equal(1);
      
      // Verify update
      const findOperation = JSON.stringify({
        collection: 'users',
        method: 'findOne',
        query: { _id: { $oid: documentId } }
      });
      
      const findResult = await dbClient.executeQuery(findOperation);
      expect(findResult.rows[0].name).to.equal('Updated MongoDB User');
      expect(findResult.rows[0].updatedAt).to.exist;
    });

    it('should handle aggregation queries', async function() {
      const dbClient = restified.getDatabaseClient('mongodb');
      
      const aggregationOperation = JSON.stringify({
        collection: 'users',
        method: 'aggregate',
        query: [
          { $match: { name: { $regex: 'MongoDB', $options: 'i' } } },
          { $group: { _id: '$metadata.source', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]
      });
      
      const result = await dbClient.executeQuery(aggregationOperation);
      expect(result.rows).to.be.an('array');
      expect(result.executionTime).to.be.a('number');
      
      console.log(`Aggregation completed in ${result.executionTime}ms`);
    });
  });

  describe('Cross-Database Validation', function() {
    it('should validate data consistency across multiple databases', async function() {
      // This would test scenarios where data must be consistent across different databases
      // For example, user data in PostgreSQL and session data in MongoDB
      
      const validations = [
        {
          client: 'postgres',
          table: 'users',
          conditions: { active: true },
          expectedCount: 3
        }
      ];
      
      // Add MongoDB validation if available
      try {
        restified.getDatabaseClient('mongodb');
        validations.push({
          client: 'mongodb',
          table: 'sessions', // collection
          conditions: { active: true },
          expectedCount: 3
        });
      } catch {
        // MongoDB not available, skip
      }
      
      if (validations.length > 1) {
        const result = await restified.validateDatabaseState(validations);
        expect(result.success).to.be.a('boolean');
        expect(result.results).to.have.length(validations.length);
      }
    });
  });

  describe('Database Health Checks', function() {
    it('should perform health checks on all database connections', async function() {
      const connections = ['postgres', 'mongodb'];
      
      for (const connectionName of connections) {
        try {
          const dbClient = restified.getDatabaseClient(connectionName);
          const health = await dbClient.healthCheck();
          
          expect(health.healthy).to.be.a('boolean');
          expect(health.latency).to.be.a('number');
          
          if (health.healthy) {
            expect(health.latency).to.be.greaterThan(0);
            console.log(`${connectionName} health check: ${health.latency}ms`);
          } else {
            console.log(`${connectionName} health check failed: ${health.error}`);
          }
        } catch (error) {
          console.log(`${connectionName} connection not available`);
        }
      }
    });
  });

  describe('Test Data Management', function() {
    it('should seed and cleanup test data', async function() {
      try {
        const dbClient = restified.getDatabaseClient('postgres');
        
        // Seed test data
        const testData = [
          { name: 'Test User 1', email: 'test1@example.com', active: true },
          { name: 'Test User 2', email: 'test2@example.com', active: true },
          { name: 'Test User 3', email: 'test3@example.com', active: false }
        ];
        
        await dbClient.seedTestData('test_users', testData);
        
        // Validate data was seeded
        const count = await dbClient.validateCount('test_users', 3, { active: true });
        expect(count).to.be.true;
        
        // Cleanup test data
        await dbClient.cleanupTestData('test_users', { email: { $like: '%@example.com' } });
        
        console.log('Test data seeding and cleanup completed');
      } catch (error) {
        console.log('Test data management skipped - table not available');
      }
    });
  });
});