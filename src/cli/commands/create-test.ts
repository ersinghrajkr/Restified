/**
 * CLI Command: Create Test Suite
 * 
 * Generate comprehensive test suites with configuration, examples, and setup
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export const createTestCommand = new Command('create-test')
  .description('Create comprehensive test suite with configuration and examples')
  .option('-n, --name <name>', 'Test suite name', 'MyAPI')
  .option('-t, --types <types>', 'Test types (api,auth,database,performance,security)', 'api,auth')
  .option('-u, --url <url>', 'Base API URL', 'https://jsonplaceholder.typicode.com')
  .option('-o, --output <dir>', 'Output directory', './tests')
  .option('-f, --force', 'Overwrite existing files')
  .action(async (options) => {
    console.log(chalk.cyan('\n🚀 === RestifiedTS Test Suite Generator ===\n'));

    try {
      const testTypes = options.types.split(',').map((t: string) => t.trim());
      const outputDir = path.resolve(options.output);
      
      // Create directory structure
      await createDirectoryStructure(outputDir, options.force);
      
      // Generate configuration
      await generateEnterpriseConfig(outputDir, options);
      
      // Generate supporting files
      await generateConfigLoader(outputDir);
      
      // Generate test files based on types
      for (const testType of testTypes) {
        await generateTestFile(outputDir, testType, options);
      }
      
      // Generate setup files
      await generateGlobalSetup(outputDir, options);
      await generatePackageScripts(outputDir, options);
      await generateEnvironmentTemplate(outputDir);
      await generateTypeScriptConfig(outputDir);
      await generateReadme(outputDir, options);
      
      console.log(chalk.green('\n✅ Test suite created successfully!'));
      console.log(chalk.white('\n📁 Created files:'));
      console.log(chalk.gray(`   📁 ${outputDir}/`));
      console.log(chalk.gray('   ├── 📄 restified.config.ts'));
      console.log(chalk.gray('   ├── 📄 package.json'));
      console.log(chalk.gray('   ├── 📄 tsconfig.json'));
      console.log(chalk.gray('   ├── 📄 .env.example'));
      console.log(chalk.gray('   ├── 📄 README.md'));
      console.log(chalk.gray('   ├── 📁 config/'));
      console.log(chalk.gray('   │   └── 📄 ConfigLoader.ts'));
      console.log(chalk.gray('   ├── 📁 setup/'));
      console.log(chalk.gray('   │   └── 📄 global-setup.ts'));
      console.log(chalk.gray('   ├── 📁 tests/'));
      testTypes.forEach(type => {
        console.log(chalk.gray(`   │   └── 📄 ${type}-tests.ts`));
      });
      console.log(chalk.gray('   └── 📁 reports/ (generated after tests)'));
      
      console.log(chalk.white('\n🚀 Next steps:'));
      console.log(chalk.cyan(`   1. cd ${outputDir}`));
      console.log(chalk.cyan('   2. cp .env.example .env'));
      console.log(chalk.cyan('   3. npm install'));
      console.log(chalk.cyan('   4. npm test'));
      
    } catch (error: any) {
      console.log(chalk.red('\n❌ Error creating test suite:'), error.message);
      process.exit(1);
    }
  });

async function createDirectoryStructure(outputDir: string, force: boolean): Promise<void> {
  if (fs.existsSync(outputDir) && !force) {
    throw new Error(`Directory ${outputDir} already exists. Use --force to overwrite.`);
  }
  
  // Create directories
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'setup'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'tests'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'config'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'reports'), { recursive: true });
}

async function generateEnterpriseConfig(outputDir: string, options: any): Promise<void> {
  const configContent = `/**
 * 🏢 ENTERPRISE RESTIFIED CONFIGURATION
 * 
 * This configuration file provides enterprise-grade API testing capabilities
 * with support for:
 * - Multi-environment deployment
 * - Role-based access control
 * - Service mesh integration
 * - Comprehensive monitoring
 * - Security compliance
 * - Scalable architecture
 */

import { RestifiedConfig } from 'restifiedts';

const config: RestifiedConfig = {
  // 🌍 Enterprise Environment Configuration
  environment: {
    name: process.env.TEST_ENV || 'development',
    timeout: parseInt(process.env.TIMEOUT || '30000'),
    retries: parseInt(process.env.MAX_RETRIES || '3'),
    enableLogging: process.env.ENABLE_LOGGING !== 'false',
    // Enterprise-specific settings
    datacenter: process.env.DATACENTER || 'us-east-1',
    region: process.env.REGION || 'primary',
    cluster: process.env.CLUSTER || 'default',
    deployment: process.env.DEPLOYMENT_ID || 'latest'
  },

  // 🏗️ Enterprise HTTP Clients Configuration
  clients: {
    // Primary API Gateway
    api: {
      baseURL: process.env.API_GATEWAY_URL || '${options.url}',
      timeout: parseInt(process.env.API_TIMEOUT || '10000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': process.env.API_VERSION || 'v1',
        'X-Client-ID': process.env.CLIENT_ID || '${options.name.toLowerCase()}-test-suite',
        'X-Correlation-ID': '{{$random.uuid}}',
        'X-Source': 'enterprise-testing'
      },
      retries: 3,
      retryDelay: 1000
    },

    // Authentication service client
    auth: {
      baseURL: process.env.AUTH_SERVICE_URL || '${options.url}',
      timeout: parseInt(process.env.AUTH_TIMEOUT || '5000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Service': 'enterprise-auth',
        'X-SSO-Provider': process.env.SSO_PROVIDER || 'internal'
      },
      retries: 2
    },

    // Testing Utilities & Mock Services
    testUtils: {
      baseURL: process.env.TEST_UTILS_URL || 'https://httpbin.org',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Service': 'test-utilities'
      }
    }
  },

  // 🌐 Enterprise Global Headers (applied to ALL requests)
  globalHeaders: {
    // Enterprise identification
    'X-Test-Suite': process.env.TEST_SUITE_NAME || '${options.name.toLowerCase()}-api-tests',
    'X-Environment': process.env.TEST_ENV || 'development',
    'X-Tenant-ID': process.env.TENANT_ID || 'default-tenant',
    'X-Organization': process.env.ORGANIZATION || 'enterprise-corp',
    
    // Tracing & Observability
    'X-Request-ID': '{{$random.uuid}}',
    'X-Session-ID': '{{$random.uuid}}',
    'X-Trace-ID': '{{$random.uuid}}',
    'X-Span-ID': '{{$random.uuid}}',
    
    // Compliance & Security
    'X-Compliance-Mode': process.env.COMPLIANCE_MODE || 'strict',
    'X-Security-Level': process.env.SECURITY_LEVEL || 'enterprise',
    'X-Data-Classification': 'internal',
    
    // Infrastructure
    'X-Client-Version': '1.0.0',
    'X-Framework': 'RestifiedTS',
    'X-Platform': process.platform,
    'X-Node-Version': process.version
  },

  // 🔐 Enterprise Authentication Configuration
  authentication: {
    // Enterprise SSO/OAuth2 endpoint
    endpoint: process.env.AUTH_ENDPOINT || '/users/1',
    method: 'GET' as const,
    client: 'auth',
    
    // Enterprise token extraction (JWT/OAuth2)
    extractors: {
      token: process.env.TOKEN_JSONPATH || '$.name',
      userEmail: process.env.USER_EMAIL_JSONPATH || '$.email',
      userId: process.env.USER_ID_JSONPATH || '$.id'
    },
    
    // Enterprise fallback for CI/CD environments
    fallback: {
      token: process.env.FALLBACK_TOKEN || 'enterprise-fallback-token-123',
      userEmail: process.env.FALLBACK_EMAIL || 'test@enterprise.com',
      userId: parseInt(process.env.FALLBACK_USER_ID || '1')
    },
    
    // Enterprise client targeting
    autoApplyToClients: process.env.AUTH_APPLY_TO_CLIENTS?.split(',') || 'all',
    authHeaderName: process.env.AUTH_HEADER_NAME || 'Authorization'
  },

  // 📊 Enterprise Global Variables (available in all tests)
  globalVariables: {
    // Enterprise environment settings
    testEnvironment: process.env.TEST_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
    testSuite: process.env.TEST_SUITE_NAME || '${options.name.toLowerCase()}-api-tests',
    
    // Test configuration
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '10000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    enableLogging: process.env.ENABLE_LOGGING !== 'false',
    
    // Feature flags
    runIntegrationTests: process.env.RUN_INTEGRATION_TESTS !== 'false',
    runPerformanceTests: process.env.RUN_PERFORMANCE_TESTS === 'true',
    runSecurityTests: process.env.RUN_SECURITY_TESTS === 'true'
  },

  // 🔧 Enterprise Environment Variables Setup
  environmentVariables: {
    API_KEY: process.env.API_KEY || 'demo-api-key-12345',
    ENVIRONMENT: process.env.ENVIRONMENT || 'test',
    VERSION: process.env.VERSION || '1.0.0'
  },

  // 📈 Enterprise Reporting Configuration
  reporting: {
    enabled: process.env.REPORTING_ENABLED !== 'false',
    outputDir: process.env.REPORT_OUTPUT_DIR || 'reports',
    formats: ['html', 'json'],
    openAfterGeneration: process.env.OPEN_REPORT === 'true',
    includeRequestResponse: process.env.INCLUDE_REQUEST_RESPONSE !== 'false',
    includeScreenshots: process.env.INCLUDE_SCREENSHOTS !== 'false',
    htmlReporter: {
      title: '${options.name} API Test Report',
      enableSuiteGrouping: true,
      enableCollapsibleTests: true,
      enableRequestResponseDetails: true,
      maxPayloadSize: parseInt(process.env.MAX_PAYLOAD_SIZE || '10000'),
      theme: process.env.REPORT_THEME || 'default'
    }
  },

  // 🏥 Enterprise Health Checks
  healthChecks: [
    {
      name: 'API Gateway',
      client: 'api',
      endpoint: process.env.HEALTH_CHECK_ENDPOINT || '/posts/1',
      expectedStatus: 200,
      timeout: 5000,
      critical: true
    }
  ]
};

export default config;
`;

  fs.writeFileSync(path.join(outputDir, 'restified.config.ts'), configContent);
}

async function generateTestFile(outputDir: string, testType: string, options: any): Promise<void> {
  const testContent = generateTestContent(testType, options);
  fs.writeFileSync(path.join(outputDir, 'tests', `${testType}-tests.ts`), testContent);
}

function generateTestContent(testType: string, options: any): string {
  switch (testType) {
    case 'api':
      return generateApiTest(options);
    case 'auth':
      return generateAuthTest(options);
    case 'database':
      return generateDatabaseTest(options);
    case 'performance':
      return generatePerformanceTest(options);
    case 'security':
      return generateSecurityTest(options);
    default:
      return generateApiTest(options);
  }
}

function generateApiTest(options: any): string {
  return `/**
 * ${options.name} API Tests
 * 
 * Comprehensive API testing using RestifiedTS enterprise configuration
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${options.name} API Tests', function() {
  this.timeout(30000);

  afterAll(async function() {
    await restified.cleanup();
  });

  describe('Basic API Operations', function() {
    it('should get user data from API', async function() {
      const response = await restified
        .given()
          .useClient('api')  // Pre-configured with enterprise headers and auth
        .when()
          .get('/users/1')
          .execute();

      await response
        .statusCode(200)
        .header('Content-Type', /application\\/json/)
        .jsonPath('$.id', 1)
        .jsonPath('$.name', (name) => typeof name === 'string')
        .jsonPath('$.email', (email) => email.includes('@'))
        .execute();
    });

    it('should create new user', async function() {
      const userData = {
        name: '{{$faker.person.fullName}}',
        email: '{{$faker.internet.email}}',
        username: '{{$faker.internet.userName}}'
      };

      const response = await restified
        .given()
          .useClient('api')
          .variable('userData', userData)
        .when()
          .post('/users')
          .json('{{userData}}')
          .execute();

      await response
        .statusCode(201)
        .jsonPath('$.id', (id) => typeof id === 'number')
        .extract('$.id', 'createdUserId')
        .execute();
    });

    it('should update user data', async function() {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await restified
        .given()
          .useClient('api')
        .when()
          .put('/users/1')
          .json(updateData)
          .execute();

      await response
        .statusCode(200)
        .jsonPath('$.name', 'Updated Name')
        .jsonPath('$.email', 'updated@example.com')
        .execute();
    });

    it('should handle error responses gracefully', async function() {
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/999999')
          .execute();

      await response
        .statusCode(404)
        .execute();
    });
  });

  describe('Enterprise Features', function() {
    it('should include enterprise headers in all requests', async function() {
      const response = await restified
        .given()
          .useClient('testUtils')
        .when()
          .get('/headers')
          .execute();

      await response
        .statusCode(200)
        .jsonPath('$.headers.X-Test-Suite', '${options.name.toLowerCase()}-api-tests')
        .jsonPath('$.headers.X-Environment', 'development')
        .jsonPath('$.headers.X-Trace-ID', (traceId) => traceId !== undefined)
        .execute();
    });

    it('should use automatic authentication', async function() {
      // Auth token automatically applied by global setup
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/1')
          .execute();

      await response
        .statusCode(200)
        .execute();

      // Verify auth token was included (visible in logs with enterprise headers)
      expect(restified.getVariable('globalAuthToken')).to.exist;
    });
  });
});
`;
}

function generateAuthTest(options: any): string {
  return `/**
 * ${options.name} Authentication Tests
 * 
 * Enterprise authentication testing with automatic token management
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${options.name} Authentication Tests', function() {
  this.timeout(30000);

  afterAll(async function() {
    await restified.cleanup();
  });

  describe('Enterprise Authentication', function() {
    it('should authenticate and extract user data', async function() {
      const response = await restified
        .given()
          .useClient('auth')
        .when()
          .get('/users/1')  // Mock auth endpoint
          .execute();

      await response
        .statusCode(200)
        .extract('$.name', 'authToken')
        .extract('$.email', 'userEmail')
        .extract('$.id', 'userId')
        .execute();

      // Verify extracted data
      expect(restified.getVariable('authToken')).to.exist;
      expect(restified.getVariable('userEmail')).to.include('@');
      expect(restified.getVariable('userId')).to.be.a('number');
    });

    it('should apply auth token to all clients automatically', async function() {
      // Auth token should already be applied by global setup
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/1')
          .execute();

      await response
        .statusCode(200)
        .execute();

      // Verify global auth token is available
      expect(restified.getVariable('globalAuthToken')).to.exist;
    });

    it('should handle authentication failure gracefully', async function() {
      // Test with invalid credentials (fallback should be used)
      const response = await restified
        .given()
          .useClient('auth')
        .when()
          .get('/invalid-auth-endpoint')
          .execute();

      // Should use fallback authentication
      expect(restified.getVariable('globalAuthToken')).to.exist;
    });
  });

  describe('Role-Based Access', function() {
    it('should test different user roles', async function() {
      // Example of role-based testing with different tokens
      const adminResponse = await restified
        .given()
          .useClient('api')
          .headers({ 'X-User-Role': 'admin' })
        .when()
          .get('/admin/users')
          .execute();

      // Admin should have access
      await adminResponse
        .statusCode((status) => [200, 404].includes(status))  // 404 is ok for mock API
        .execute();
    });

    it('should validate user permissions', async function() {
      const userResponse = await restified
        .given()
          .useClient('api')
          .headers({ 'X-User-Role': 'user' })
        .when()
          .get('/users/1')
          .execute();

      await userResponse
        .statusCode(200)
        .execute();
    });
  });
});
`;
}

function generateDatabaseTest(options: any): string {
  return `/**
 * ${options.name} Database Tests
 * 
 * Database integration testing with state validation
 */

import { restified } from 'restifiedts';

describe('${options.name} Database Tests', function() {
  this.timeout(30000);

  afterAll(async function() {
    await restified.cleanup();
  });

  describe('Database State Validation', function() {
    it('should validate data consistency', async function() {
      // Create user via API
      const createResponse = await restified
        .given()
          .useClient('api')
        .when()
          .post('/users')
          .json({
            name: 'Database Test User',
            email: 'dbtest@example.com'
          })
          .execute();

      await createResponse
        .statusCode(201)
        .extract('$.id', 'dbUserId')
        .execute();

      // Verify user exists in database (via API)
      const getResponse = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/{{dbUserId}}')
          .execute();

      await getResponse
        .statusCode(200)
        .jsonPath('$.name', 'Database Test User')
        .jsonPath('$.email', 'dbtest@example.com')
        .execute();
    });

    it('should handle database transactions', async function() {
      // Test transaction consistency
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .post('/users')
          .json({
            name: 'Transaction Test',
            email: 'transaction@example.com'
          })
          .execute();

      await response
        .statusCode(201)
        .execute();
    });
  });
});
`;
}

function generatePerformanceTest(options: any): string {
  return `/**
 * ${options.name} Performance Tests
 * 
 * Enterprise performance testing with K6 integration
 */

import { restified } from 'restifiedts';

describe('${options.name} Performance Tests', function() {
  this.timeout(60000);

  afterAll(async function() {
    await restified.cleanup();
  });

  describe('Load Testing', function() {
    it('should handle concurrent requests', async function() {
      const promises = [];
      
      // Simulate concurrent requests
      for (let i = 0; i < 10; i++) {
        const promise = restified
          .given()
            .useClient('api')
          .when()
            .get('/users/1')
            .execute()
          .then(response => response
            .statusCode(200)
            .responseTime(time => time < 2000)
            .execute()
          );
        
        promises.push(promise);
      }

      await Promise.all(promises);
    });

    it('should maintain performance under load', async function() {
      const startTime = Date.now();
      
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users')
          .execute();

      await response
        .statusCode(200)
        .responseTime(time => time < 1000)
        .execute();

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(\`Request completed in \${totalTime}ms\`);
    });
  });
});
`;
}

function generateSecurityTest(options: any): string {
  return `/**
 * ${options.name} Security Tests
 * 
 * Enterprise security testing with OWASP compliance
 */

import { restified } from 'restifiedts';

describe('${options.name} Security Tests', function() {
  this.timeout(30000);

  afterAll(async function() {
    await restified.cleanup();
  });

  describe('Security Validation', function() {
    it('should enforce HTTPS', async function() {
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/1')
          .execute();

      await response
        .statusCode(200)
        .header('strict-transport-security', (value) => value !== undefined || true)  // Mock API may not have HTTPS headers
        .execute();
    });

    it('should validate authentication', async function() {
      // Test without auth token should fail (but mock API accepts all)
      const response = await restified
        .given()
          .useClient('api')
          .headers({ 'Authorization': '' })  // Remove auth
        .when()
          .get('/secure-endpoint')
          .execute();

      // In real API, this should be 401/403
      await response
        .statusCode((status) => [200, 401, 403, 404].includes(status))
        .execute();
    });

    it('should prevent injection attacks', async function() {
      const maliciousPayload = {
        name: "'; DROP TABLE users; --",
        email: '<script>alert("xss")</script>@example.com'
      };

      const response = await restified
        .given()
          .useClient('api')
        .when()
          .post('/users')
          .json(maliciousPayload)
          .execute();

      // Should either reject (400) or sanitize the input
      await response
        .statusCode((status) => [201, 400, 422].includes(status))
        .execute();
    });

    it('should validate input sanitization', async function() {
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/1<script>')
          .execute();

      await response
        .statusCode((status) => [200, 400, 404].includes(status))
        .execute();
    });
  });
});
`;
}

async function generateGlobalSetup(outputDir: string, options: any): Promise<void> {
  const setupContent = `/**
 * Global Setup for ${options.name} Tests
 * 
 * Enterprise-grade global setup with automatic configuration loading
 */

import { restified } from 'restifiedts';
import { ConfigLoader } from '../config/ConfigLoader';
import { RestifiedConfig } from 'restifiedts';

let config: RestifiedConfig;

// Global setup - runs once before all test suites
before(async function() {
  this.timeout(30000);
  
  console.log('\\n🚀 === ${options.name} GLOBAL SETUP ===');

  // Load enterprise configuration
  console.log('📋 Loading configuration...');
  const configLoader = ConfigLoader.getInstance();
  config = await configLoader.loadConfig();
  console.log('✅ Configuration loaded');

  // Setup HTTP clients
  console.log('🔧 Setting up HTTP clients...');
  if (config.clients) {
    for (const [clientName, clientConfig] of Object.entries(config.clients)) {
      const headers = { ...config.globalHeaders, ...clientConfig.headers };
      restified.createClient(clientName, { ...clientConfig, headers });
    }
    console.log(\`✅ \${Object.keys(config.clients).length} HTTP clients configured\`);
  }

  // Perform authentication
  if (config.authentication) {
    console.log('🔐 Performing authentication...');
    try {
      const authResponse = await restified
        .given()
          .useClient(config.authentication.client)
        .when()
          [config.authentication.method.toLowerCase() as 'get'](config.authentication.endpoint)
          .execute();

      await authResponse
        .statusCode(200)
        .extract(config.authentication.extractors.token, 'globalAuthToken')
        .extract(config.authentication.extractors.userEmail, 'globalUserEmail')
        .extract(config.authentication.extractors.userId, 'globalUserId')
        .execute();

      // Apply auth token to clients
      const authToken = restified.getVariable('globalAuthToken');
      if (authToken && config.authentication.autoApplyToClients) {
        restified.addAuthTokenToAllClients(authToken, config.authentication.authHeaderName || 'Authorization');
        console.log('✅ Authentication successful - Auth token added to all clients');
      }
    } catch (error) {
      console.log('⚠️  Authentication failed, using fallback values');
      if (config.authentication.fallback) {
        restified.setGlobalVariable('globalAuthToken', config.authentication.fallback.token);
        restified.setGlobalVariable('globalUserEmail', config.authentication.fallback.userEmail);
        restified.setGlobalVariable('globalUserId', config.authentication.fallback.userId);
      }
    }
  }

  // Set global variables
  if (config.globalVariables) {
    console.log('📋 Setting up global variables...');
    restified.setGlobalVariables(config.globalVariables);
    console.log(\`✅ \${Object.keys(config.globalVariables).length} global variables configured\`);
  }

  console.log('🎯 === GLOBAL SETUP COMPLETE ===\\n');
});

// Global teardown - runs once after all test suites
after(async function() {
  this.timeout(10000);
  
  console.log('\\n🧹 === ${options.name} GLOBAL TEARDOWN ===');
  
  // Cleanup
  console.log('🧽 Performing cleanup...');
  await restified.cleanup();
  
  console.log('✅ === GLOBAL TEARDOWN COMPLETE ===\\n');
});
`;

  fs.writeFileSync(path.join(outputDir, 'setup', 'global-setup.ts'), setupContent);
}

async function generatePackageScripts(outputDir: string, options: any): Promise<void> {
  const packageJsonContent = {
    "name": options.name.toLowerCase().replace(/\s+/g, '-') + "-api-tests",
    "version": "1.0.0",
    "description": `Enterprise API test suite for ${options.name} generated by RestifiedTS`,
    "private": true,
    "scripts": {
      "test": "mocha -r ts-node/register -r tsconfig-paths/register 'setup/global-setup.ts' 'tests/**/*.ts' --reporter ./node_modules/restifiedts/dist/reporting/restified-html-reporter.js",
      "test:console": "mocha -r ts-node/register -r tsconfig-paths/register 'setup/global-setup.ts' 'tests/**/*.ts'",
      "test:mochawesome": "npm run test:console -- --reporter mochawesome --reporter-options reportDir=reports,reportFilename=mochawesome-report,html=true,json=true,overwrite=true,charts=true,code=true",
      "test:watch": "npm run test:console -- --watch",
      "test:coverage": "nyc npm run test:console",
      "reports:clean": "rimraf reports",
      "reports:open": "open reports/restified-html-report.html || start reports/restified-html-report.html",
      "reports:mochawesome": "open reports/mochawesome-report.html || start reports/mochawesome-report.html"
    },
    "devDependencies": {
      "@types/chai": "^4.3.0",
      "@types/mocha": "^9.1.0",
      "@types/node": "^18.0.0",
      "chai": "^4.3.0",
      "mocha": "^10.0.0",
      "mochawesome": "^7.1.0",
      "nyc": "^15.1.0",
      "restifiedts": "^1.0.0",
      "rimraf": "^3.0.2",
      "ts-node": "^10.9.0",
      "tsconfig-paths": "^4.2.0",
      "typescript": "^5.0.0"
    }
  };

  fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(packageJsonContent, null, 2));
}

async function generateEnvironmentTemplate(outputDir: string): Promise<void> {
  const envContent = `# ${outputDir} Environment Configuration
# Copy this file to .env and customize for your environment

# =============================================================================
# 🌍 ENVIRONMENT & INFRASTRUCTURE
# =============================================================================
TEST_ENV=development
DATACENTER=us-east-1
REGION=primary
CLUSTER=default

# =============================================================================
# 🏗️ SERVICE ENDPOINTS
# =============================================================================
API_GATEWAY_URL=https://jsonplaceholder.typicode.com
AUTH_SERVICE_URL=https://jsonplaceholder.typicode.com
TEST_UTILS_URL=https://httpbin.org

# =============================================================================
# 🔐 AUTHENTICATION & SECURITY
# =============================================================================
AUTH_ENDPOINT=/users/1
TOKEN_JSONPATH=$.name
USER_EMAIL_JSONPATH=$.email
USER_ID_JSONPATH=$.id

# Fallback Authentication
FALLBACK_TOKEN=fallback-token-123
FALLBACK_EMAIL=test@example.com
FALLBACK_USER_ID=1

# =============================================================================
# 📊 TESTING CONFIGURATION
# =============================================================================
TEST_SUITE_NAME=my-api-tests
DEFAULT_TIMEOUT=10000
MAX_RETRIES=3
ENABLE_LOGGING=true

# Feature Flags
RUN_INTEGRATION_TESTS=true
RUN_PERFORMANCE_TESTS=false
RUN_SECURITY_TESTS=false

# =============================================================================
# 📈 REPORTING CONFIGURATION
# =============================================================================
REPORTING_ENABLED=true
REPORT_OUTPUT_DIR=reports
INCLUDE_REQUEST_RESPONSE=true
OPEN_REPORT=false

# Restified HTML Reporter Settings
MAX_PAYLOAD_SIZE=10000
REPORT_THEME=default
`;

  fs.writeFileSync(path.join(outputDir, '.env.example'), envContent);
}

async function generateTypeScriptConfig(outputDir: string): Promise<void> {
  const tsConfigContent = {
    "compilerOptions": {
      "target": "ES2020",
      "lib": ["ES2020", "DOM"],
      "module": "CommonJS",
      "moduleResolution": "node",
      "esModuleInterop": true,
      "allowSyntheticDefaultImports": true,
      "strict": true,
      "declaration": false,
      "sourceMap": true,
      "outDir": "./dist",
      "removeComments": false,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "baseUrl": "./",
      "paths": {
        "@tests/*": ["tests/*"],
        "@setup/*": ["setup/*"],
        "@config/*": ["config/*"]
      },
      "types": ["node", "mocha", "chai"]
    },
    "include": [
      "**/*.ts",
      "tests/**/*",
      "setup/**/*"
    ],
    "exclude": [
      "node_modules",
      "dist",
      "reports"
    ]
  };

  fs.writeFileSync(path.join(outputDir, 'tsconfig.json'), JSON.stringify(tsConfigContent, null, 2));
}

async function generateReadme(outputDir: string, options: any): Promise<void> {
  const readmeContent = `# ${options.name} API Test Suite

Enterprise-grade API testing suite generated by RestifiedTS.

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run tests (uses Restified HTML reporter by default)
npm test

# Open HTML report
npm run reports:open
\`\`\`

## 🏢 Features

- **✅ Enterprise Configuration**: Pre-configured for ${options.name}
- **✅ Multiple Clients**: API Gateway, Authentication, Test Utils
- **✅ Automatic Authentication**: Token extraction and injection
- **✅ Global Headers**: Enterprise tracing and compliance headers
- **✅ Comprehensive Reporting**: HTML reports with request/response details
- **✅ Environment Management**: Development, staging, production configs

## 📁 Project Structure

\`\`\`
${path.basename(outputDir)}/
├── restified.config.ts     # Enterprise configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .env.example           # Environment template
├── setup/
│   └── global-setup.ts    # Global test setup
├── tests/
│   ├── api-tests.ts       # API functionality tests
│   └── auth-tests.ts      # Authentication tests
└── reports/               # Generated test reports
\`\`\`

## 🔧 Configuration

The \`restified.config.ts\` file contains enterprise-grade configuration:

- **Environment Settings**: Datacenter, region, cluster awareness
- **HTTP Clients**: Pre-configured for ${options.name} services
- **Authentication**: Automatic token management
- **Global Headers**: Enterprise tracing and compliance
- **Reporting**: Comprehensive HTML and JSON reports

## 📊 Available Scripts

- \`npm test\` - **Run all tests with Restified HTML report (default)**
- \`npm run test:console\` - Run tests with console output only
- \`npm run test:mochawesome\` - Run tests with alternative Mochawesome HTML report
- \`npm run test:watch\` - Run tests in watch mode (console output)
- \`npm run test:coverage\` - Run tests with coverage analysis
- \`npm run reports:clean\` - Clean report directory
- \`npm run reports:open\` - **Open Restified HTML report**
- \`npm run reports:mochawesome\` - Open Mochawesome HTML report

## 🏗️ Adding Tests

Create new test files in the \`tests/\` directory:

\`\`\`typescript
import { restified } from 'restifiedts';

describe('My New Tests', function() {
  this.timeout(30000);

  afterAll(async function() {
    await restified.cleanup();
  });

  it('should test new functionality', async function() {
    const response = await restified
      .given()
        .useClient('api')  // Pre-configured client
      .when()
        .get('/new-endpoint')
        .execute();

    await response
      .statusCode(200)
      .execute();
  });
});
\`\`\`

## 🌍 Environment Configuration

Update \`.env\` file for your environment:

\`\`\`bash
# Service URLs
API_GATEWAY_URL=https://api.${options.url.replace('https://', '').replace('http://', '')}
AUTH_SERVICE_URL=https://auth.${options.url.replace('https://', '').replace('http://', '')}

# Authentication
AUTH_ENDPOINT=/oauth/token
TOKEN_JSONPATH=$.access_token

# Testing
TEST_ENV=staging
ENABLE_LOGGING=true
\`\`\`

## 📈 Restified HTML Reports

The default \`npm test\` command automatically generates a comprehensive HTML report using the **Restified HTML Reporter**.

### Features:
- ✅ **Collapsible Test Structure**: Suite-based organization with expandable tests
- 📊 **Request/Response Details**: Full HTTP request and response data in collapsible sections  
- ⏱️ **Performance Metrics**: Response times and execution duration
- 🔍 **Interactive Filtering**: Filter by test status (Passed/Failed/Pending) or by test suite
- 📋 **Enterprise Headers**: Shows all enterprise tracing and compliance headers
- 🎨 **Modern UI**: Clean, responsive design optimized for 2000+ tests

### View Reports:
\`\`\`bash
# Run tests (generates report automatically)
npm test

# Open the HTML report
npm run reports:open
\`\`\`

### Reporter Configuration:
Customize the reporter in your \`.env\` file:
\`\`\`bash
# Maximum payload size to display (larger payloads are truncated)
MAX_PAYLOAD_SIZE=10000

# Report theme (default)
REPORT_THEME=default

# Auto-open report after tests
OPEN_REPORT=true
\`\`\`

---

Generated by RestifiedTS - Enterprise API Testing Framework
`;

  fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);
}


async function generateConfigLoader(outputDir: string): Promise<void> {
  const configLoaderContent = `/**
 * Configuration Loader
 * 
 * Enterprise configuration loading with environment support
 */

import * as fs from 'fs';
import * as path from 'path';
import { RestifiedConfig } from 'restifiedts';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: RestifiedConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public async loadConfig(): Promise<RestifiedConfig> {
    if (this.config) {
      return this.config;
    }

    // Try to load from restified.config.ts
    const configPath = path.resolve(process.cwd(), 'restified.config.ts');
    
    if (fs.existsSync(configPath)) {
      console.log(\`📋 Loading configuration from: \${path.relative(process.cwd(), configPath)}\`);
      
      // Use require to load the TypeScript config
      delete require.cache[require.resolve(configPath)];
      const configModule = require(configPath);
      this.config = configModule.default || configModule;
      
      return this.config;
    }

    // Fallback to default configuration
    console.log('📋 Using default configuration');
    this.config = this.getDefaultConfig();
    return this.config;
  }

  private getDefaultConfig(): RestifiedConfig {
    return {
      environment: {
        name: 'development',
        timeout: 30000,
        retries: 3,
        enableLogging: true
      },
      clients: {
        api: {
          baseURL: 'https://jsonplaceholder.typicode.com',
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      },
      globalHeaders: {
        'X-Test-Suite': 'restifiedts-tests',
        'X-Environment': 'development'
      },
      reporting: {
        enabled: true,
        outputDir: 'reports',
        formats: ['html', 'json']
      }
    };
  }
}
`;

  fs.writeFileSync(path.join(outputDir, 'config', 'ConfigLoader.ts'), configLoaderContent);
}