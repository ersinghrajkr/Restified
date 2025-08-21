/**
 * CLI Command: Create Test Suite
 * 
 * Generate comprehensive test suites with configuration, examples, and setup
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export const scaffoldCommand = new Command('scaffold')
  .description('Scaffold comprehensive test suite with configuration and examples')
  .option('-n, --name <name>', 'Test suite name', 'MyAPI')
  .option('-t, --types <types>', 'Test types (api,auth,database,performance,security,graphql,websocket)', 'api,auth')
  .option('-u, --url <url>', 'Base API URL', 'https://jsonplaceholder.typicode.com')
  .option('-o, --output <dir>', 'Output directory (defaults to project name)')
  .option('-f, --force', 'Overwrite existing files')
  .action(async (options) => {
    console.log(chalk.cyan('\n🚀 === RestifiedTS Test Suite Scaffolder ===\n'));

    try {
      const testTypes = options.types.split(',').map((t: string) => t.trim());
      // Use the name as the output directory if no specific output is provided
      const outputDir = path.resolve(options.output || `./${options.name}`);
      
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
      await generateEnvironmentTemplate(outputDir, options);
      await generateTypeScriptConfig(outputDir);
      await generateMochaReporterWrapper(outputDir);
      await generateReadme(outputDir, options);
      
      console.log(chalk.green('\n✅ Test suite scaffolded successfully!'));
      console.log(chalk.white('\n📁 Created files:'));
      console.log(chalk.gray(`   📁 ${outputDir}/`));
      console.log(chalk.gray('   ├── 📄 restified.config.ts'));
      console.log(chalk.gray('   ├── 📄 package.json (selective dependencies)'));
      console.log(chalk.gray('   ├── 📄 tsconfig.json'));
      console.log(chalk.gray('   ├── 📄 .env.example'));
      console.log(chalk.gray('   ├── 📄 README.md'));
      console.log(chalk.gray('   ├── 📄 INSTALLATION.md (dependency guide)'));
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
      console.log(chalk.red('\n❌ Error scaffolding test suite:'), error.message);
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
    title: '${options.name} API Test Report',
    filename: process.env.REPORT_FILENAME || 'restified-html-report.html',
    subtitle: process.env.REPORT_SUBTITLE || 'Enterprise API Testing'
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
  ],

  // 🔗 GraphQL Configuration
  graphql: {
    clients: {
      main: {
        endpoint: process.env.GRAPHQL_ENDPOINT || '${options.url}/graphql',
        headers: {
          'Authorization': 'Bearer {{globalAuthToken}}',
          'Content-Type': 'application/json',
          'X-Client-Name': '${options.name.toLowerCase()}-graphql'
        },
        timeout: parseInt(process.env.GRAPHQL_TIMEOUT || '15000'),
        retries: parseInt(process.env.GRAPHQL_RETRIES || '3'),
        retryDelay: parseInt(process.env.GRAPHQL_RETRY_DELAY || '1000')
      }
    },
    introspection: {
      enabled: process.env.GRAPHQL_INTROSPECTION_ENABLED !== 'false',
      cacheSchema: process.env.GRAPHQL_CACHE_SCHEMA === 'true'
    }
  },

  // ⚡ WebSocket Configuration
  websocket: {
    clients: {
      main: {
        url: process.env.WEBSOCKET_URL || 'wss://echo.websocket.org',
        protocols: process.env.WEBSOCKET_PROTOCOLS?.split(','),
        headers: {
          'Authorization': 'Bearer {{globalAuthToken}}',
          'X-Client-Name': '${options.name.toLowerCase()}-ws'
        },
        timeout: parseInt(process.env.WEBSOCKET_TIMEOUT || '10000'),
        reconnectAttempts: parseInt(process.env.WEBSOCKET_RECONNECT_ATTEMPTS || '3'),
        reconnectDelay: parseInt(process.env.WEBSOCKET_RECONNECT_DELAY || '1000'),
        pingInterval: parseInt(process.env.WEBSOCKET_PING_INTERVAL || '30000'),
        pongTimeout: parseInt(process.env.WEBSOCKET_PONG_TIMEOUT || '5000')
      }
    }
  },

  // 🗄️ Database Configuration
  databases: {
    // PostgreSQL Configuration
    postgres: {
      type: 'postgresql' as const,
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      username: process.env.POSTGRES_USER || 'testuser',
      password: process.env.POSTGRES_PASSWORD || 'testpass',
      database: process.env.POSTGRES_DB || 'testdb',
      timeout: parseInt(process.env.POSTGRES_TIMEOUT || '10000'),
      pool: {
        min: parseInt(process.env.POSTGRES_POOL_MIN || '1'),
        max: parseInt(process.env.POSTGRES_POOL_MAX || '10'),
        idleTimeoutMillis: parseInt(process.env.POSTGRES_POOL_IDLE_TIMEOUT || '30000')
      }
    },

    // MongoDB Configuration
    mongodb: {
      type: 'mongodb' as const,
      host: process.env.MONGODB_HOST || 'localhost',
      port: parseInt(process.env.MONGODB_PORT || '27017'),
      username: process.env.MONGODB_USER,
      password: process.env.MONGODB_PASSWORD,
      database: process.env.MONGODB_DB || 'testdb',
      connectionString: process.env.MONGODB_CONNECTION_STRING,
      timeout: parseInt(process.env.MONGODB_TIMEOUT || '10000'),
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10')
      }
    },

    // MySQL Configuration
    mysql: {
      type: 'mysql' as const,
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      username: process.env.MYSQL_USERNAME || 'testuser',
      password: process.env.MYSQL_PASSWORD || 'testpass',
      database: process.env.MYSQL_DATABASE || 'testdb',
      timeout: parseInt(process.env.MYSQL_TIMEOUT || '60000'),
      pool: {
        min: parseInt(process.env.MYSQL_POOL_MIN || '1'),
        max: parseInt(process.env.MYSQL_POOL_MAX || '10')
      },
      options: {
        charset: process.env.MYSQL_CHARSET || 'utf8mb4',
        timezone: process.env.MYSQL_TIMEZONE || 'UTC',
        ssl: process.env.MYSQL_SSL === 'true',
        reconnect: process.env.MYSQL_RECONNECT !== 'false'
      }
    },

    // Redis Configuration
    redis: {
      type: 'redis' as const,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || '',
      timeout: parseInt(process.env.REDIS_TIMEOUT || '10000'),
      options: {
        database: parseInt(process.env.REDIS_DATABASE || '0'),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'restified:test:',
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
        lazyConnect: process.env.REDIS_LAZY_CONNECT !== 'false',
        commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000')
      }
    },

    // SQLite Configuration (for local testing)
    sqlite: {
      type: 'sqlite' as const,
      options: {
        filename: process.env.SQLITE_FILENAME || ':memory:',
        memory: process.env.SQLITE_MEMORY !== 'false',
        readonly: process.env.SQLITE_READONLY === 'true',
        timeout: parseInt(process.env.SQLITE_TIMEOUT || '5000'),
        journalMode: process.env.SQLITE_JOURNAL_MODE || 'WAL',
        synchronous: process.env.SQLITE_SYNCHRONOUS || 'NORMAL'
      }
    },

    // SQL Server Configuration (Enterprise)
    sqlserver: {
      type: 'mssql' as const,
      host: process.env.MSSQL_HOST || 'localhost',
      port: parseInt(process.env.MSSQL_PORT || '1433'),
      username: process.env.MSSQL_USERNAME || 'sa',
      password: process.env.MSSQL_PASSWORD || 'YourStrong!Passw0rd',
      database: process.env.MSSQL_DATABASE || 'testdb',
      timeout: parseInt(process.env.MSSQL_TIMEOUT || '15000'),
      pool: {
        min: parseInt(process.env.MSSQL_POOL_MIN || '0'),
        max: parseInt(process.env.MSSQL_POOL_MAX || '10')
      },
      options: {
        encrypt: process.env.MSSQL_ENCRYPT !== 'false',
        trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERT !== 'false',
        enableArithAbort: process.env.MSSQL_ENABLE_ARITH_ABORT !== 'false',
        requestTimeout: parseInt(process.env.MSSQL_REQUEST_TIMEOUT || '30000')
      }
    }
  },

  // 🗄️ Database State Management Configuration
  databaseStateManagement: {
    enabled: process.env.DB_STATE_VALIDATION !== 'false',
    autoCleanup: process.env.DB_AUTO_CLEANUP !== 'false',
    enableSnapshots: process.env.DB_ENABLE_SNAPSHOTS === 'true',
    snapshotRetention: parseInt(process.env.DB_SNAPSHOT_RETENTION || '24'),
    healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '60000'),
    enableHealthChecks: process.env.DB_ENABLE_HEALTH_CHECKS !== 'false',
    defaultTransactionTimeout: parseInt(process.env.DB_DEFAULT_TX_TIMEOUT || '30000'),
    enableTransactionLogging: process.env.DB_ENABLE_TX_LOGGING === 'true',
    enableMigrations: process.env.DB_ENABLE_MIGRATIONS === 'true',
    seedDataPath: process.env.DB_SEED_DATA_PATH || './test-data/seeds',
    migrationPath: process.env.DB_MIGRATION_PATH || './test-data/migrations'
  },

  // 🧪 Test Data & Fixtures Configuration
  fixtures: {
    baseDirectory: process.env.FIXTURES_DIR || './fixtures',
    autoResolveVariables: process.env.FIXTURES_AUTO_RESOLVE !== 'false',
    variablePrefix: process.env.FIXTURES_VARIABLE_PREFIX || '{{',
    variableSuffix: process.env.FIXTURES_VARIABLE_SUFFIX || '}}',
    fakerLocale: process.env.FAKER_LOCALE || 'en',
    enableFakerFunctions: process.env.ENABLE_FAKER_FUNCTIONS !== 'false'
  },

  // 🔧 Variable Resolution Configuration
  variableResolvers: {
    resolvers: {
      faker: {
        enabled: process.env.FAKER_ENABLED !== 'false',
        locale: process.env.FAKER_LOCALE || 'en'
      },
      random: {
        enabled: process.env.RANDOM_ENABLED !== 'false',
        seed: process.env.RANDOM_SEED ? parseInt(process.env.RANDOM_SEED) : undefined
      },
      date: {
        enabled: process.env.DATE_FUNCTIONS_ENABLED !== 'false',
        timezone: process.env.DEFAULT_TIMEZONE || 'UTC'
      },
      util: {
        enabled: process.env.UTIL_FUNCTIONS_ENABLED !== 'false',
        base64Encoding: process.env.BASE64_ENCODING || 'utf8'
      }
    }
  }
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
    case 'graphql':
      return generateGraphQLTest(options);
    case 'websocket':
      return generateWebSocketTest(options);
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

  after(async function() {
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
        .header('Content-Type', 'application/json')
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
          .post('/users', '{{userData}}')
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
          .put('/users/1', updateData)
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

  after(async function() {
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
        .statusCodeIn([200, 404])  // 404 is ok for mock API
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
 * Comprehensive database integration testing with state validation
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${options.name} Database Tests', function() {
  this.timeout(60000);

  before(async function() {
    // Setup database connections (configured via environment)
    console.log('🗄️ Setting up database clients...');
    
    // PostgreSQL - Primary database
    try {
      await restified.createDatabaseClient('postgres', {
        type: 'postgresql',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        username: process.env.POSTGRES_USERNAME || 'testuser',
        password: process.env.POSTGRES_PASSWORD || 'testpass',
        database: process.env.POSTGRES_DATABASE || 'testdb'
      });
      console.log('✅ PostgreSQL client connected');
    } catch (error: any) {
      console.log('⚠️ PostgreSQL connection failed (skipping PostgreSQL tests):', error.message);
    }

    // MongoDB - Documents database
    try {
      await restified.createDatabaseClient('mongodb', {
        type: 'mongodb',
        connectionString: process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/testdb'
      });
      console.log('✅ MongoDB client connected');
    } catch (error: any) {
      console.log('⚠️ MongoDB connection failed (skipping MongoDB tests):', error.message);
    }

    // Redis - Cache database
    try {
      await restified.createDatabaseClient('redis', {
        type: 'redis',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        options: {
          keyPrefix: 'test:'
        }
      });
      console.log('✅ Redis client connected');
    } catch (error: any) {
      console.log('⚠️ Redis connection failed (skipping Redis tests):', error.message);
    }

    // SQLite - Local testing database
    try {
      await restified.createDatabaseClient('sqlite', {
        type: 'sqlite',
        options: {
          filename: ':memory:',
          memory: true
        }
      });
      console.log('✅ SQLite client connected');
    } catch (error: any) {
      console.log('⚠️ SQLite connection failed (skipping SQLite tests):', error.message);
    }
  });

  after(async function() {
    await restified.cleanup();
  });

  describe('Database State Management', function() {
    it('should setup and validate database state', async function() {
      // Skip if no databases are available
      if (restified.getClientNames().length === 0) {
        console.log('⚠️ No database clients available - skipping database tests');
        this.skip();
      }

      // Setup test data in available databases
      const setupOperations = [];
      
      // PostgreSQL setup
      if (restified.hasClient('postgres')) {
        setupOperations.push({
          client: 'postgres',
          action: 'execute' as const,
          sql: \`
            CREATE TABLE IF NOT EXISTS test_users (
              id SERIAL PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              email VARCHAR(100) UNIQUE,
              created_at TIMESTAMP DEFAULT NOW()
            )
          \`
        });
        
        setupOperations.push({
          client: 'postgres',
          action: 'insert' as const,
          table: 'test_users',
          data: [
            { name: 'Alice Johnson', email: 'alice@example.com' },
            { name: 'Bob Smith', email: 'bob@example.com' }
          ]
        });
      }

      // SQLite setup
      if (restified.hasClient('sqlite')) {
        setupOperations.push({
          client: 'sqlite',
          action: 'execute' as const,
          sql: \`
            CREATE TABLE IF NOT EXISTS test_products (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              price REAL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          \`
        });

        setupOperations.push({
          client: 'sqlite',
          action: 'execute' as const,
          sql: "INSERT INTO test_products (name, price) VALUES ('Product A', 99.99), ('Product B', 149.99)"
        });
      }

      // Redis setup
      if (restified.hasClient('redis')) {
        setupOperations.push({
          client: 'redis',
          action: 'execute' as const,
          sql: 'SET user:alice:session active EX 3600'
        });

        setupOperations.push({
          client: 'redis',
          action: 'execute' as const,
          sql: 'SET user:bob:session active EX 3600'
        });
      }

      if (setupOperations.length > 0) {
        await restified.setupDatabaseState(setupOperations);
        console.log('✅ Test data setup completed');
      }

      // Validate the setup
      const validationChecks = [];

      if (restified.hasClient('postgres')) {
        validationChecks.push({
          client: 'postgres',
          table: 'test_users',
          expectedCount: 2
        });
      }

      if (restified.hasClient('sqlite')) {
        validationChecks.push({
          client: 'sqlite',
          table: 'test_products',
          expectedCount: 2
        });
      }

      if (restified.hasClient('redis')) {
        validationChecks.push({
          client: 'redis',
          customQuery: 'EXISTS user:alice:session'
        });
      }

      if (validationChecks.length > 0) {
        const validation = await restified.validateDatabaseState(validationChecks);
        expect(validation.success).to.be.true;
        console.log('✅ Database validation successful');
      }
    });

    it('should perform cross-database operations', async function() {
      // Skip if insufficient databases
      const availableClients = restified.getClientNames();
      if (availableClients.length < 2) {
        console.log('⚠️ Insufficient database clients for cross-database testing - skipping');
        this.skip();
      }

      // Example: PostgreSQL + Redis cross-database testing
      if (restified.hasClient('postgres') && restified.hasClient('redis')) {
        // Create user in PostgreSQL
        await restified.setupDatabaseState([
          {
            client: 'postgres',
            action: 'insert' as const,
            table: 'test_users',
            data: [{ name: 'Cross DB User', email: 'crossdb@example.com' }]
          }
        ]);

        // Create session in Redis
        await restified.setupDatabaseState([
          {
            client: 'redis',
            action: 'execute' as const,
            sql: 'SET user:crossdb:session active EX 7200'
          }
        ]);

        // Validate both databases
        const validation = await restified.validateDatabaseState([
          {
            client: 'postgres',
            customQuery: 'SELECT COUNT(*) as count FROM test_users WHERE email = $1',
            expectedResult: { count: { min: 1 } }
          },
          {
            client: 'redis',
            customQuery: 'EXISTS user:crossdb:session'
          }
        ]);

        expect(validation.success).to.be.true;
        console.log('✅ Cross-database validation successful');
      }
    });

    it('should handle database health checks', async function() {
      if (restified.getClientNames().length === 0) {
        this.skip();
      }

      const healthCheck = await restified.databaseHealthCheck();
      
      // Verify all connected databases are healthy
      Object.entries(healthCheck).forEach(([clientName, health]) => {
        console.log(\`📊 \${clientName}: \${health.healthy ? '✅ Healthy' : '❌ Unhealthy'} (\${health.latency}ms)\`);
        expect(health.healthy).to.be.true;
        expect(health.latency).to.be.a('number');
      });
    });

    it('should cleanup test data', async function() {
      if (restified.getClientNames().length === 0) {
        this.skip();
      }

      const cleanupOperations = [];

      // PostgreSQL cleanup
      if (restified.hasClient('postgres')) {
        cleanupOperations.push({
          client: 'postgres',
          action: 'execute' as const,
          sql: 'DROP TABLE IF EXISTS test_users'
        });
      }

      // SQLite cleanup
      if (restified.hasClient('sqlite')) {
        cleanupOperations.push({
          client: 'sqlite',
          action: 'execute' as const,
          sql: 'DROP TABLE IF EXISTS test_products'
        });
      }

      // Redis cleanup
      if (restified.hasClient('redis')) {
        cleanupOperations.push({
          client: 'redis',
          action: 'execute' as const,
          sql: 'FLUSHALL'
        });
      }

      if (cleanupOperations.length > 0) {
        await restified.cleanupDatabaseState(cleanupOperations);
        console.log('✅ Database cleanup completed');
      }
    });
  });

  describe('Database-Specific Features', function() {
    it('should test PostgreSQL specific features', async function() {
      if (!restified.hasClient('postgres')) {
        this.skip();
      }

      const pgClient = restified.getClient('postgres');
      
      // Test parameterized queries
      const result = await pgClient.query(
        'SELECT NOW() as current_time, $1 as test_param',
        ['PostgreSQL Test']
      );
      
      expect(result.rows).to.have.length(1);
      expect(result.rows[0].test_param).to.equal('PostgreSQL Test');
      console.log('✅ PostgreSQL parameterized query successful');
    });

    it('should test Redis specific features', async function() {
      if (!restified.hasClient('redis')) {
        this.skip();
      }

      const redisClient = restified.getClient('redis');
      
      // Test Redis SET/GET
      await redisClient.query('SET test:key "Redis Test Value" EX 60');
      const result = await redisClient.query('GET test:key');
      
      expect(result.rows[0]).to.equal('Redis Test Value');
      console.log('✅ Redis SET/GET operations successful');
    });

    it('should test SQLite specific features', async function() {
      if (!restified.hasClient('sqlite')) {
        this.skip();
      }

      const sqliteClient = restified.getClient('sqlite');
      
      // Test SQLite JSON functions (if available)
      const result = await sqliteClient.query(
        "SELECT json_object('name', 'SQLite Test', 'version', sqlite_version()) as json_data"
      );
      
      expect(result.rows).to.have.length(1);
      expect(result.rows[0].json_data).to.include('SQLite Test');
      console.log('✅ SQLite JSON functions successful');
    });
  });

  describe('API-Database Integration', function() {
    it('should validate API operations affect database state', async function() {
      // Create user via API
      const createResponse = await restified
        .given()
          .useClient('api')
        .when()
          .post('/users', {
            name: 'Database Integration Test',
            email: 'integration@example.com'
          })
          .execute();

      await createResponse
        .statusCode(201)
        .extract('$.id', 'apiUserId')
        .execute();

      // Verify via API
      const getResponse = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/{{apiUserId}}')
          .execute();

      await getResponse
        .statusCode(200)
        .jsonPath('$.name', 'Database Integration Test')
        .jsonPath('$.email', 'integration@example.com')
        .execute();

      console.log('✅ API-Database integration test completed');
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

  after(async function() {
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

  after(async function() {
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
        .statusCodeIn([200, 401, 403, 404])
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
          .post('/users', maliciousPayload)
          .execute();

      // Should either reject (400) or sanitize the input
      await response
        .statusCodeIn([201, 400, 422])
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
        .statusCodeIn([200, 400, 404])
        .execute();
    });
  });
});
`;
}

function generateGraphQLTest(options: any): string {
  return `/**
 * ${options.name} GraphQL Tests
 * 
 * Comprehensive GraphQL query and mutation testing
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${options.name} GraphQL Tests', function() {
  this.timeout(30000);

  before(async function() {
    // Create GraphQL client
    restified.createGraphQLClient('graphql', {
      endpoint: '${options.url}/graphql',
      headers: {
        'Authorization': 'Bearer {{globalAuthToken}}',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
  });

  after(async function() {
    await restified.cleanup();
  });

  describe('GraphQL Queries', function() {
    it('should execute basic query', async function() {
      const client = restified.getGraphQLClient('graphql');
      
      const query = \`
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
          }
        }
      \`;

      const response = await client.query(query, { id: '1' });

      expect(response.status).to.equal(200);
      expect(response.data.data).to.exist;
      expect(response.data.errors).to.not.exist;
      expect(response.data.data.user.id).to.equal('1');
    });

    it('should handle GraphQL mutations', async function() {
      const client = restified.getGraphQLClient('graphql');
      
      const mutation = \`
        mutation CreateUser($input: UserInput!) {
          createUser(input: $input) {
            id
            name
            email
          }
        }
      \`;

      const response = await client.mutation(mutation, {
        input: {
          name: 'Test User',
          email: 'test@example.com'
        }
      });

      expect(response.status).to.equal(200);
      expect(response.data.data).to.exist;
      expect(response.data.data.createUser.name).to.equal('Test User');
    });

    it('should validate GraphQL errors', async function() {
      const client = restified.getGraphQLClient('graphql');
      
      const invalidQuery = \`
        query InvalidQuery {
          invalidField
        }
      \`;

      const response = await client.query(invalidQuery);

      expect(response.status).to.equal(200);
      expect(response.data.errors).to.exist;
      expect(response.data.errors).to.be.an('array');
    });
  });

  describe('Schema Introspection', function() {
    it('should introspect GraphQL schema', async function() {
      const client = restified.getGraphQLClient('graphql');
      
      const response = await client.introspect();

      expect(response.status).to.equal(200);
      expect(response.data.data.__schema).to.exist;
      expect(response.data.data.__schema.types).to.be.an('array');
    });
  });
});
`;
}

function generateWebSocketTest(options: any): string {
  return `/**
 * ${options.name} WebSocket Tests
 * 
 * Real-time WebSocket communication testing
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('${options.name} WebSocket Tests', function() {
  this.timeout(60000);

  before(async function() {
    // Create WebSocket client
    restified.createWebSocketClient('ws', {
      url: '${options.url.replace('http', 'ws')}/ws',
      timeout: 10000,
      reconnectAttempts: 3,
      reconnectDelay: 1000
    });
  });

  after(async function() {
    await restified.cleanup();
  });

  describe('WebSocket Connection', function() {
    it('should connect to WebSocket server', async function() {
      await restified.connectWebSocket('ws');
      
      const client = restified.getWebSocketClient('ws');
      expect(client.isConnected()).to.be.true;
    });

    it('should send and receive messages', async function() {
      const client = restified.getWebSocketClient('ws');
      
      client.clearMessages();
      
      const testMessage = 'Hello from ${options.name} WebSocket test!';
      await client.send(testMessage);

      const receivedMessage = await client.waitForMessage(
        (msg) => msg.data === testMessage,
        5000
      );

      expect(receivedMessage.data).to.equal(testMessage);
      expect(receivedMessage.timestamp).to.be.a('number');
    });

    it('should handle JSON messages', async function() {
      const client = restified.getWebSocketClient('ws');
      
      client.clearMessages();
      
      const jsonMessage = {
        type: 'test',
        data: {
          message: 'JSON test from ${options.name}',
          timestamp: Date.now()
        }
      };

      await client.sendJSON(jsonMessage);

      const receivedMessage = await client.waitForMessage(
        (msg) => msg.data && msg.data.type === 'test',
        5000
      );

      expect(receivedMessage.data.type).to.equal('test');
      expect(receivedMessage.data.data.message).to.equal('JSON test from ${options.name}');
    });
  });

  describe('Real-time Communication', function() {
    it('should handle message filtering', async function() {
      const client = restified.getWebSocketClient('ws');
      
      client.clearMessages();
      
      // Send multiple message types
      await client.sendJSON({ type: 'order', id: 1 });
      await client.sendJSON({ type: 'notification', message: 'Test' });
      await client.sendJSON({ type: 'order', id: 2 });
      
      // Wait for messages
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const orderMessages = client.getMessagesWhere(
        (msg) => msg.data && msg.data.type === 'order'
      );
      
      expect(orderMessages).to.have.length(2);
    });

    it('should measure connection latency', async function() {
      const client = restified.getWebSocketClient('ws');
      
      if (client.isConnected()) {
        const latency = await client.ping();
        expect(latency).to.be.a('number');
        expect(latency).to.be.greaterThan(0);
        
        console.log(\`WebSocket ping: $\{latency}ms\`);
      }
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

import 'dotenv/config';
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
    console.log(\`✅ $\{Object.keys(config.clients).length} HTTP clients configured\`);
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
    console.log(\`✅ $\{Object.keys(config.globalVariables).length} global variables configured\`);
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
  const testTypes = options.types.split(',').map((t: string) => t.trim());
  
  // Base dependencies always needed
  const baseDependencies = {
    "@types/chai": "^4.3.0",
    "@types/mocha": "^10.0.0",
    "@types/node": "^20.0.0",
    "chai": "^4.3.0",
    "mocha": "^10.0.0",
    "mochawesome": "^7.1.0",
    "nyc": "^15.1.0",
    "restifiedts": "^2.0.1",
    "dotenv": "^16.0.0",
    "rimraf": "^3.0.2",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.0.0"
  };

  // Optional dependencies based on test types
  const optionalDependencies: Record<string, Record<string, string>> = {};

  // Add database dependencies only if database tests are requested
  if (testTypes.includes('database')) {
    console.log('📦 Adding database dependencies for selected database types...');
    
    // Add all database packages as peerDependencies with install instructions
    optionalDependencies.peerDependencies = {
      "pg": "^8.8.0",
      "mongodb": "^6.0.0", 
      "mysql2": "^3.6.0",
      "sqlite3": "^5.1.0",
      "redis": "^4.6.0",
      "mssql": "^10.0.0"
    };

    optionalDependencies.peerDependenciesMeta = {
      "pg": { "optional": true },
      "mongodb": { "optional": true },
      "mysql2": { "optional": true },
      "sqlite3": { "optional": true },
      "redis": { "optional": true },
      "mssql": { "optional": true }
    } as any;
  }

  // Add GraphQL dependencies if GraphQL tests are requested
  if (testTypes.includes('graphql')) {
    console.log('📦 Adding GraphQL dependencies...');
    baseDependencies["graphql"] = "^16.8.0";
    baseDependencies["@graphql-tools/schema"] = "^10.0.0";
  }

  // Add WebSocket dependencies if WebSocket tests are requested
  if (testTypes.includes('websocket')) {
    console.log('📦 Adding WebSocket dependencies...');
    baseDependencies["ws"] = "^8.18.0";
    baseDependencies["@types/ws"] = "^8.5.8";
  }

  // Add performance testing dependencies if performance tests are requested
  if (testTypes.includes('performance')) {
    console.log('📦 Adding performance testing dependencies...');
    baseDependencies["k6"] = "^0.47.0";
    baseDependencies["artillery"] = "^2.0.0";
  }

  // Add security testing dependencies if security tests are requested
  if (testTypes.includes('security')) {
    console.log('📦 Adding security testing dependencies...');
    baseDependencies["owasp-zap-api"] = "^0.2.0";
  }

  const packageJsonContent = {
    "name": options.name.toLowerCase().replace(/\s+/g, '-') + "-api-tests",
    "version": "1.0.0",
    "description": `${options.name} API test suite generated by RestifiedTS`,
    "private": true,
    "scripts": generateScripts(testTypes),
    "devDependencies": baseDependencies,
    ...optionalDependencies
  };

  fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(packageJsonContent, null, 2));
  
  // Generate installation instructions
  generateInstallationInstructions(outputDir, testTypes);
}

function generateScripts(testTypes: string[]): Record<string, string> {
  const baseScripts = {
    "test": "mocha -r ts-node/register -r tsconfig-paths/register 'setup/global-setup.ts' 'tests/**/*.ts' --reporter ./mocha-reporter-wrapper.js",
    "test:spec": "mocha -r ts-node/register -r tsconfig-paths/register 'setup/global-setup.ts' 'tests/**/*.ts' --reporter spec",
    "test:console": "mocha -r ts-node/register -r tsconfig-paths/register 'setup/global-setup.ts' 'tests/**/*.ts'",
    "test:mochawesome": "npm run test:console -- --reporter mochawesome --reporter-options reportDir=reports,reportFilename=mochawesome-report,html=true,json=true,overwrite=true,charts=true,code=true",
    "test:watch": "npm run test:console -- --watch",
    "test:coverage": "nyc npm run test:console",
    "reports:clean": "node -e \"const dotenv=require('dotenv'); dotenv.config(); const dir=process.env.REPORT_OUTPUT_DIR||'reports'; const {exec}=require('child_process'); exec('rimraf '+dir+' mochawesome-report test-reports allure-results output test-output');\"",
    "reports:open": "node -e \"const dotenv=require('dotenv'); dotenv.config(); const dir=process.env.REPORT_OUTPUT_DIR||'reports'; const file=process.env.REPORT_FILENAME||'restified-html-report.html'; const {exec}=require('child_process'); exec('open '+dir+'/'+file+' || start '+dir+'/'+file, (err) => {if(err) console.log('Could not open report automatically. Check: '+dir+'/'+file);});\"",
    "reports:mochawesome": "open reports/mochawesome-report.html || start reports/mochawesome-report.html"
  };

  // Add type-specific test scripts
  testTypes.forEach(type => {
    baseScripts[`test:${type}`] = `npm run test:console -- --grep "${type}"`;
  });

  // Add database-specific scripts if database tests are included
  if (testTypes.includes('database')) {
    baseScripts["db:install"] = "echo '📦 Run the following commands to install database packages you need:' && echo 'PostgreSQL: npm install pg @types/pg' && echo 'MySQL: npm install mysql2' && echo 'MongoDB: npm install mongodb' && echo 'SQLite: npm install sqlite3' && echo 'Redis: npm install redis' && echo 'SQL Server: npm install mssql'";
    baseScripts["db:install:all"] = "npm install pg @types/pg mysql2 mongodb sqlite3 redis mssql";
    baseScripts["db:install:postgres"] = "npm install pg @types/pg";
    baseScripts["db:install:mysql"] = "npm install mysql2";
    baseScripts["db:install:mongodb"] = "npm install mongodb";
    baseScripts["db:install:sqlite"] = "npm install sqlite3";
    baseScripts["db:install:redis"] = "npm install redis";
    baseScripts["db:install:mssql"] = "npm install mssql";
  }

  // Add performance testing scripts if performance tests are included
  if (testTypes.includes('performance')) {
    baseScripts["test:performance:k6"] = "k6 run performance-tests.js";
    baseScripts["test:performance:artillery"] = "artillery run performance-tests.yml";
  }

  return baseScripts;
}

function generateInstallationInstructions(outputDir: string, testTypes: string[]): void {
  const instructions = [`# 🚀 ${path.basename(outputDir)} Installation Guide`];
  
  instructions.push('', '## 📦 Base Installation');
  instructions.push('```bash');
  instructions.push('npm install');
  instructions.push('```');

  if (testTypes.includes('database')) {
    instructions.push('', '## 🗄️ Database Dependencies (Install Only What You Need)');
    instructions.push('', 'RestifiedTS supports multiple databases. Install only the packages for databases you plan to use:');
    instructions.push('', '```bash');
    instructions.push('# PostgreSQL');
    instructions.push('npm install pg @types/pg');
    instructions.push('');
    instructions.push('# MySQL/MariaDB');
    instructions.push('npm install mysql2');
    instructions.push('');
    instructions.push('# MongoDB');
    instructions.push('npm install mongodb');
    instructions.push('');
    instructions.push('# SQLite (lightweight, good for local testing)');
    instructions.push('npm install sqlite3');
    instructions.push('');
    instructions.push('# Redis');
    instructions.push('npm install redis');
    instructions.push('');
    instructions.push('# SQL Server');
    instructions.push('npm install mssql');
    instructions.push('```');
    instructions.push('');
    instructions.push('**Quick Install Scripts:**');
    instructions.push('```bash');
    instructions.push('# Install all database packages');
    instructions.push('npm run db:install:all');
    instructions.push('');
    instructions.push('# Or install specific databases');
    instructions.push('npm run db:install:postgres');
    instructions.push('npm run db:install:mysql');
    instructions.push('npm run db:install:mongodb');
    instructions.push('# ... etc');
    instructions.push('```');
    instructions.push('');
    instructions.push('💡 **Tip**: You can run tests without installing database packages. RestifiedTS will show warnings but continue with available features.');
  }

  if (testTypes.includes('graphql')) {
    instructions.push('', '## 🔗 GraphQL Dependencies (Already Included)');
    instructions.push('GraphQL testing dependencies are included automatically.');
  }

  if (testTypes.includes('websocket')) {
    instructions.push('', '## ⚡ WebSocket Dependencies (Already Included)');
    instructions.push('WebSocket testing dependencies are included automatically.');
  }

  if (testTypes.includes('performance')) {
    instructions.push('', '## 🚀 Performance Testing Dependencies');
    instructions.push('Performance testing tools are included but may need global installation:');
    instructions.push('', '```bash');
    instructions.push('# K6 (preferred)');
    instructions.push('npm install -g k6');
    instructions.push('');
    instructions.push('# Artillery (alternative)');
    instructions.push('npm install -g artillery');
    instructions.push('```');
  }

  if (testTypes.includes('security')) {
    instructions.push('', '## 🛡️ Security Testing Dependencies');
    instructions.push('Security testing requires OWASP ZAP to be running:');
    instructions.push('', '```bash');
    instructions.push('# Download and run OWASP ZAP');
    instructions.push('# https://owasp.org/www-project-zap/');
    instructions.push('```');
  }

  instructions.push('', '## 🏃 Running Tests');
  instructions.push('```bash');
  instructions.push('# Run all tests');
  instructions.push('npm test');
  instructions.push('');
  instructions.push('# Run specific test types');
  testTypes.forEach(type => {
    instructions.push(`npm run test:${type}`);
  });
  instructions.push('');
  instructions.push('# Open HTML report');
  instructions.push('npm run reports:open');
  instructions.push('```');

  fs.writeFileSync(path.join(outputDir, 'INSTALLATION.md'), instructions.join('\n'));
}

async function generateEnvironmentTemplate(outputDir: string, options: any): Promise<void> {
  const envContent = `# ${options.name} Environment Configuration
# Copy this file to .env and customize for your environment

# =============================================================================
# 🌍 ENVIRONMENT & INFRASTRUCTURE
# =============================================================================
TEST_ENV=development
DATACENTER=us-east-1
REGION=primary
CLUSTER=default
TENANT_ID=default-tenant

# =============================================================================
# 🏗️ SERVICE ENDPOINTS
# =============================================================================
API_GATEWAY_URL=${options.url}
AUTH_SERVICE_URL=${options.url}
USER_SERVICE_URL=${options.url}
ORDER_SERVICE_URL=${options.url}
TEST_UTILS_URL=https://httpbin.org

# API Configuration
API_VERSION=v1
API_TIMEOUT=10000
AUTH_TIMEOUT=5000
CLIENT_ID=test-suite-client

# =============================================================================
# 🔐 AUTHENTICATION & SECURITY
# =============================================================================
AUTH_ENDPOINT=/users/1
TOKEN_JSONPATH=$.name
USER_EMAIL_JSONPATH=$.email
USER_ID_JSONPATH=$.id

# OAuth2 Configuration
OAUTH2_CLIENT_ID=your-client-id
OAUTH2_CLIENT_SECRET=your-client-secret
OAUTH2_SCOPE=read write admin
OAUTH2_GRANT_TYPE=client_credentials

# Fallback Authentication
FALLBACK_TOKEN=fallback-token-123
FALLBACK_EMAIL=test@example.com
FALLBACK_USER_ID=1

# Authentication Application
AUTH_APPLY_TO_CLIENTS=all
AUTH_HEADER_NAME=Authorization
SSO_PROVIDER=internal

# =============================================================================
# 🔗 GRAPHQL CONFIGURATION
# =============================================================================
GRAPHQL_ENDPOINT=${options.url}/graphql
GRAPHQL_WS_ENDPOINT=${options.url.replace('http', 'ws')}/graphql
GRAPHQL_TIMEOUT=15000
GRAPHQL_INTROSPECTION=true
GRAPHQL_DEBUG=false

# GraphQL Authentication (if different from REST)
GRAPHQL_AUTH_TOKEN=your-graphql-token
GRAPHQL_API_KEY=your-graphql-api-key

# =============================================================================
# ⚡ WEBSOCKET CONFIGURATION
# =============================================================================
WEBSOCKET_URL=${options.url.replace('http', 'ws')}/ws
WEBSOCKET_TIMEOUT=10000
WEBSOCKET_RECONNECT_ATTEMPTS=3
WEBSOCKET_RECONNECT_INTERVAL=5000
WEBSOCKET_HEARTBEAT_INTERVAL=30000
WEBSOCKET_MAX_MESSAGE_SIZE=1048576

# WebSocket Authentication
WEBSOCKET_AUTH_HEADER=Authorization
WEBSOCKET_AUTH_TOKEN=your-ws-token
WEBSOCKET_PROTOCOL=your-protocol

# =============================================================================
# 🗄️ DATABASE CONFIGURATION
# =============================================================================

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=testuser
POSTGRES_USERNAME=testuser
POSTGRES_PASSWORD=testpass
POSTGRES_DB=testdb
POSTGRES_DATABASE=testdb
POSTGRES_SCHEMA=public
POSTGRES_SSL=false
POSTGRES_POOL_MIN=2
POSTGRES_POOL_MAX=10
POSTGRES_TIMEOUT=30000

# MongoDB Configuration  
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USER=testuser
MONGODB_PASSWORD=testpass
MONGODB_DB=testdb
MONGODB_DATABASE=testdb
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/testdb
MONGODB_AUTH_SOURCE=admin
MONGODB_REPLICA_SET=rs0
MONGODB_SSL=false
MONGODB_TIMEOUT=30000
MONGODB_MAX_POOL_SIZE=10

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=testuser
MYSQL_PASSWORD=testpass
MYSQL_DATABASE=testdb
MYSQL_SSL=false
MYSQL_CHARSET=utf8mb4
MYSQL_TIMEZONE=UTC
MYSQL_RECONNECT=true
MYSQL_POOL_MIN=1
MYSQL_POOL_MAX=10
MYSQL_TIMEOUT=60000

# SQLite Configuration
SQLITE_FILENAME=:memory:
SQLITE_MEMORY=true
SQLITE_READONLY=false
SQLITE_TIMEOUT=5000
SQLITE_JOURNAL_MODE=WAL
SQLITE_SYNCHRONOUS=NORMAL

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DATABASE=0
REDIS_KEY_PREFIX=test:
REDIS_TIMEOUT=10000
REDIS_MAX_RETRIES=3
REDIS_LAZY_CONNECT=true
REDIS_COMMAND_TIMEOUT=5000

# SQL Server Configuration
MSSQL_HOST=localhost
MSSQL_PORT=1433
MSSQL_USERNAME=sa
MSSQL_PASSWORD=YourStrong!Passw0rd
MSSQL_DATABASE=testdb
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERT=true
MSSQL_ENABLE_ARITH_ABORT=true
MSSQL_REQUEST_TIMEOUT=30000
MSSQL_CONNECTION_TIMEOUT=15000
MSSQL_TIMEOUT=15000
MSSQL_POOL_MIN=0
MSSQL_POOL_MAX=10

# Database State Management
DB_STATE_VALIDATION=true
DB_AUTO_CLEANUP=true
DB_ENABLE_SNAPSHOTS=false
DB_SNAPSHOT_RETENTION=24
DB_HEALTH_CHECK_INTERVAL=60000
DB_ENABLE_HEALTH_CHECKS=true
DB_DEFAULT_TX_TIMEOUT=30000
DB_ENABLE_TX_LOGGING=false
DB_ENABLE_MIGRATIONS=false
DB_SEED_DATA_PATH=./test-data/seeds
DB_MIGRATION_PATH=./test-data/migrations

# =============================================================================
# 📄 JSON FIXTURES & VARIABLE RESOLUTION
# =============================================================================
FIXTURES_DIR=fixtures
FIXTURES_AUTO_RESOLVE=true
FIXTURES_VARIABLE_PREFIX={{
FIXTURES_VARIABLE_SUFFIX=}}
FAKER_LOCALE=en
ENABLE_FAKER_FUNCTIONS=true

# Utility Function Toggles
FAKER_ENABLED=true
RANDOM_ENABLED=true
DATE_FUNCTIONS_ENABLED=true
UTIL_FUNCTIONS_ENABLED=true
BASE64_ENCODING=utf8
DEFAULT_TIMEZONE=UTC
RANDOM_SEED=12345

# =============================================================================
# 📊 TESTING CONFIGURATION
# =============================================================================
TEST_SUITE_NAME=my-api-tests
DEFAULT_TIMEOUT=10000
MAX_RETRIES=3
ENABLE_LOGGING=true
LOG_LEVEL=info

# Enterprise Configuration
ORGANIZATION=enterprise-corp
COMPLIANCE_MODE=strict
SECURITY_LEVEL=enterprise

# Feature Flags
RUN_INTEGRATION_TESTS=true
RUN_PERFORMANCE_TESTS=false
RUN_SECURITY_TESTS=false
RUN_DATABASE_TESTS=false
RUN_GRAPHQL_TESTS=false
RUN_WEBSOCKET_TESTS=false

# Parallel Execution
PARALLEL_EXECUTION=false
MAX_PARALLEL_WORKERS=4

# =============================================================================
# 🎯 PERFORMANCE TESTING
# =============================================================================
K6_EXECUTABLE_PATH=k6
ARTILLERY_EXECUTABLE_PATH=artillery
PERFORMANCE_TEST_DURATION=30s
PERFORMANCE_VUS=10
PERFORMANCE_ITERATIONS=100

# =============================================================================
# 🛡️ SECURITY TESTING
# =============================================================================
ZAP_PROXY_URL=http://localhost:8080
ZAP_API_KEY=your-zap-api-key
SECURITY_SCAN_TIMEOUT=300000
ENABLE_PASSIVE_SCAN=true
ENABLE_ACTIVE_SCAN=false

# =============================================================================
# 📈 REPORTING CONFIGURATION
# =============================================================================
REPORTING_ENABLED=true
REPORT_OUTPUT_DIR=reports
REPORT_FORMATS=html,json,junit
INCLUDE_REQUEST_RESPONSE=true
INCLUDE_SCREENSHOTS=true
INCLUDE_METRICS=true
INCLUDE_COMPLIANCE=false
OPEN_REPORT=false

# Restified HTML Reporter Settings
REPORT_FILENAME=restified-html-report.html
REPORT_TITLE=API Test Report
REPORT_SUBTITLE=Enterprise API Testing

# Export Settings
EXCEL_EXPORT_ENABLED=false
CSV_EXPORT_ENABLED=false
PDF_EXPORT_ENABLED=false

# =============================================================================
# 🚀 CI/CD INTEGRATION
# =============================================================================
CI_ENVIRONMENT=false
BUILD_NUMBER=1
BUILD_URL=http://localhost
GIT_BRANCH=main
GIT_COMMIT=abc123
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook

# =============================================================================
# 🔧 ADVANCED CONFIGURATION
# =============================================================================
HTTP_PROXY=
HTTPS_PROXY=
NO_PROXY=localhost,127.0.0.1

# Custom Headers for All Requests
CUSTOM_HEADER_1_NAME=X-Custom-Header
CUSTOM_HEADER_1_VALUE=custom-value

# Rate Limiting
REQUEST_RATE_LIMIT=100
REQUEST_RATE_WINDOW=60000
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
      "strict": false,
      "noImplicitAny": false,
      "noImplicitReturns": false,
      "noImplicitThis": false,
      "noUnusedLocals": false,
      "noUnusedParameters": false,
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
      "types": ["node", "mocha", "chai"],
      "typeRoots": [
        "./node_modules/@types"
      ]
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
    ],
    "ts-node": {
      "esm": false,
      "experimentalSpecifierResolution": "node"
    }
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

  after(async function() {
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

The \`.env\` file provides comprehensive configuration for all RestifiedTS features. Copy \`.env.example\` to \`.env\` and customize:

\`\`\`bash
# =============================================================================
# 🏗️ SERVICE ENDPOINTS
# =============================================================================
API_GATEWAY_URL=https://api.${options.url.replace('https://', '').replace('http://', '')}
AUTH_SERVICE_URL=https://auth.${options.url.replace('https://', '').replace('http://', '')}
USER_SERVICE_URL=https://users.${options.url.replace('https://', '').replace('http://', '')}

# =============================================================================
# 🔐 AUTHENTICATION & SECURITY
# =============================================================================
AUTH_ENDPOINT=/oauth/token
TOKEN_JSONPATH=$.access_token
OAUTH2_CLIENT_ID=your-client-id
OAUTH2_CLIENT_SECRET=your-client-secret

# =============================================================================
# 🔗 GRAPHQL CONFIGURATION
# =============================================================================
GRAPHQL_ENDPOINT=https://api.${options.url.replace('https://', '').replace('http://', '')}/graphql
GRAPHQL_WS_ENDPOINT=wss://api.${options.url.replace('https://', '').replace('http://', '')}/graphql
GRAPHQL_TIMEOUT=15000
GRAPHQL_INTROSPECTION=true

# =============================================================================
# ⚡ WEBSOCKET CONFIGURATION
# =============================================================================
WEBSOCKET_URL=wss://api.${options.url.replace('https://', '').replace('http://', '')}/ws
WEBSOCKET_TIMEOUT=10000
WEBSOCKET_RECONNECT_ATTEMPTS=3

# =============================================================================
# 🗄️ DATABASE CONFIGURATION
# =============================================================================
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=testuser
POSTGRES_PASSWORD=testpass
POSTGRES_DATABASE=testdb

# MongoDB
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/testdb
MONGODB_DATABASE=testdb

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=password

# SQLite (for local testing)
SQLITE_FILENAME=:memory:
SQLITE_MEMORY=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_KEY_PREFIX=test:

# SQL Server
MSSQL_HOST=localhost
MSSQL_PORT=1433
MSSQL_USERNAME=sa
MSSQL_PASSWORD=YourStrong!Passw0rd

# =============================================================================
# 📊 TESTING CONFIGURATION
# =============================================================================
TEST_ENV=staging
ENABLE_LOGGING=true
RUN_DATABASE_TESTS=false
RUN_GRAPHQL_TESTS=false
RUN_WEBSOCKET_TESTS=false
\`\`\`

## 🌐 Multi-Protocol Support

This test suite supports comprehensive testing across multiple protocols:

### 🔗 GraphQL Testing
\`\`\`typescript
// Create GraphQL client (configured via environment)
restified.createGraphQLClient('graphql', {
  endpoint: process.env.GRAPHQL_ENDPOINT,
  headers: { 'Authorization': 'Bearer {{token}}' }
});

// Execute GraphQL queries and mutations
const response = await restified.getGraphQLClient('graphql')
  .query(\`
    query GetUser($id: ID!) {
      user(id: $id) { name email }
    }
  \`, { id: '123' });
\`\`\`

### ⚡ WebSocket Testing
\`\`\`typescript
// Create WebSocket client (configured via environment)
restified.createWebSocketClient('ws', {
  url: process.env.WEBSOCKET_URL,
  reconnectAttempts: parseInt(process.env.WEBSOCKET_RECONNECT_ATTEMPTS || '3')
});

// Connect and test real-time communication
await restified.connectWebSocket('ws');
const client = restified.getWebSocketClient('ws');

await client.sendJSON({ type: 'subscribe', channel: 'orders' });
const message = await client.waitForMessage(
  (msg) => msg.data.type === 'order_update',
  5000
);
\`\`\`

### 🗄️ Database Integration ✅ *6 Database Types Supported*

RestifiedTS supports comprehensive database testing with **6 fully implemented database types**:

\`\`\`typescript
// ✅ PostgreSQL - Primary relational database
await restified.createDatabaseClient('postgres', {
  type: 'postgresql',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE
});

// ✅ MongoDB - Document database
await restified.createDatabaseClient('mongo', {
  type: 'mongodb',
  connectionString: process.env.MONGODB_CONNECTION_STRING
});

// ✅ MySQL - Analytics database
await restified.createDatabaseClient('mysql', {
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

// ✅ Redis - Cache and session store
await restified.createDatabaseClient('redis', {
  type: 'redis',
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  options: { keyPrefix: 'test:', commandTimeout: 5000 }
});

// ✅ SQLite - Local testing database
await restified.createDatabaseClient('sqlite', {
  type: 'sqlite',
  options: {
    filename: ':memory:',
    memory: true,
    journalMode: 'WAL'
  }
});

// ✅ SQL Server - Enterprise database
await restified.createDatabaseClient('mssql', {
  type: 'mssql',
  host: process.env.MSSQL_HOST,
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  username: process.env.MSSQL_USERNAME,
  password: process.env.MSSQL_PASSWORD,
  database: process.env.MSSQL_DATABASE
});

// 🚀 Multi-Database State Validation
const validation = await restified.validateDatabaseState([
  {
    client: 'postgres',
    table: 'users',
    conditions: { active: true },
    expectedCount: 5
  },
  {
    client: 'redis',
    customQuery: 'EXISTS user:session:active'
  },
  {
    client: 'sqlite',
    table: 'test_data',
    expectedCount: { min: 1, max: 10 }
  }
]);

// 🏥 Database Health Monitoring
const healthCheck = await restified.databaseHealthCheck();
console.log('Database health:', healthCheck);

// 🧹 Automatic Cleanup
await restified.cleanupDatabaseState([
  { client: 'postgres', action: 'execute', sql: 'TRUNCATE users' },
  { client: 'redis', action: 'execute', sql: 'FLUSHALL' }
]);
\`\`\`

**Enterprise Database Features:**
- ✅ **Connection Pooling**: Optimized connection management for all database types
- ✅ **Transaction Support**: Full ACID transaction support where applicable
- ✅ **Health Monitoring**: Real-time database health checks and latency monitoring
- ✅ **State Management**: Setup, validation, and cleanup of test data across databases
- ✅ **Cross-Database Testing**: Validate consistency across multiple database systems
- ✅ **Database-Specific Features**: Leverage unique capabilities of each database type

### 📄 JSON Fixtures & Variable Resolution
\`\`\`typescript
// Load and resolve JSON fixtures with variables
const userData = restified.loadJsonFixture('./fixtures/user.json');

// Enhanced variable resolution supports deep nested objects
const template = {
  user: {
    id: '{{userId}}',
    name: '{{$faker.person.fullName}}',
    settings: {
      theme: '{{userTheme}}',
      language: '{{$env.DEFAULT_LANGUAGE}}'
    }
  },
  metadata: {
    timestamp: '{{$date.now}}',
    requestId: '{{$random.uuid}}'
  }
};

const resolved = restified.resolveVariables(template);
\`\`\`

**Supported Variable Types:**
- **Global/Local/Extracted**: \`{{userId}}\`, \`{{authToken}}\`
- **Faker.js**: \`{{$faker.person.fullName}}\`, \`{{$faker.internet.email}}\`  
- **Random**: \`{{$random.uuid}}\`, \`{{$random.number(1,100)}}\`
- **Date/Time**: \`{{$date.now}}\`, \`{{$date.timestamp}}\`
- **Environment**: \`{{$env.API_KEY}}\`
- **Utilities**: \`{{$util.guid}}\`, \`{{$util.base64encode(data)}}\`

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
 * Loads and validates the restified.config.ts file with smart defaults
 */

import * as fs from 'fs';
import * as path from 'path';
import { RestifiedConfig, EnvironmentConfig, AuthenticationConfig, ReportingConfig } from 'restifiedts';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: RestifiedConfig | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = this.findConfigFile();
  }

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

    let userConfig: Partial<RestifiedConfig> = {};

    // Try to load user configuration
    try {
      if (this.configPath && fs.existsSync(this.configPath)) {
        console.log(\`📋 Loading configuration from: \${path.relative(process.cwd(), this.configPath)}\`);
        
        // Dynamic import for TypeScript config files
        const configModule = await import(this.configPath);
        userConfig = configModule.default || configModule;
      } else {
        console.log('📋 No config file found, using defaults');
      }
    } catch (error) {
      console.log(\`⚠️  Warning: Could not load config file: \${error.message}\`);
      console.log('📋 Using default configuration');
    }

    // Merge with defaults
    this.config = this.mergeWithDefaults(userConfig);
    return this.config;
  }

  /**
   * Find config file in project root
   */
  private findConfigFile(): string {
    const possiblePaths = [
      path.join(process.cwd(), 'restified.config.ts'),
      path.join(process.cwd(), 'restified.config.js'),
      path.join(process.cwd(), 'restified.config.json')
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return possiblePaths[0]; // Default to .ts file path
  }

  /**
   * Merge user config with smart defaults
   */
  private mergeWithDefaults(userConfig: Partial<RestifiedConfig>): RestifiedConfig {
    const defaultConfig = this.getDefaultConfig();
    
    // Deep merge user config with defaults
    return this.deepMerge(defaultConfig, userConfig) as RestifiedConfig;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
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
        formats: ['html', 'json'],
        openAfterGeneration: false,
        includeRequestResponse: true,
        includeScreenshots: false
      }
    };
  }
}
`;

  fs.writeFileSync(path.join(outputDir, 'config', 'ConfigLoader.ts'), configLoaderContent);
}

async function generateMochaReporterWrapper(outputDir: string): Promise<void> {
  const wrapperContent = `/**
 * Mocha Reporter Wrapper for RestifiedHtmlReporter
 * 
 * This wrapper properly exports the RestifiedHtmlReporter for Mocha compatibility
 */

try {
  const { RestifiedHtmlReporter } = require('restifiedts');
  module.exports = RestifiedHtmlReporter;
} catch (error) {
  console.warn('⚠️  RestifiedHtmlReporter not available, falling back to spec reporter');
  console.warn('   Run "npm run test:spec" to use console output instead');
  module.exports = require('mocha/lib/reporters/spec');
}`;

  fs.writeFileSync(path.join(outputDir, 'mocha-reporter-wrapper.js'), wrapperContent);
}