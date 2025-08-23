/**
 * AI-Powered Test Generator
 * 
 * Intelligently generates comprehensive test suites based on API analysis
 */

import { APIAnalysis, APIEndpoint, APIResource } from './APIDiscovery';
import { TestStrategy } from './TestStrategyAnalyzer';

export interface GeneratedTest {
  name: string;
  description: string;
  category: 'functional' | 'security' | 'performance' | 'integration';
  priority: 'high' | 'medium' | 'low';
  code: string;
  dependencies: string[];
  tags: string[];
}

export interface TestSuite {
  name: string;
  description: string;
  tests: GeneratedTest[];
  setup: string;
  teardown: string;
  fixtures: Map<string, any>;
}

export class TestGenerator {

  /**
   * Generate complete test suite based on API analysis and strategy
   */
  generateTestSuite(analysis: APIAnalysis, strategy: TestStrategy): Map<string, TestSuite> {
    const testSuites = new Map<string, TestSuite>();

    // Generate resource-based test suites
    for (const resource of analysis.resources) {
      const suite = this.generateResourceTestSuite(resource, analysis, strategy);
      testSuites.set(resource.name, suite);
    }

    // Generate cross-cutting concern test suites
    if (analysis.hasAuthEndpoints) {
      testSuites.set('authentication', this.generateAuthTestSuite(analysis, strategy));
    }

    if (strategy.testPlan.phases.some(p => p.name.includes('Performance'))) {
      testSuites.set('performance', this.generatePerformanceTestSuite(analysis, strategy));
    }

    if (strategy.testPlan.phases.some(p => p.name.includes('Security'))) {
      testSuites.set('security', this.generateSecurityTestSuite(analysis, strategy));
    }

    return testSuites;
  }

  /**
   * Generate test suite for a specific API resource
   */
  private generateResourceTestSuite(resource: APIResource, analysis: APIAnalysis, strategy: TestStrategy): TestSuite {
    const tests: GeneratedTest[] = [];

    // Generate CRUD operation tests
    const crudEndpoints = this.groupEndpointsByCrud(resource.endpoints);
    
    if (crudEndpoints.create.length > 0) {
      tests.push(...this.generateCreateTests(crudEndpoints.create, resource));
    }
    
    if (crudEndpoints.read.length > 0) {
      tests.push(...this.generateReadTests(crudEndpoints.read, resource));
    }
    
    if (crudEndpoints.update.length > 0) {
      tests.push(...this.generateUpdateTests(crudEndpoints.update, resource));
    }
    
    if (crudEndpoints.delete.length > 0) {
      tests.push(...this.generateDeleteTests(crudEndpoints.delete, resource));
    }

    // Generate validation tests
    tests.push(...this.generateValidationTests(resource.endpoints, resource));

    // Generate error handling tests
    tests.push(...this.generateErrorHandlingTests(resource.endpoints, resource));

    return {
      name: `${resource.name} Test Suite`,
      description: `Comprehensive tests for ${resource.name} resource`,
      tests,
      setup: this.generateSetupCode(resource, analysis),
      teardown: this.generateTeardownCode(resource, analysis),
      fixtures: this.generateTestFixtures(resource, analysis)
    };
  }

  /**
   * Generate authentication-specific test suite
   */
  private generateAuthTestSuite(analysis: APIAnalysis, strategy: TestStrategy): TestSuite {
    const tests: GeneratedTest[] = [];

    // Login tests
    tests.push({
      name: 'Valid Login',
      description: 'Test successful authentication with valid credentials',
      category: 'functional',
      priority: 'high',
      code: this.generateValidLoginTest(analysis),
      dependencies: [],
      tags: ['auth', 'login', 'critical']
    });

    tests.push({
      name: 'Invalid Credentials',
      description: 'Test authentication failure with invalid credentials',
      category: 'security',
      priority: 'high',
      code: this.generateInvalidLoginTest(analysis),
      dependencies: [],
      tags: ['auth', 'security', 'negative']
    });

    // Token validation tests
    if (analysis.authMethod === 'jwt') {
      tests.push({
        name: 'Token Expiration',
        description: 'Test behavior when JWT token expires',
        category: 'security',
        priority: 'medium',
        code: this.generateTokenExpirationTest(analysis),
        dependencies: ['Valid Login'],
        tags: ['auth', 'jwt', 'expiration']
      });

      tests.push({
        name: 'Invalid Token',
        description: 'Test rejection of malformed or invalid tokens',
        category: 'security',
        priority: 'high',
        code: this.generateInvalidTokenTest(analysis),
        dependencies: [],
        tags: ['auth', 'jwt', 'security']
      });
    }

    // Authorization tests
    tests.push({
      name: 'Access Control',
      description: 'Test role-based access control enforcement',
      category: 'security',
      priority: 'high',
      code: this.generateAccessControlTest(analysis),
      dependencies: ['Valid Login'],
      tags: ['auth', 'authorization', 'rbac']
    });

    return {
      name: 'Authentication Test Suite',
      description: 'Comprehensive authentication and authorization tests',
      tests,
      setup: this.generateAuthSetupCode(analysis),
      teardown: this.generateAuthTeardownCode(analysis),
      fixtures: this.generateAuthFixtures(analysis)
    };
  }

  /**
   * Generate performance test suite
   */
  private generatePerformanceTestSuite(analysis: APIAnalysis, strategy: TestStrategy): TestSuite {
    const tests: GeneratedTest[] = [];

    // Load testing
    tests.push({
      name: 'Load Testing',
      description: 'Test system performance under expected load',
      category: 'performance',
      priority: 'medium',
      code: this.generateLoadTest(analysis),
      dependencies: [],
      tags: ['performance', 'load']
    });

    // Stress testing
    tests.push({
      name: 'Stress Testing',
      description: 'Test system behavior under extreme load',
      category: 'performance',
      priority: 'medium',
      code: this.generateStressTest(analysis),
      dependencies: [],
      tags: ['performance', 'stress']
    });

    // Response time validation
    tests.push({
      name: 'Response Time SLA',
      description: 'Validate response times meet SLA requirements',
      category: 'performance',
      priority: 'high',
      code: this.generateResponseTimeTest(analysis),
      dependencies: [],
      tags: ['performance', 'sla']
    });

    return {
      name: 'Performance Test Suite',
      description: 'Performance and scalability validation tests',
      tests,
      setup: this.generatePerformanceSetupCode(analysis),
      teardown: this.generatePerformanceTeardownCode(analysis),
      fixtures: new Map()
    };
  }

  /**
   * Generate security test suite
   */
  private generateSecurityTestSuite(analysis: APIAnalysis, strategy: TestStrategy): TestSuite {
    const tests: GeneratedTest[] = [];

    // SQL Injection tests
    tests.push({
      name: 'SQL Injection Prevention',
      description: 'Test protection against SQL injection attacks',
      category: 'security',
      priority: 'high',
      code: this.generateSQLInjectionTest(analysis),
      dependencies: [],
      tags: ['security', 'sql-injection', 'owasp']
    });

    // XSS tests
    tests.push({
      name: 'XSS Prevention',
      description: 'Test protection against cross-site scripting',
      category: 'security',
      priority: 'high',
      code: this.generateXSSTest(analysis),
      dependencies: [],
      tags: ['security', 'xss', 'owasp']
    });

    // Input validation tests
    tests.push({
      name: 'Input Validation',
      description: 'Test proper input sanitization and validation',
      category: 'security',
      priority: 'medium',
      code: this.generateInputValidationTest(analysis),
      dependencies: [],
      tags: ['security', 'validation', 'sanitization']
    });

    // Rate limiting tests
    tests.push({
      name: 'Rate Limiting',
      description: 'Test API rate limiting and throttling',
      category: 'security',
      priority: 'medium',
      code: this.generateRateLimitTest(analysis),
      dependencies: [],
      tags: ['security', 'rate-limiting', 'dos']
    });

    return {
      name: 'Security Test Suite',
      description: 'Security vulnerability and compliance tests',
      tests,
      setup: this.generateSecuritySetupCode(analysis),
      teardown: this.generateSecurityTeardownCode(analysis),
      fixtures: new Map()
    };
  }

  /**
   * Group endpoints by CRUD operations
   */
  private groupEndpointsByCrud(endpoints: APIEndpoint[]) {
    return {
      create: endpoints.filter(e => e.method === 'POST'),
      read: endpoints.filter(e => e.method === 'GET'),
      update: endpoints.filter(e => ['PUT', 'PATCH'].includes(e.method)),
      delete: endpoints.filter(e => e.method === 'DELETE')
    };
  }

  /**
   * Generate CREATE operation tests
   */
  private generateCreateTests(endpoints: APIEndpoint[], resource: APIResource): GeneratedTest[] {
    return endpoints.map(endpoint => ({
      name: `Create ${resource.name}`,
      description: `Test creating a new ${resource.name} resource`,
      category: 'functional' as const,
      priority: 'high' as const,
      code: `
  it('should create ${resource.name}', async function() {
    const testData = fixtures.get('valid${resource.name}Data');
    
    const response = await restified
      .given()
        .useClient('api')
        .body(testData)
      .when()
        .post('${endpoint.path}')
        .execute();

    await response
      .statusCode(201)
      .body('id', (id) => expect(id).to.exist)
      .body('${this.getResourceNameProperty(resource)}', testData.${this.getResourceNameProperty(resource)})
      .execute();

    // Store created ID for cleanup
    const createdId = await response.extract('id');
    restified.setLocalVariable('created${resource.name}Id', createdId);
  });`,
      dependencies: [],
      tags: ['crud', 'create', 'functional']
    }));
  }

  /**
   * Generate READ operation tests
   */
  private generateReadTests(endpoints: APIEndpoint[], resource: APIResource): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    // List all resources
    const listEndpoint = endpoints.find(e => !e.path.includes('{') && !e.path.includes(':'));
    if (listEndpoint) {
      tests.push({
        name: `List All ${resource.name}s`,
        description: `Test retrieving all ${resource.name} resources`,
        category: 'functional',
        priority: 'high',
        code: `
  it('should list all ${resource.name}s', async function() {
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .get('${listEndpoint.path}')
        .execute();

    await response
      .statusCode(200)
      .body((body) => expect(body).to.be.an('array'))
      .execute();
  });`,
        dependencies: [],
        tags: ['crud', 'read', 'list']
      });
    }

    // Get single resource
    const getEndpoint = endpoints.find(e => e.path.includes('{') || e.path.includes(':'));
    if (getEndpoint) {
      tests.push({
        name: `Get ${resource.name} by ID`,
        description: `Test retrieving a specific ${resource.name} resource`,
        category: 'functional',
        priority: 'high',
        code: `
  it('should get ${resource.name} by ID', async function() {
    const testId = restified.getLocalVariable('created${resource.name}Id', '1');
    
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .get('${getEndpoint.path.replace(/{[^}]+}/g, '{{testId}}')}')
        .execute();

    await response
      .statusCode(200)
      .body('id', testId)
      .execute();
  });`,
        dependencies: [`Create ${resource.name}`],
        tags: ['crud', 'read', 'single']
      });
    }

    return tests;
  }

  /**
   * Generate UPDATE operation tests
   */
  private generateUpdateTests(endpoints: APIEndpoint[], resource: APIResource): GeneratedTest[] {
    return endpoints.map(endpoint => ({
      name: `Update ${resource.name}`,
      description: `Test updating an existing ${resource.name} resource`,
      category: 'functional' as const,
      priority: 'medium' as const,
      code: `
  it('should update ${resource.name}', async function() {
    const testId = restified.getLocalVariable('created${resource.name}Id', '1');
    const updateData = fixtures.get('update${resource.name}Data');
    
    const response = await restified
      .given()
        .useClient('api')
        .body(updateData)
      .when()
        .${endpoint.method.toLowerCase()}('${endpoint.path.replace(/{[^}]+}/g, '{{testId}}')}')
        .execute();

    await response
      .statusCode([200, 204])
      .execute();

    // Verify the update
    const verifyResponse = await restified
      .given()
        .useClient('api')
      .when()
        .get('${endpoint.path.replace(/{[^}]+}/g, '{{testId}}')}')
        .execute();

    await verifyResponse
      .statusCode(200)
      .body('${this.getResourceNameProperty(resource)}', updateData.${this.getResourceNameProperty(resource)})
      .execute();
  });`,
      dependencies: [`Create ${resource.name}`],
      tags: ['crud', 'update', 'functional']
    }));
  }

  /**
   * Generate DELETE operation tests
   */
  private generateDeleteTests(endpoints: APIEndpoint[], resource: APIResource): GeneratedTest[] {
    return endpoints.map(endpoint => ({
      name: `Delete ${resource.name}`,
      description: `Test deleting a ${resource.name} resource`,
      category: 'functional' as const,
      priority: 'medium' as const,
      code: `
  it('should delete ${resource.name}', async function() {
    const testId = restified.getLocalVariable('created${resource.name}Id', '1');
    
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .delete('${endpoint.path.replace(/{[^}]+}/g, '{{testId}}')}')
        .execute();

    await response
      .statusCode([200, 204])
      .execute();

    // Verify deletion
    const verifyResponse = await restified
      .given()
        .useClient('api')
      .when()
        .get('${endpoint.path.replace(/{[^}]+}/g, '{{testId}}')}')
        .execute();

    await verifyResponse
      .statusCode(404)
      .execute();
  });`,
      dependencies: [`Create ${resource.name}`],
      tags: ['crud', 'delete', 'functional']
    }));
  }

  /**
   * Generate validation tests
   */
  private generateValidationTests(endpoints: APIEndpoint[], resource: APIResource): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    // Required field validation
    const createEndpoint = endpoints.find(e => e.method === 'POST');
    if (createEndpoint) {
      tests.push({
        name: `${resource.name} Required Fields Validation`,
        description: `Test validation of required fields for ${resource.name}`,
        category: 'functional',
        priority: 'medium',
        code: `
  it('should validate required fields for ${resource.name}', async function() {
    const response = await restified
      .given()
        .useClient('api')
        .body({}) // Empty body to trigger validation
      .when()
        .post('${createEndpoint.path}')
        .execute();

    await response
      .statusCode(400)
      .body('error', (error) => expect(error).to.contain('required'))
      .execute();
  });`,
        dependencies: [],
        tags: ['validation', 'required', 'negative']
      });
    }

    return tests;
  }

  /**
   * Generate error handling tests
   */
  private generateErrorHandlingTests(endpoints: APIEndpoint[], resource: APIResource): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    // 404 handling
    const getEndpoint = endpoints.find(e => e.method === 'GET' && (e.path.includes('{') || e.path.includes(':')));
    if (getEndpoint) {
      tests.push({
        name: `${resource.name} Not Found Handling`,
        description: `Test proper 404 handling for non-existent ${resource.name}`,
        category: 'functional',
        priority: 'medium',
        code: `
  it('should handle ${resource.name} not found', async function() {
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .get('${getEndpoint.path.replace(/{[^}]+}/g, '999999')}') // Non-existent ID
        .execute();

    await response
      .statusCode(404)
      .body('error', (error) => expect(error).to.exist)
      .execute();
  });`,
        dependencies: [],
        tags: ['error', 'not-found', 'negative']
      });
    }

    return tests;
  }

  // Helper methods for code generation

  private generateValidLoginTest(analysis: APIAnalysis): string {
    return `
  it('should authenticate with valid credentials', async function() {
    const response = await restified
      .given()
        .useClient('api')
        .body({
          username: process.env.TEST_USERNAME || 'admin',
          password: process.env.TEST_PASSWORD || 'password123'
        })
      .when()
        .post('/auth/login')
        .execute();

    await response
      .statusCode(200)
      .body('token', (token) => expect(token).to.exist)
      .execute();

    // Store token for subsequent tests
    const authToken = await response.extract('token');
    restified.setGlobalVariable('authToken', authToken);
  });`;
  }

  private generateInvalidLoginTest(analysis: APIAnalysis): string {
    return `
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
  });`;
  }

  private generateTokenExpirationTest(analysis: APIAnalysis): string {
    return `
  it('should handle token expiration', async function() {
    // Use an expired or invalid token
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    
    const response = await restified
      .given()
        .useClient('api')
        .header('Authorization', \`Bearer \${expiredToken}\`)
      .when()
        .get('/protected-endpoint')
        .execute();

    await response
      .statusCode(401)
      .body('error', (error) => expect(error).to.contain('token'))
      .execute();
  });`;
  }

  private generateInvalidTokenTest(analysis: APIAnalysis): string {
    return `
  it('should reject invalid tokens', async function() {
    const response = await restified
      .given()
        .useClient('api')
        .header('Authorization', 'Bearer invalid.token.here')
      .when()
        .get('/protected-endpoint')
        .execute();

    await response
      .statusCode(401)
      .execute();
  });`;
  }

  private generateAccessControlTest(analysis: APIAnalysis): string {
    return `
  it('should enforce role-based access control', async function() {
    // Login as regular user
    const userToken = restified.getGlobalVariable('userToken');
    
    const response = await restified
      .given()
        .useClient('api')
        .header('Authorization', \`Bearer \${userToken}\`)
      .when()
        .get('/admin/users') // Admin-only endpoint
        .execute();

    await response
      .statusCode(403)
      .body('error', (error) => expect(error).to.contain('access'))
      .execute();
  });`;
  }

  private generateLoadTest(analysis: APIAnalysis): string {
    return `
  it('should handle expected load', async function() {
    this.timeout(60000); // 1 minute timeout
    
    const promises = [];
    const concurrentUsers = 10;
    const requestsPerUser = 5;
    
    for (let user = 0; user < concurrentUsers; user++) {
      for (let request = 0; request < requestsPerUser; request++) {
        const promise = restified
          .given()
            .useClient('api')
          .when()
            .get('/health')
            .execute()
          .then(response => response.statusCode(200).execute());
        
        promises.push(promise);
      }
    }
    
    const results = await Promise.all(promises);
    expect(results).to.have.length(concurrentUsers * requestsPerUser);
  });`;
  }

  private generateStressTest(analysis: APIAnalysis): string {
    return `
  it('should handle stress conditions', async function() {
    this.timeout(120000); // 2 minute timeout
    
    const promises = [];
    const concurrentUsers = 50;
    const requestsPerUser = 10;
    
    for (let user = 0; user < concurrentUsers; user++) {
      for (let request = 0; request < requestsPerUser; request++) {
        const promise = restified
          .given()
            .useClient('api')
          .when()
            .get('/api/endpoints')
            .execute()
          .then(response => {
            // Should either succeed or fail gracefully
            expect([200, 429, 503]).to.include(response.statusCode());
          });
        
        promises.push(promise);
      }
    }
    
    await Promise.allSettled(promises);
  });`;
  }

  private generateResponseTimeTest(analysis: APIAnalysis): string {
    return `
  it('should meet response time SLA', async function() {
    const startTime = Date.now();
    
    const response = await restified
      .given()
        .useClient('api')
      .when()
        .get('/api/users')
        .execute();

    const responseTime = Date.now() - startTime;
    
    await response
      .statusCode(200)
      .execute();
    
    // SLA: Response time should be under 2 seconds
    expect(responseTime).to.be.lessThan(2000);
  });`;
  }

  private generateSQLInjectionTest(analysis: APIAnalysis): string {
    return `
  it('should prevent SQL injection attacks', async function() {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await restified
      .given()
        .useClient('api')
        .query('search', maliciousInput)
      .when()
        .get('/api/search')
        .execute();

    await response
      .statusCode([200, 400]) // Should handle gracefully
      .execute();
    
    // Verify system is still functional
    const healthResponse = await restified
      .given()
        .useClient('api')
      .when()
        .get('/health')
        .execute();
    
    await healthResponse
      .statusCode(200)
      .execute();
  });`;
  }

  private generateXSSTest(analysis: APIAnalysis): string {
    return `
  it('should prevent XSS attacks', async function() {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await restified
      .given()
        .useClient('api')
        .body({ content: xssPayload })
      .when()
        .post('/api/comments')
        .execute();

    if (response.statusCode() === 201) {
      // If comment was created, verify XSS is sanitized
      const commentId = await response.extract('id');
      
      const getResponse = await restified
        .given()
          .useClient('api')
        .when()
          .get(\`/api/comments/\${commentId}\`)
          .execute();
      
      const content = await getResponse.extract('content');
      expect(content).to.not.contain('<script>');
    } else {
      // Should reject malicious input
      expect([400, 422]).to.include(response.statusCode());
    }
  });`;
  }

  private generateInputValidationTest(analysis: APIAnalysis): string {
    return `
  it('should validate input properly', async function() {
    const invalidInputs = [
      null,
      undefined,
      '',
      ' '.repeat(1000), // Very long string
      '\\x00\\x01\\x02', // Control characters
      'SELECT * FROM users' // SQL-like input
    ];
    
    for (const input of invalidInputs) {
      const response = await restified
        .given()
          .useClient('api')
          .body({ name: input })
        .when()
          .post('/api/users')
          .execute();
      
      // Should either accept with sanitization or reject
      expect([200, 201, 400, 422]).to.include(response.statusCode());
    }
  });`;
  }

  private generateRateLimitTest(analysis: APIAnalysis): string {
    return `
  it('should enforce rate limiting', async function() {
    this.timeout(30000); // 30 second timeout
    
    const promises = [];
    const requestCount = 100; // Exceed typical rate limits
    
    for (let i = 0; i < requestCount; i++) {
      const promise = restified
        .given()
          .useClient('api')
        .when()
          .get('/api/users')
          .execute();
      
      promises.push(promise);
    }
    
    const responses = await Promise.allSettled(promises);
    
    // Should have some rate-limited responses
    const rateLimited = responses.filter(r => 
      r.status === 'fulfilled' && r.value.statusCode() === 429
    );
    
    expect(rateLimited.length).to.be.greaterThan(0);
  });`;
  }

  // Setup and teardown code generators

  private generateSetupCode(resource: APIResource, analysis: APIAnalysis): string {
    return `
  before(async function() {
    // Setup test data for ${resource.name}
    const fixtures = new Map();
    
    fixtures.set('valid${resource.name}Data', {
      ${this.getResourceNameProperty(resource)}: 'Test ${resource.name}',
      description: 'Created by automated tests',
      active: true
    });
    
    fixtures.set('update${resource.name}Data', {
      ${this.getResourceNameProperty(resource)}: 'Updated Test ${resource.name}',
      description: 'Updated by automated tests'
    });
    
    this.fixtures = fixtures;
  });`;
  }

  private generateTeardownCode(resource: APIResource, analysis: APIAnalysis): string {
    return `
  after(async function() {
    // Clean up created test data
    const createdId = restified.getLocalVariable('created${resource.name}Id');
    if (createdId) {
      try {
        await restified
          .given()
            .useClient('api')
          .when()
            .delete('/api/${resource.name.toLowerCase()}s/{{createdId}}')
            .execute();
      } catch (error) {
        // Cleanup failed - may have been deleted by tests
        console.warn('Cleanup failed for ${resource.name} ID:', createdId);
      }
    }
  });`;
  }

  private generateTestFixtures(resource: APIResource, analysis: APIAnalysis): Map<string, any> {
    const fixtures = new Map();
    
    fixtures.set(`valid${resource.name}Data`, {
      [this.getResourceNameProperty(resource)]: `Test ${resource.name}`,
      description: 'Created by automated tests',
      active: true,
      createdAt: new Date().toISOString()
    });
    
    fixtures.set(`update${resource.name}Data`, {
      [this.getResourceNameProperty(resource)]: `Updated Test ${resource.name}`,
      description: 'Updated by automated tests',
      updatedAt: new Date().toISOString()
    });
    
    return fixtures;
  }

  private generateAuthSetupCode(analysis: APIAnalysis): string {
    return `
  before(async function() {
    // Setup authentication test data
    this.testCredentials = {
      valid: {
        username: process.env.TEST_USERNAME || 'admin',
        password: process.env.TEST_PASSWORD || 'password123'
      },
      invalid: {
        username: 'invalid_user',
        password: 'wrong_password'
      }
    };
  });`;
  }

  private generateAuthTeardownCode(analysis: APIAnalysis): string {
    return `
  after(async function() {
    // Clear stored authentication tokens
    restified.clearGlobalVariable('authToken');
    restified.clearGlobalVariable('userToken');
  });`;
  }

  private generateAuthFixtures(analysis: APIAnalysis): Map<string, any> {
    return new Map([
      ['validCredentials', {
        username: 'admin',
        password: 'password123'
      }],
      ['invalidCredentials', {
        username: 'invalid_user',
        password: 'wrong_password'
      }]
    ]);
  }

  private generatePerformanceSetupCode(analysis: APIAnalysis): string {
    return `
  before(async function() {
    // Setup performance test configuration
    this.performanceConfig = {
      responseTimeThreshold: 2000, // 2 seconds
      concurrentUsers: 10,
      requestsPerUser: 5
    };
  });`;
  }

  private generatePerformanceTeardownCode(analysis: APIAnalysis): string {
    return `
  after(async function() {
    // Performance test cleanup
    console.log('Performance tests completed');
  });`;
  }

  private generateSecuritySetupCode(analysis: APIAnalysis): string {
    return `
  before(async function() {
    // Setup security test payloads
    this.securityPayloads = {
      sqlInjection: [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "'; DELETE FROM users WHERE '1'='1'; --"
      ],
      xss: [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")'
      ]
    };
  });`;
  }

  private generateSecurityTeardownCode(analysis: APIAnalysis): string {
    return `
  after(async function() {
    // Security test cleanup
    console.log('Security tests completed');
  });`;
  }

  private getResourceNameProperty(resource: APIResource): string {
    return resource.name.toLowerCase();
  }
}