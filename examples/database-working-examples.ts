/**
 * Working Database Integration Examples for RestifiedTS
 * 
 * This file demonstrates the currently implemented database functionality
 */

import { Restified } from '../src/index';

async function demonstrateWorkingDatabaseFeatures() {
  console.log('🗄️ RestifiedTS Database Integration - Working Examples');
  console.log('====================================================\n');
  
  const restified = new Restified();

  try {
    // ✅ PostgreSQL - FULLY IMPLEMENTED
    console.log('=== PostgreSQL Examples ===');
    
    await restified.createDatabaseClient('postgres', {
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'postgres',
      password: 'password',
      timeout: 30000,
      pool: {
        min: 1,
        max: 5,
        idleTimeoutMillis: 30000
      },
      options: {
        ssl: false,
        application_name: 'RestifiedTS_Test'
      }
    });

    console.log('✅ PostgreSQL client connected');

    // Test basic query
    const pgClient = restified.getClient('postgres');
    const pgResult = await pgClient.query('SELECT NOW() as current_time, $1 as test_param', ['hello']);
    console.log('✅ PostgreSQL query result:', pgResult.rows?.[0]);

    // Test transaction
    await pgClient.beginTransaction();
    await pgClient.query('SELECT 1');
    await pgClient.commit();
    console.log('✅ PostgreSQL transaction completed');

    // Test validation
    const pgValidation = await restified.validateDatabaseState([
      {
        client: 'postgres',
        customQuery: 'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = $1',
        expectedResult: { count: { min: 1 } }
      }
    ]);
    console.log('✅ PostgreSQL validation:', pgValidation.success);

    // ✅ MongoDB - FULLY IMPLEMENTED
    console.log('\n=== MongoDB Examples ===');
    
    await restified.createDatabaseClient('mongo', {
      type: 'mongodb',
      connectionString: 'mongodb://localhost:27017/testdb',
      timeout: 30000
    });

    console.log('✅ MongoDB client connected');

    const mongoClient = restified.getClient('mongo');
    
    // Test MongoDB operations using helper methods
    const users = await mongoClient.findDocuments('users', { active: true }, { limit: 5 });
    console.log('✅ MongoDB find result:', users.rows?.length || 0, 'documents');

    const userCount = await mongoClient.countDocuments('users', { active: true });
    console.log('✅ MongoDB count:', userCount);

    // Test JSON-based operations
    const mongoOperation = JSON.stringify({
      collection: 'test_collection',
      method: 'insertOne',
      document: { name: 'Test Document', createdAt: new Date(), active: true }
    });
    
    const insertResult = await mongoClient.query(mongoOperation);
    console.log('✅ MongoDB insert result:', insertResult.insertId ? 'Success' : 'Failed');

    // ✅ MySQL - NEWLY IMPLEMENTED
    console.log('\n=== MySQL Examples ===');
    
    try {
      await restified.createDatabaseClient('mysql', {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'root',
        password: 'password',
        timeout: 30000,
        pool: {
          min: 1,
          max: 5
        },
        options: {
          charset: 'utf8mb4',
          timezone: 'UTC',
          ssl: false
        }
      });

      console.log('✅ MySQL client connected');

      const mysqlClient = restified.getClient('mysql');
      const mysqlResult = await mysqlClient.query('SELECT NOW() as current_time, ? as test_param', ['hello']);
      console.log('✅ MySQL query result:', mysqlResult.rows?.[0]);

      // Test MySQL-specific methods
      const mysqlStats = await mysqlClient.showStatus('Threads%');
      console.log('✅ MySQL status variables:', mysqlStats.length);

    } catch (error: any) {
      if (error.message.includes('mysql2')) {
        console.log('⚠️ MySQL requires "mysql2" package: npm install mysql2');
      } else {
        console.log('⚠️ MySQL connection failed (database may not be running):', error.message);
      }
    }

    // ✅ SQLite - NEWLY IMPLEMENTED
    console.log('\n=== SQLite Examples ===');
    
    try {
      await restified.createDatabaseClient('sqlite', {
        type: 'sqlite',
        options: {
          filename: ':memory:', // In-memory database for testing
          memory: true
        }
      });

      console.log('✅ SQLite client connected');

      const sqliteClient = restified.getClient('sqlite');
      
      // Create test table
      await sqliteClient.query(`
        CREATE TABLE IF NOT EXISTS test_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert test data
      const insertUsers = await sqliteClient.query(
        'INSERT INTO test_users (name, email) VALUES (?, ?)', 
        ['Test User', 'test@example.com']
      );
      console.log('✅ SQLite insert result:', insertUsers.insertId);

      // Query data
      const sqliteUsers = await sqliteClient.query('SELECT * FROM test_users');
      console.log('✅ SQLite query result:', sqliteUsers.rows?.length, 'users');

      // Get database info
      const dbInfo = await sqliteClient.getDatabaseInfo();
      console.log('✅ SQLite database info available:', Object.keys(dbInfo).length, 'properties');

    } catch (error: any) {
      if (error.message.includes('sqlite3')) {
        console.log('⚠️ SQLite requires "sqlite3" package: npm install sqlite3');
      } else {
        console.log('⚠️ SQLite error:', error.message);
      }
    }

    // ✅ Redis - NEWLY IMPLEMENTED
    console.log('\n=== Redis Examples ===');
    
    try {
      await restified.createDatabaseClient('redis', {
        type: 'redis',
        host: 'localhost',
        port: 6379,
        timeout: 10000,
        options: {
          keyPrefix: 'restified:test:',
          maxRetriesPerRequest: 3
        }
      });

      console.log('✅ Redis client connected');

      const redisClient = restified.getClient('redis');
      
      // Test basic Redis operations
      await redisClient.query('SET test_key test_value EX 60');
      const getValue = await redisClient.query('GET test_key');
      console.log('✅ Redis GET result:', getValue.rows?.[0]);

      // Test Redis-specific methods
      const keyInfo = await redisClient.getKeyInfo('test_key');
      console.log('✅ Redis key info:', keyInfo?.type, keyInfo?.ttl);

      // Test bulk operations
      const bulkData = {
        'bulk:key1': 'value1',
        'bulk:key2': 'value2',
        'bulk:key3': 'value3'
      };
      const bulkResult = await redisClient.bulkSet(bulkData, 300);
      console.log('✅ Redis bulk set:', bulkResult.rowCount, 'keys');

    } catch (error: any) {
      if (error.message.includes('redis')) {
        console.log('⚠️ Redis requires "redis" package: npm install redis');
      } else {
        console.log('⚠️ Redis connection failed (Redis may not be running):', error.message);
      }
    }

    // ✅ SQL Server - NEWLY IMPLEMENTED
    console.log('\n=== SQL Server Examples ===');
    
    try {
      await restified.createDatabaseClient('mssql', {
        type: 'mssql',
        host: 'localhost',
        port: 1433,
        database: 'tempdb',
        username: 'sa',
        password: 'YourStrong!Passw0rd',
        timeout: 15000,
        options: {
          encrypt: true,
          trustServerCertificate: true
        }
      });

      console.log('✅ SQL Server client connected');

      const mssqlClient = restified.getClient('mssql');
      const mssqlResult = await mssqlClient.query('SELECT GETDATE() as current_time, @param0 as test_param', ['hello']);
      console.log('✅ SQL Server query result:', mssqlResult.rows?.[0]);

      // Test SQL Server-specific methods
      const serverInfo = await mssqlClient.getServerInfo();
      console.log('✅ SQL Server info:', serverInfo.edition, serverInfo.product_version);

    } catch (error: any) {
      if (error.message.includes('mssql')) {
        console.log('⚠️ SQL Server requires "mssql" package: npm install mssql');
      } else {
        console.log('⚠️ SQL Server connection failed (SQL Server may not be running):', error.message);
      }
    }

    // ✅ Enhanced Database State Operations
    console.log('\n=== Database State Management Examples ===');

    // Setup test data
    await restified.setupDatabaseState([
      {
        client: 'postgres',
        action: 'execute',
        sql: `
          CREATE TABLE IF NOT EXISTS test_products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10,2),
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        client: 'postgres',
        action: 'insert',
        table: 'test_products',
        data: [
          { name: 'Product 1', price: 99.99, active: true },
          { name: 'Product 2', price: 149.99, active: true },
          { name: 'Product 3', price: 199.99, active: false }
        ]
      }
    ]);

    console.log('✅ Test data setup completed');

    // Comprehensive validation
    const validation = await restified.validateDatabaseState([
      {
        client: 'postgres',
        table: 'test_products',
        conditions: { active: true },
        expectedCount: 2
      },
      {
        client: 'postgres',
        customQuery: 'SELECT AVG(price) as avg_price FROM test_products WHERE active = $1',
        expectedResult: { avg_price: { min: 100, max: 200 } }
      }
    ]);

    console.log('✅ Database validation result:', validation.success);
    console.log('   Validation details:', validation.results.length, 'checks performed');

    // Health check all databases
    const healthCheck = await restified.databaseHealthCheck();
    console.log('✅ Database health check:');
    Object.entries(healthCheck).forEach(([name, health]) => {
      console.log(`   ${name}: ${health.healthy ? '✅ Healthy' : '❌ Unhealthy'} (${health.latency}ms)`);
    });

    // Get database statistics
    const stats = await restified.getDatabaseStats();
    console.log('✅ Database statistics:');
    Object.entries(stats).forEach(([name, stat]) => {
      console.log(`   ${name}: ${stat.connected ? 'Connected' : 'Disconnected'} (${stat.connectionType})`);
    });

    // Cleanup test data
    await restified.cleanupDatabaseState([
      {
        client: 'postgres',
        action: 'execute',
        sql: 'DROP TABLE IF EXISTS test_products'
      }
    ]);

    console.log('✅ Test data cleanup completed');

  } catch (error: any) {
    console.error('❌ Database example error:', error.message);
  } finally {
    // Always cleanup connections
    await restified.disconnectAllDatabases();
    console.log('\n✅ All database connections closed');
  }

  console.log('\n🎉 Database integration examples completed!');
  console.log('\n📋 Summary of Implementation Status:');
  console.log('   ✅ PostgreSQL - Fully implemented with advanced features');
  console.log('   ✅ MongoDB - Fully implemented with JSON operations');
  console.log('   ✅ MySQL - Newly implemented with full feature set');
  console.log('   ✅ SQLite - Newly implemented with in-memory support');
  console.log('   ✅ Redis - Newly implemented with key-value operations');
  console.log('   ✅ SQL Server - Newly implemented with enterprise features');
  console.log('   ⚠️ Oracle - Planned for future implementation');
  console.log('   ⚠️ Elasticsearch - Planned for future implementation');
  console.log('\n💡 Note: Database packages need to be installed separately:');
  console.log('   npm install pg mongodb mysql2 sqlite3 redis mssql');
}

// Database testing patterns
async function demonstrateDatabaseTestingPatterns() {
  console.log('\n🧪 Database Testing Patterns');
  console.log('============================\n');

  const restified = new Restified();

  try {
    // Multi-database test scenario
    await restified.createDatabaseClient('primary', {
      type: 'postgresql',
      connectionString: 'postgresql://localhost:5432/testdb'
    });

    await restified.createDatabaseClient('cache', {
      type: 'redis',
      host: 'localhost',
      port: 6379
    });

    // Test data consistency across databases
    console.log('=== Cross-Database Testing ===');

    // Setup data in PostgreSQL
    await restified.setupDatabaseState([
      {
        client: 'primary',
        action: 'execute',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE,
            email VARCHAR(100),
            last_login TIMESTAMP
          )
        `
      },
      {
        client: 'primary',
        action: 'insert',
        table: 'users',
        data: [
          { username: 'alice', email: 'alice@example.com', last_login: new Date() },
          { username: 'bob', email: 'bob@example.com', last_login: new Date() }
        ]
      }
    ]);

    // Setup corresponding cache data in Redis
    await restified.setupDatabaseState([
      {
        client: 'cache',
        action: 'execute',
        sql: 'SET user:alice:session active EX 3600'
      },
      {
        client: 'cache',
        action: 'execute', 
        sql: 'SET user:bob:session active EX 3600'
      }
    ]);

    // Validate consistency
    const crossDbValidation = await restified.validateDatabaseState([
      {
        client: 'primary',
        table: 'users',
        expectedCount: 2
      },
      {
        client: 'cache',
        customQuery: 'KEYS user:*:session'
      }
    ]);

    console.log('✅ Cross-database validation:', crossDbValidation.success);

    // Performance testing
    console.log('\n=== Performance Testing ===');
    
    const startTime = Date.now();
    
    // Batch operations
    const batchOperations = [];
    for (let i = 0; i < 100; i++) {
      batchOperations.push({
        client: 'cache',
        action: 'execute' as const,
        sql: `SET perf:test:${i} value${i} EX 60`
      });
    }
    
    await restified.setupDatabaseState(batchOperations);
    
    const endTime = Date.now();
    console.log(`✅ Batch operations completed in ${endTime - startTime}ms`);

    // Cleanup
    await restified.cleanupDatabaseState([
      {
        client: 'primary',
        action: 'execute',
        sql: 'DROP TABLE IF EXISTS users'
      },
      {
        client: 'cache',
        action: 'execute',
        sql: 'FLUSHDB'
      }
    ]);

    console.log('✅ Cleanup completed');

  } catch (error: any) {
    console.error('❌ Testing pattern error:', error.message);
  } finally {
    await restified.disconnectAllDatabases();
  }
}

// Run examples
if (require.main === module) {
  demonstrateWorkingDatabaseFeatures()
    .then(() => demonstrateDatabaseTestingPatterns())
    .catch(console.error);
}

export { demonstrateWorkingDatabaseFeatures, demonstrateDatabaseTestingPatterns };