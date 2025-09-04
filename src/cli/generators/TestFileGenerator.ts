/**
 * Test File Generator
 * 
 * Generates test files based on test types and API analysis
 */

import { BaseGenerator } from './BaseGenerator';
import { 
  GenerationResult, 
  ValidationResult,
  GeneratorConfig
} from '../types/ScaffoldTypes';

export class TestFileGenerator extends BaseGenerator {
  /**
   * Generate test files based on test types
   */
  async generate(): Promise<GenerationResult> {
    const filesCreated: string[] = [];

    try {
      const testTypes = this.context.testTypes || ['api'];
      
      for (const testType of testTypes) {
        const testFile = await this.generateTestFile(testType);
        const fileName = `${testType}-tests.ts`;
        
        this.fileManager.queueOperation({
          type: 'create',
          destination: this.getOutputPath('tests', fileName),
          content: testFile,
          backup: true
        });
        
        filesCreated.push(`tests/${fileName}`);
      }

      // Generate global setup file based on complexity
      const setupTemplate = this.getSetupTemplate();
      await this.renderAndQueue(
        this.getTemplatePath('setup', setupTemplate),
        this.getOutputPath('setup', 'global-setup.ts')
      );
      filesCreated.push('setup/global-setup.ts');

      this.log(`Generated ${filesCreated.length} test files`);
      
      return this.createSuccessResult(filesCreated);
    } catch (error) {
      const message = `Failed to generate test files: ${(error as Error).message}`;
      this.log(message, 'error');
      return this.createFailureResult([message], filesCreated);
    }
  }

  /**
   * Validate test file generation prerequisites
   */
  async validate(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if test types are valid
    const testTypes = this.context.testTypes || [];
    const validTypes = ['api', 'auth', 'database', 'performance', 'security', 'graphql', 'websocket'];
    
    for (const type of testTypes) {
      if (!validTypes.includes(type)) {
        warnings.push(`Unknown test type: ${type}`);
      }
    }

    if (testTypes.length === 0) {
      warnings.push('No test types specified, will generate basic API tests');
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Get generator configuration
   */
  getConfig(): GeneratorConfig {
    return {
      name: 'testfiles',
      description: 'Generate test files for specified test types',
      templates: [], // Direct generation, no templates needed
      dependencies: [],
      devDependencies: []
    };
  }

  /**
   * Generate test file for specific type
   */
  private async generateTestFile(testType: string): Promise<string> {
    switch (testType) {
      case 'api':
        return this.generateApiTests();
      case 'auth':
        return this.generateAuthTests();
      case 'database':
        return this.generateDatabaseTests();
      case 'performance':
        return this.generatePerformanceTests();
      case 'security':
        return this.generateSecurityTests();
      case 'graphql':
        return this.generateGraphQLTests();
      case 'websocket':
        return this.generateWebSocketTests();
      default:
        return this.generateApiTests(); // Default fallback
    }
  }

  /**
   * Generate API tests
   */
  private generateApiTests(): string {
    const baseUrl = this.context.baseUrl || 'https://jsonplaceholder.typicode.com';
    
    return `/**
 * API Tests
 * 
 * Basic API functionality tests for ${this.context.projectName}
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${this.context.projectName} API Tests', function() {
  this.timeout(30000);

  after(async function() {
    await restified.cleanup();
  });

  it('should get users list', async function() {
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .get('/users')
        .execute();

    await response
      .statusCode(200)
      .body((body) => {
        expect(body).to.be.an('array');
        expect(body.length).to.be.greaterThan(0);
      })
      .execute();
  });

  it('should get single user', async function() {
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .get('/users/1')
        .execute();

    await response
      .statusCode(200)
      .body('id', 1)
      .body('name', (name) => expect(name).to.be.a('string'))
      .body('email', (email) => expect(email).to.be.a('string'))
      .execute();
  });

  it('should create new user', async function() {
    const userData = {
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com'
    };

    const response = await restified
      .given()
        .useClient('api')
        .body(userData)
      .when()
        .post('/users')
        .execute();

    await response
      .statusCode(201)
      .body('name', userData.name)
      .body('email', userData.email)
      .execute();
  });

  it('should update user', async function() {
    const updateData = {
      name: 'Jane Doe',
      email: 'jane@example.com'
    };

    const response = await restified
      .given()
        .useClient('api')
        .body(updateData)
      .when()
        .put('/users/1')
        .execute();

    await response
      .statusCode(200)
      .body('id', 1)
      .body('name', updateData.name)
      .body('email', updateData.email)
      .execute();
  });

  it('should delete user', async function() {
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .delete('/users/1')
        .execute();

    await response
      .statusCode(200)
      .execute();
  });

  it('should handle not found', async function() {
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .get('/users/999')
        .execute();

    await response
      .statusCode(404)
      .execute();
  });
});`;
  }

  /**
   * Generate authentication tests
   */
  private generateAuthTests(): string {
    return `/**
 * Authentication Tests
 * 
 * Authentication and authorization tests for ${this.context.projectName}
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${this.context.projectName} Authentication Tests', function() {
  this.timeout(30000);

  after(async function() {
    await restified.cleanup();
  });

  it('should authenticate with valid credentials', async function() {
    const response = await restified
      .given()
        .useClient('api')
        .body({
          username: process.env.AUTH_USERNAME || 'admin',
          password: process.env.AUTH_PASSWORD || 'password123'
        })
      .when()
        .post('/auth/login')
        .execute();

    await response
      .statusCode(200)
      .body('token', (token) => {
        expect(token).to.be.a('string');
        expect(token).to.have.length.greaterThan(10);
      })
      .execute();

    // Store token for subsequent tests
    const authToken = await response.extract('token');
    restified.setGlobalVariable('authToken', authToken);
  });

  it('should reject invalid credentials', async function() {
    const response = await restified
      .given()
        .useClient('api')
        .body({
          username: 'invalid_user',
          password: 'wrong_password'
        })
      .when()
        .post('/auth/login')
        .execute();

    await response
      .statusCode(401)
      .body('error', (error) => expect(error).to.exist)
      .execute();
  });

  it('should access protected endpoint with token', async function() {
    const token = restified.getGlobalVariable('authToken');
    
    const response = await restified
      .given()
        .useClient('api')
        .header('Authorization', \`Bearer \${token}\`)
      .when()
        .get('/protected-resource')
        .execute();

    await response
      .statusCode(200)
      .execute();
  });

  it('should reject access without token', async function() {
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .get('/protected-resource')
        .execute();

    await response
      .statusCode(401)
      .execute();
  });

  it('should reject invalid token', async function() {
    const response = await restified
      .given()
        .useClient('api')
        .header('Authorization', 'Bearer invalid-token')
      .when()
        .get('/protected-resource')
        .execute();

    await response
      .statusCode(401)
      .execute();
  });
});`;
  }

  /**
   * Generate database tests
   */
  private generateDatabaseTests(): string {
    return `/**
 * Database Tests
 * 
 * Database integration and validation tests for ${this.context.projectName}
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${this.context.projectName} Database Tests', function() {
  this.timeout(30000);

  before(async function() {
    // Setup database connections
    if (process.env.POSTGRES_HOST) {
      await restified.createDatabaseClient('postgres', {
        type: 'postgresql',
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        username: process.env.POSTGRES_USERNAME,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE
      });
    }

    if (process.env.MONGODB_CONNECTION_STRING) {
      await restified.createDatabaseClient('mongo', {
        type: 'mongodb',
        connectionString: process.env.MONGODB_CONNECTION_STRING
      });
    }

    // Setup test data
    await this.setupTestData();
  });

  after(async function() {
    await this.cleanupTestData();
    await restified.cleanup();
  });

  beforeEach(async function() {
    // Reset test data before each test
    await this.resetTestData();
  });

  it('should validate database connection', async function() {
    const healthCheck = await restified.databaseHealthCheck();
    expect(healthCheck).to.have.property('postgres');
    expect(healthCheck.postgres.connected).to.be.true;
  });

  it('should create user and validate in database', async function() {
    const userData = {
      name: 'Database Test User',
      email: 'dbtest@example.com'
    };

    // Create user via API
    const response = await restified
      .given()
        .useClient('api')
        .body(userData)
      .when()
        .post('/users')
        .execute();

    await response
      .statusCode(201)
      .body('id', (id) => {
        expect(id).to.be.a('number');
        restified.setLocalVariable('createdUserId', id);
      })
      .execute();

    // Validate user exists in database
    const userId = restified.getLocalVariable('createdUserId');
    const validation = await restified.validateDatabaseState([
      {
        client: 'postgres',
        table: 'users',
        conditions: { id: userId },
        expectedCount: 1
      }
    ]);

    expect(validation.isValid).to.be.true;
  });

  it('should validate data consistency across operations', async function() {
    // Create initial state
    await restified.executeDatabaseOperation('postgres', {
      sql: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
      params: ['Consistency Test', 'consistency@test.com']
    });

    // Verify initial count
    let validation = await restified.validateDatabaseState([
      {
        client: 'postgres',
        table: 'users',
        conditions: { name: 'Consistency Test' },
        expectedCount: 1
      }
    ]);
    expect(validation.isValid).to.be.true;

    // Update via API
    const updateResponse = await restified
      .given()
        .useClient('api')
        .body({ name: 'Updated Consistency Test' })
      .when()
        .put('/users/1')
        .execute();

    await updateResponse.statusCode(200).execute();

    // Validate update in database
    validation = await restified.validateDatabaseState([
      {
        client: 'postgres',
        table: 'users',
        conditions: { name: 'Updated Consistency Test' },
        expectedCount: 1
      }
    ]);
    expect(validation.isValid).to.be.true;
  });

  async setupTestData() {
    // Create test tables and seed data
    if (restified.getDatabaseClient('postgres')) {
      await restified.executeDatabaseOperation('postgres', {
        sql: \`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        \`
      });
    }
  }

  async cleanupTestData() {
    // Clean up test data
    if (restified.getDatabaseClient('postgres')) {
      await restified.executeDatabaseOperation('postgres', {
        sql: 'DROP TABLE IF EXISTS users'
      });
    }
  }

  async resetTestData() {
    // Reset data between tests
    if (restified.getDatabaseClient('postgres')) {
      await restified.executeDatabaseOperation('postgres', {
        sql: 'TRUNCATE TABLE users RESTART IDENTITY'
      });
    }
  }
});`;
  }

  /**
   * Generate performance tests
   */
  private generatePerformanceTests(): string {
    return `/**
 * Performance Tests
 * 
 * Load and performance validation tests for ${this.context.projectName}
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${this.context.projectName} Performance Tests', function() {
  this.timeout(120000); // 2 minutes for performance tests

  after(async function() {
    await restified.cleanup();
  });

  it('should handle concurrent requests', async function() {
    const concurrentRequests = 10;
    const promises = [];

    const startTime = Date.now();

    for (let i = 0; i < concurrentRequests; i++) {
      const promise = restified
        .given()
          .useClient('api')
        .when()
          .get('/users')
          .execute();
      promises.push(promise);
    }

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Validate all requests succeeded
    for (const response of responses) {
      await response.statusCode(200).execute();
    }

    // Performance assertions
    expect(totalTime).to.be.lessThan(10000); // Should complete within 10 seconds
    console.log(\`✅ \${concurrentRequests} concurrent requests completed in \${totalTime}ms\`);
  });

  it('should meet response time SLA', async function() {
    const iterations = 20;
    const responseTimes = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/1')
          .execute();

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      await response.statusCode(200).execute();
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    console.log(\`📊 Performance metrics:\`);
    console.log(\`   Average: \${avgResponseTime.toFixed(2)}ms\`);
    console.log(\`   Min: \${minResponseTime}ms\`);
    console.log(\`   Max: \${maxResponseTime}ms\`);

    // SLA assertions
    expect(avgResponseTime).to.be.lessThan(2000); // Average under 2 seconds
    expect(maxResponseTime).to.be.lessThan(5000); // Max under 5 seconds
  });

  it('should handle load with error rate validation', async function() {
    const requestCount = 50;
    const maxAllowedErrors = 2; // 4% error rate
    const promises = [];
    let errorCount = 0;

    for (let i = 0; i < requestCount; i++) {
      const promise = restified
        .given()
          .useClient('api')
        .when()
          .get(\`/users/\${(i % 10) + 1}\`) // Vary user IDs
          .execute()
        .then(async (response) => {
          try {
            await response.statusCode(200).execute();
            return { success: true, error: null };
          } catch (error) {
            errorCount++;
            return { success: false, error: error.message };
          }
        });
      
      promises.push(promise);
    }

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const errorRate = (errorCount / requestCount) * 100;

    console.log(\`📊 Load test results:\`);
    console.log(\`   Total requests: \${requestCount}\`);
    console.log(\`   Successful: \${successCount}\`);
    console.log(\`   Errors: \${errorCount}\`);
    console.log(\`   Error rate: \${errorRate.toFixed(2)}%\`);

    expect(errorCount).to.be.lessThanOrEqual(maxAllowedErrors);
    expect(errorRate).to.be.lessThan(5); // Less than 5% error rate
  });
});`;
  }

  /**
   * Generate security tests
   */
  private generateSecurityTests(): string {
    return `/**
 * Security Tests
 * 
 * Security validation and vulnerability tests for ${this.context.projectName}
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${this.context.projectName} Security Tests', function() {
  this.timeout(60000);

  after(async function() {
    await restified.cleanup();
  });

  it('should prevent SQL injection', async function() {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await restified
      .given()
        .useClient('api')
        .query('search', maliciousInput)
      .when()
        .get('/users')
        .execute();

    // Should handle gracefully without server error
    expect([200, 400, 422]).to.include(response.getStatusCode());
    
    // Verify system is still functional
    const healthResponse = await restified
      .given()
        .useClient('api')
      .when()
        .get('/users/1')
        .execute();
    
    await healthResponse.statusCode(200).execute();
  });

  it('should validate input sanitization', async function() {
    const testInputs = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '../../etc/passwd',
      '{{7*7}}', // Template injection
      '${7*7}', // Expression injection
    ];

    for (const maliciousInput of testInputs) {
      const response = await restified
        .given()
          .useClient('api')
          .body({ name: maliciousInput })
        .when()
          .post('/users')
          .execute();

      // Should either reject input or sanitize it
      if (response.getStatusCode() === 201) {
        // If created, verify input was sanitized
        const responseBody = await response.getBody();
        expect(responseBody.name).to.not.equal(maliciousInput);
      } else {
        // Should reject with appropriate error
        expect([400, 422]).to.include(response.getStatusCode());
      }
    }
  });

  it('should enforce rate limiting', async function() {
    const requestCount = 100;
    const promises = [];
    let rateLimitedCount = 0;

    for (let i = 0; i < requestCount; i++) {
      const promise = restified
        .given()
          .useClient('api')
        .when()
          .get('/users')
          .execute()
        .then(async (response) => {
          if (response.getStatusCode() === 429) {
            rateLimitedCount++;
          }
          return response;
        });
      
      promises.push(promise);
    }

    await Promise.all(promises);

    // Should have some rate-limited responses
    expect(rateLimitedCount).to.be.greaterThan(0);
    console.log(\`🛡️  Rate limiting triggered on \${rateLimitedCount} out of \${requestCount} requests\`);
  });

  it('should validate HTTPS enforcement', async function() {
    // This test assumes the API should enforce HTTPS
    const httpUrl = this.context.baseUrl?.replace('https://', 'http://') || 'http://api.example.com';
    
    try {
      const response = await restified
        .given()
          .baseUrl(httpUrl)
        .when()
          .get('/users')
          .execute();
      
      // Should either redirect to HTTPS or reject HTTP
      if (response.getStatusCode() === 301 || response.getStatusCode() === 302) {
        const location = response.getHeader('location');
        expect(location).to.include('https://');
      } else {
        // Some APIs might reject HTTP entirely
        expect([400, 403, 426]).to.include(response.getStatusCode());
      }
    } catch (error) {
      // Connection refused is acceptable (HTTPS-only)
      expect(error.message).to.match(/ECONNREFUSED|refused|HTTPS/i);
    }
  });

  it('should validate security headers', async function() {
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .get('/users')
        .execute();

    await response.statusCode(200).execute();

    // Check for common security headers
    const headers = response.getHeaders();
    
    // These are recommendations - adjust based on your API
    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': /deny|sameorigin/i,
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': /max-age/i,
    };

    for (const [headerName, expectedValue] of Object.entries(securityHeaders)) {
      const headerValue = headers[headerName];
      if (headerValue) {
        if (expectedValue instanceof RegExp) {
          expect(headerValue).to.match(expectedValue);
        } else {
          expect(headerValue).to.equal(expectedValue);
        }
        console.log(\`✅ Security header found: \${headerName}: \${headerValue}\`);
      } else {
        console.log(\`⚠️  Missing security header: \${headerName}\`);
      }
    }
  });
});`;
  }

  /**
   * Generate GraphQL tests
   */
  private generateGraphQLTests(): string {
    return `/**
 * GraphQL Tests
 * 
 * GraphQL API tests for ${this.context.projectName}
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${this.context.projectName} GraphQL Tests', function() {
  this.timeout(30000);

  before(async function() {
    // Setup GraphQL client
    restified.createGraphQLClient('graphql', {
      endpoint: process.env.GRAPHQL_ENDPOINT || '${this.context.baseUrl}/graphql',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {{authToken}}'
      }
    });
  });

  after(async function() {
    await restified.cleanup();
  });

  it('should execute simple query', async function() {
    const query = \`
      query GetUsers {
        users {
          id
          name
          email
        }
      }
    \`;

    const response = await restified.getGraphQLClient('graphql')
      .query(query);

    expect(response.errors).to.be.undefined;
    expect(response.data).to.have.property('users');
    expect(response.data.users).to.be.an('array');
  });

  it('should execute query with variables', async function() {
    const query = \`
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
          posts {
            id
            title
          }
        }
      }
    \`;

    const variables = { id: '1' };

    const response = await restified.getGraphQLClient('graphql')
      .query(query, variables);

    expect(response.errors).to.be.undefined;
    expect(response.data).to.have.property('user');
    expect(response.data.user.id).to.equal('1');
    expect(response.data.user.posts).to.be.an('array');
  });

  it('should execute mutation', async function() {
    const mutation = \`
      mutation CreateUser($input: UserInput!) {
        createUser(input: $input) {
          id
          name
          email
          createdAt
        }
      }
    \`;

    const variables = {
      input: {
        name: 'GraphQL Test User',
        email: 'graphql@test.com'
      }
    };

    const response = await restified.getGraphQLClient('graphql')
      .mutate(mutation, variables);

    expect(response.errors).to.be.undefined;
    expect(response.data).to.have.property('createUser');
    expect(response.data.createUser.name).to.equal('GraphQL Test User');
    expect(response.data.createUser.id).to.exist;
  });

  it('should handle GraphQL errors', async function() {
    const query = \`
      query GetNonExistentUser {
        user(id: "999999") {
          id
          name
        }
      }
    \`;

    const response = await restified.getGraphQLClient('graphql')
      .query(query);

    // GraphQL can return errors in different ways
    if (response.errors) {
      expect(response.errors).to.be.an('array');
      expect(response.errors[0]).to.have.property('message');
    } else {
      // Or return null data
      expect(response.data.user).to.be.null;
    }
  });

  it('should validate schema introspection', async function() {
    const introspectionQuery = \`
      query IntrospectionQuery {
        __schema {
          types {
            name
            kind
          }
        }
      }
    \`;

    const response = await restified.getGraphQLClient('graphql')
      .query(introspectionQuery);

    if (process.env.GRAPHQL_INTROSPECTION === 'true') {
      expect(response.errors).to.be.undefined;
      expect(response.data).to.have.property('__schema');
      expect(response.data.__schema.types).to.be.an('array');
    } else {
      // Introspection might be disabled in production
      expect(response.errors || response.data.__schema).to.exist;
    }
  });
});`;
  }

  /**
   * Generate WebSocket tests
   */
  private generateWebSocketTests(): string {
    return `/**
 * WebSocket Tests
 * 
 * Real-time WebSocket communication tests for ${this.context.projectName}
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${this.context.projectName} WebSocket Tests', function() {
  this.timeout(30000);

  before(async function() {
    // Setup WebSocket client
    restified.createWebSocketClient('ws', {
      url: process.env.WEBSOCKET_URL || '${this.context.baseUrl?.replace('http', 'ws')}/ws',
      reconnectAttempts: 3,
      reconnectInterval: 1000,
      heartbeatInterval: 30000
    });
  });

  after(async function() {
    await restified.cleanup();
  });

  it('should connect to WebSocket', async function() {
    await restified.connectWebSocket('ws');
    const client = restified.getWebSocketClient('ws');
    
    expect(client.isConnected()).to.be.true;
  });

  it('should send and receive messages', async function() {
    const client = restified.getWebSocketClient('ws');
    
    const testMessage = {
      type: 'test',
      data: 'Hello WebSocket',
      timestamp: Date.now()
    };

    // Send message
    await client.sendJSON(testMessage);

    // Wait for response
    const response = await client.waitForMessage(
      (message) => {
        const data = JSON.parse(message.data);
        return data.type === 'test_response';
      },
      5000 // 5 second timeout
    );

    expect(response).to.exist;
    const responseData = JSON.parse(response.data);
    expect(responseData.type).to.equal('test_response');
  });

  it('should handle subscriptions', async function() {
    const client = restified.getWebSocketClient('ws');
    
    // Subscribe to updates
    await client.sendJSON({
      type: 'subscribe',
      channel: 'user_updates',
      userId: '1'
    });

    // Wait for subscription confirmation
    const confirmation = await client.waitForMessage(
      (message) => {
        const data = JSON.parse(message.data);
        return data.type === 'subscription_confirmed';
      },
      5000
    );

    expect(confirmation).to.exist;

    // Trigger an update via HTTP API to test real-time updates
    await restified
      .given()
        .useClient('api')
        .body({ name: 'Updated via WebSocket Test' })
      .when()
        .put('/users/1')
        .execute();

    // Wait for real-time update
    const update = await client.waitForMessage(
      (message) => {
        const data = JSON.parse(message.data);
        return data.type === 'user_update' && data.userId === '1';
      },
      10000
    );

    expect(update).to.exist;
    const updateData = JSON.parse(update.data);
    expect(updateData.data.name).to.equal('Updated via WebSocket Test');
  });

  it('should handle connection errors gracefully', async function() {
    // Disconnect
    await restified.disconnectWebSocket('ws');
    
    const client = restified.getWebSocketClient('ws');
    expect(client.isConnected()).to.be.false;

    // Reconnect
    await restified.connectWebSocket('ws');
    expect(client.isConnected()).to.be.true;
  });

  it('should validate heartbeat mechanism', async function() {
    const client = restified.getWebSocketClient('ws');
    
    // Wait for heartbeat
    const heartbeat = await client.waitForMessage(
      (message) => {
        const data = JSON.parse(message.data);
        return data.type === 'heartbeat' || data.type === 'ping';
      },
      35000 // Slightly longer than heartbeat interval
    );

    expect(heartbeat).to.exist;
    
    // Respond to heartbeat if required
    const heartbeatData = JSON.parse(heartbeat.data);
    if (heartbeatData.type === 'ping') {
      await client.sendJSON({ type: 'pong' });
    }
  });
});`;
  }

  /**
   * Get setup template based on complexity level
   */
  private getSetupTemplate(): string {
    switch (this.context.complexity) {
      case 'minimal':
        return 'global.setup.minimal.hbs';
      case 'standard':
        return 'global.setup.standard.hbs';
      case 'enterprise':
        return 'global.setup.hbs';
      default:
        return 'global.setup.minimal.hbs';
    }
  }

  /**
   * Generate global setup file
   */
  private generateGlobalSetup(): string {
    return `/**
 * Global Test Setup
 * 
 * Global configuration and setup for ${this.context.projectName} tests
 */

import { restified } from 'restifiedts';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

before(async function() {
  this.timeout(60000); // 1 minute for setup
  
  console.log('🚀 Setting up ${this.context.projectName} test environment...');
  
  try {
    // RestifiedTS doesn't need explicit configuration loading
    // Configuration is automatically loaded from restified.config.ts
    console.log('✅ Test environment setup completed');
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    console.log('📋 Using default configuration');
    // Don't throw error, let tests proceed with default config
  }
});

after(async function() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Cleanup RestifiedTS resources
    await restified.cleanup();
    
    console.log('✅ Test environment cleanup completed');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't fail the tests on cleanup errors
  }
});`;
  }
}