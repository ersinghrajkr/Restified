/**
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

// Import proper RestifiedConfig type from RestifiedTypes
import { RestifiedConfig } from './src/RestifiedTypes';

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
    // Primary API Gateway (Production/Staging)
    api: {
      baseURL: process.env.API_GATEWAY_URL || 'https://jsonplaceholder.typicode.com',
      timeout: parseInt(process.env.API_TIMEOUT || '10000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': process.env.API_VERSION || 'v1',
        'X-Client-ID': process.env.CLIENT_ID || 'restified-test-suite',
        'X-Correlation-ID': '{{$random.uuid}}',
        'X-Source': 'enterprise-testing'
      },
      retries: 3,
      retryDelay: 1000
    },

    // Enterprise Authentication/SSO Service
    auth: {
      baseURL: process.env.AUTH_SERVICE_URL || 'https://jsonplaceholder.typicode.com',
      timeout: parseInt(process.env.AUTH_TIMEOUT || '5000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Service': 'enterprise-auth',
        'X-SSO-Provider': process.env.SSO_PROVIDER || 'internal'
      },
      retries: 2
    }
  },

  // 🌐 Enterprise Global Headers (applied to ALL requests)
  globalHeaders: {
    // Enterprise identification
    'X-Test-Suite': process.env.TEST_SUITE_NAME || 'enterprise-api-tests',
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
    method: 'POST' as const,
    client: 'auth',
    
    // Enterprise token extraction (JWT/OAuth2)
    extractors: {
      token: process.env.TOKEN_JSONPATH || '$.name',
      userEmail: process.env.USER_EMAIL_JSONPATH || '$.email',
      userId: process.env.USER_ID_JSONPATH || '$.id',
      // Enterprise-specific extractions
      roles: '$.roles',
      permissions: '$.permissions',
      tenantId: '$.tenant_id',
      organizationId: '$.organization_id',
      sessionId: '$.session_id',
      refreshToken: '$.refresh_token'
    },
    
    // Enterprise fallback for CI/CD environments
    fallback: {
      token: process.env.FALLBACK_TOKEN || 'enterprise-fallback-token-123',
      userEmail: process.env.FALLBACK_EMAIL || 'test@enterprise.com',
      userId: parseInt(process.env.FALLBACK_USER_ID || '1'),
      roles: ['api-tester', 'enterprise-user'],
      permissions: ['read:api', 'test:endpoints'],
      tenantId: 'tenant-001',
      organizationId: 'org-enterprise',
      sessionId: 'session-fallback-123',
      refreshToken: 'refresh-fallback-456'
    },
    
    // Enterprise client targeting
    autoApplyToClients: process.env.AUTH_APPLY_TO_CLIENTS?.split(',') || 'all',
    authHeaderName: process.env.AUTH_HEADER_NAME || 'Authorization',
    
    // Enterprise security settings
    tokenRefreshThreshold: parseInt(process.env.TOKEN_REFRESH_THRESHOLD || '300'), // 5 minutes
    enableTokenRefresh: process.env.ENABLE_TOKEN_REFRESH !== 'false',
    secureTokenStorage: process.env.SECURE_TOKEN_STORAGE !== 'false'
  },

  // 📊 Enterprise Global Variables (available in all tests)
  globalVariables: {
    // Enterprise environment settings
    testEnvironment: process.env.TEST_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v2',
    testSuite: process.env.TEST_SUITE_NAME || 'enterprise-api-tests',
    
    // Enterprise infrastructure
    datacenter: process.env.DATACENTER || 'us-east-1',
    region: process.env.REGION || 'primary',
    cluster: process.env.CLUSTER || 'default',
    namespace: process.env.KUBERNETES_NAMESPACE || 'testing',
    
    // Test configuration
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '10000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    enableLogging: process.env.ENABLE_LOGGING !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enableTracing: process.env.ENABLE_TRACING !== 'false',
    
    // Enterprise feature flags
    runIntegrationTests: process.env.RUN_INTEGRATION_TESTS !== 'false',
    runPerformanceTests: process.env.RUN_PERFORMANCE_TESTS === 'true',
    runSecurityTests: process.env.RUN_SECURITY_TESTS === 'true',
    runComplianceTests: process.env.RUN_COMPLIANCE_TESTS === 'true',
    
    // Business logic variables
    businessUnit: process.env.BUSINESS_UNIT || 'enterprise',
    department: process.env.DEPARTMENT || 'qa',
    costCenter: process.env.COST_CENTER || 'testing-001',
    
    // Service URLs for enterprise architecture
    apiGatewayUrl: process.env.API_GATEWAY_URL || 'https://jsonplaceholder.typicode.com',
    userServiceUrl: process.env.USER_SERVICE_URL || 'https://jsonplaceholder.typicode.com',
    orderServiceUrl: process.env.ORDER_SERVICE_URL || 'https://httpbin.org',
    paymentGatewayUrl: process.env.PAYMENT_GATEWAY_URL || 'https://httpbin.org',
    testUtilsUrl: process.env.TEST_UTILS_URL || 'https://httpbin.org'
  },

  // 🔧 Enterprise Environment Variables Setup
  environmentVariables: {
    // Security & Compliance
    API_KEY: process.env.API_KEY || 'demo-api-key-12345',
    SECURITY_TOKEN: process.env.SECURITY_TOKEN || 'secure-token-456',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'encryption-key-789',
    
    // Infrastructure
    ENVIRONMENT: process.env.ENVIRONMENT || 'test',
    VERSION: process.env.VERSION || '2.0.0',
    BUILD_NUMBER: process.env.BUILD_NUMBER || 'latest',
    DEPLOYMENT_ID: process.env.DEPLOYMENT_ID || 'dep-123',
    
    // Performance & Limits
    MAX_TIMEOUT: process.env.MAX_TIMEOUT || '30000',
    MAX_CONNECTIONS: process.env.MAX_CONNECTIONS || '100',
    RATE_LIMIT: process.env.RATE_LIMIT || '1000',
    
    // Monitoring & Observability
    MONITORING_ENABLED: process.env.MONITORING_ENABLED || 'true',
    METRICS_ENDPOINT: process.env.METRICS_ENDPOINT || '',
    TRACING_ENDPOINT: process.env.TRACING_ENDPOINT || '',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Database Environment Variables
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_NAME: process.env.DB_NAME || 'testdb',
    DB_USERNAME: process.env.DB_USERNAME || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'password',
    DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING || '',
    DB_SSL: process.env.DB_SSL || 'false',
    
    // Redis Configuration
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT || '6379',
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
    REDIS_DATABASE: process.env.REDIS_DATABASE || '0',
    
    // MySQL Configuration
    MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
    MYSQL_PORT: process.env.MYSQL_PORT || '3306',
    MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'analytics',
    MYSQL_USERNAME: process.env.MYSQL_USERNAME || 'root',
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || 'password',
    
    // MongoDB Configuration
    MONGO_CONNECTION_STRING: process.env.MONGO_CONNECTION_STRING || 'mongodb://localhost:27017/testdb',
    MONGO_HOST: process.env.MONGO_HOST || 'localhost',
    MONGO_PORT: process.env.MONGO_PORT || '27017',
    MONGO_DATABASE: process.env.MONGO_DATABASE || 'documents',
    MONGO_USERNAME: process.env.MONGO_USERNAME || '',
    MONGO_PASSWORD: process.env.MONGO_PASSWORD || '',
    
    // SQL Server Configuration
    MSSQL_HOST: process.env.MSSQL_HOST || 'localhost',
    MSSQL_PORT: process.env.MSSQL_PORT || '1433',
    MSSQL_DATABASE: process.env.MSSQL_DATABASE || 'enterprise',
    MSSQL_USERNAME: process.env.MSSQL_USERNAME || 'sa',
    MSSQL_PASSWORD: process.env.MSSQL_PASSWORD || 'YourStrong!Passw0rd',
    
    // SQLite Configuration
    SQLITE_FILENAME: process.env.SQLITE_FILENAME || ':memory:',
    SQLITE_MEMORY: process.env.SQLITE_MEMORY || 'true'
  },

  // 📈 Enterprise Reporting & Analytics Configuration
  reporting: {
    title: process.env.REPORT_TITLE || 'RestifiedTS Enterprise API Test Results',
    logo: process.env.REPORT_LOGO || '🏢',
    filename: process.env.REPORT_FILENAME || `restified-enterprise-report-${new Date().toISOString().split('T')[0]}.html`,
    subtitle: process.env.REPORT_SUBTITLE || 'Enterprise API Testing with Advanced Features and Analytics',
    enabled: process.env.REPORTING_ENABLED !== 'false',
    outputDir: process.env.REPORT_OUTPUT_DIR || 'restified-reports',
    formats: ['html', 'json', 'xml', 'junit'],
    openAfterGeneration: process.env.OPEN_REPORT === 'true',
    // Theme configuration
    theme: {
      primaryColor: process.env.REPORT_PRIMARY_COLOR || '#1e293b',
      secondaryColor: process.env.REPORT_SECONDARY_COLOR || '#334155',
      accentColor: process.env.REPORT_ACCENT_COLOR || '#0ea5e9'
    },
    
    // Footer configuration  
    footer: {
      show: process.env.REPORT_FOOTER_SHOW !== 'false',
      text: process.env.REPORT_FOOTER_TEXT || 'Generated by RestifiedTS Enterprise Test Framework',
      links: [
        { 
          text: 'RestifiedTS Docs', 
          url: 'https://github.com/rajkumar-krishnan/RestifiedTS', 
          external: true 
        },
        { 
          text: 'API Documentation', 
          url: process.env.API_DOCS_URL || '#', 
          external: true 
        }
      ],
      copyright: process.env.REPORT_COPYRIGHT || `© ${new Date().getFullYear()} RestifiedTS Enterprise`,
      timestamp: process.env.REPORT_FOOTER_TIMESTAMP !== 'false',
      version: process.env.REPORT_VERSION || 'v2.0.7',
      customHtml: process.env.REPORT_CUSTOM_HTML || ''
    },
    
    // Branding configuration
    branding: {
      showPoweredBy: process.env.REPORT_SHOW_POWERED_BY !== 'false',
      company: process.env.REPORT_COMPANY || 'Enterprise Solutions',
      website: process.env.REPORT_WEBSITE || 'https://enterprise.example.com'
    },
    
    // Legacy Configuration (for backward compatibility)
    includeRequestResponse: process.env.INCLUDE_REQUEST_RESPONSE !== 'false',
    includeScreenshots: process.env.INCLUDE_SCREENSHOTS !== 'false',
    
    // Enterprise reporting features
    includeMetrics: process.env.INCLUDE_METRICS !== 'false',
    includeTracing: process.env.INCLUDE_TRACING === 'true',
    includeCompliance: process.env.INCLUDE_COMPLIANCE === 'true',
    generateExcelReport: process.env.GENERATE_EXCEL === 'true',
    
    // Archival & Retention
    archiveReports: process.env.ARCHIVE_REPORTS === 'true',
    retentionDays: parseInt(process.env.REPORT_RETENTION_DAYS || '90'),
    
    // Distribution
    emailReports: process.env.EMAIL_REPORTS === 'true',
    slackNotification: process.env.SLACK_NOTIFICATION === 'true',
    teamsNotification: process.env.TEAMS_NOTIFICATION === 'true'
  },

  // 🏥 Enterprise Health Checks & Service Discovery - TEMPORARILY DISABLED FOR REPORTER TESTING
  healthChecks: [] as any[], // Disabled until reporter integration is complete
  /*
  healthChecks: [
    {
      name: 'API Gateway',
      client: 'api',
      endpoint: process.env.HEALTH_CHECK_ENDPOINT || '/posts/1',
      expectedStatus: 200,
      timeout: 5000,
      critical: true
    },
    {
      name: 'User Service',
      client: 'userService',
      endpoint: '/users/1',
      expectedStatus: 200,
      timeout: 3000,
      critical: true
    },
    {
      name: 'Order Service',
      client: 'orderService',
      endpoint: '/status',
      expectedStatus: 200,
      timeout: 5000,
      critical: false
    },
    {
      name: 'Payment Gateway',
      client: 'paymentGateway',
      endpoint: '/health',
      expectedStatus: 200,
      timeout: 10000,
      critical: true
    },
    {
      name: 'Authentication Service',
      client: 'auth',
      endpoint: '/auth/health',
      expectedStatus: 200,
      timeout: 3000,
      critical: true
    }
  ],
  */

  // 🗄️ Enterprise Database Configuration
  // databases: {
  //   // Primary Database (PostgreSQL)
  //   primary: {
  //     type: 'postgresql' as const,
  //     host: process.env.DB_HOST || 'localhost',
  //     port: parseInt(process.env.DB_PORT || '5432'),
  //     database: process.env.DB_NAME || 'testdb',
  //     username: process.env.DB_USERNAME || 'postgres',
  //     password: process.env.DB_PASSWORD || 'password',
  //     connectionString: process.env.DB_CONNECTION_STRING || '',
  //     timeout: parseInt(process.env.DB_TIMEOUT || '30000'),
  //     pool: {
  //       min: parseInt(process.env.DB_POOL_MIN || '1'),
  //       max: parseInt(process.env.DB_POOL_MAX || '10'),
  //       idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  //       acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000')
  //     },
  //     options: {
  //       ssl: process.env.DB_SSL === 'true',
  //       application_name: process.env.DB_APP_NAME || 'RestifiedTS-Enterprise',
  //       schema: process.env.DB_SCHEMA || 'public',
  //       search_path: process.env.DB_SEARCH_PATH || 'public'
  //     }
  //   },

  //   // Cache Database (Redis)
  //   cache: {
  //     type: 'redis' as const,
  //     host: process.env.REDIS_HOST || 'localhost',
  //     port: parseInt(process.env.REDIS_PORT || '6379'),
  //     password: process.env.REDIS_PASSWORD || '',
  //     timeout: parseInt(process.env.REDIS_TIMEOUT || '10000'),
  //     options: {
  //       database: parseInt(process.env.REDIS_DATABASE || '0'),
  //       keyPrefix: process.env.REDIS_KEY_PREFIX || 'restified:test:',
  //       maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  //       lazyConnect: process.env.REDIS_LAZY_CONNECT !== 'false',
  //       commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000')
  //     }
  //   },

  //   // Analytics Database (MySQL)
  //   analytics: {
  //     type: 'mysql' as const,
  //     host: process.env.MYSQL_HOST || 'localhost',
  //     port: parseInt(process.env.MYSQL_PORT || '3306'),
  //     database: process.env.MYSQL_DATABASE || 'analytics',
  //     username: process.env.MYSQL_USERNAME || 'root',
  //     password: process.env.MYSQL_PASSWORD || 'password',
  //     timeout: parseInt(process.env.MYSQL_TIMEOUT || '60000'),
  //     pool: {
  //       min: parseInt(process.env.MYSQL_POOL_MIN || '1'),
  //       max: parseInt(process.env.MYSQL_POOL_MAX || '10')
  //     },
  //     options: {
  //       charset: process.env.MYSQL_CHARSET || 'utf8mb4',
  //       timezone: process.env.MYSQL_TIMEZONE || 'UTC',
  //       ssl: process.env.MYSQL_SSL === 'true',
  //       multipleStatements: process.env.MYSQL_MULTIPLE_STATEMENTS === 'true',
  //       reconnect: process.env.MYSQL_RECONNECT !== 'false'
  //     }
  //   },

  //   // Document Database (MongoDB)
  //   documents: {
  //     type: 'mongodb' as const,
  //     connectionString: process.env.MONGO_CONNECTION_STRING || 'mongodb://localhost:27017/testdb',
  //     host: process.env.MONGO_HOST || 'localhost',
  //     port: parseInt(process.env.MONGO_PORT || '27017'),
  //     database: process.env.MONGO_DATABASE || 'documents',
  //     username: process.env.MONGO_USERNAME || '',
  //     password: process.env.MONGO_PASSWORD || '',
  //     timeout: parseInt(process.env.MONGO_TIMEOUT || '30000'),
  //     options: {
  //       authSource: process.env.MONGO_AUTH_SOURCE || 'admin',
  //       maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10'),
  //       minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '1'),
  //       maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME || '30000'),
  //       serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000'),
  //       retryWrites: process.env.MONGO_RETRY_WRITES !== 'false',
  //       retryReads: process.env.MONGO_RETRY_READS !== 'false'
  //     }
  //   },

  //   // Test Database (SQLite - for local testing)
  //   test: {
  //     type: 'sqlite' as const,
  //     options: {
  //       filename: process.env.SQLITE_FILENAME || ':memory:',
  //       memory: process.env.SQLITE_MEMORY !== 'false',
  //       readonly: process.env.SQLITE_READONLY === 'true',
  //       timeout: parseInt(process.env.SQLITE_TIMEOUT || '5000'),
  //       journalMode: process.env.SQLITE_JOURNAL_MODE || 'WAL',
  //       synchronous: process.env.SQLITE_SYNCHRONOUS || 'NORMAL',
  //       pragmas: {
  //         'foreign_keys': 'ON',
  //         'journal_size_limit': 67108864,
  //         'cache_size': parseInt(process.env.SQLITE_CACHE_SIZE || '2000')
  //       }
  //     }
  //   },

  //   // Enterprise Database (SQL Server)
  //   enterprise: {
  //     type: 'mssql' as const,
  //     host: process.env.MSSQL_HOST || 'localhost',
  //     port: parseInt(process.env.MSSQL_PORT || '1433'),
  //     database: process.env.MSSQL_DATABASE || 'enterprise',
  //     username: process.env.MSSQL_USERNAME || 'sa',
  //     password: process.env.MSSQL_PASSWORD || 'YourStrong!Passw0rd',
  //     timeout: parseInt(process.env.MSSQL_TIMEOUT || '15000'),
  //     pool: {
  //       min: parseInt(process.env.MSSQL_POOL_MIN || '0'),
  //       max: parseInt(process.env.MSSQL_POOL_MAX || '10')
  //     },
  //     options: {
  //       encrypt: process.env.MSSQL_ENCRYPT !== 'false',
  //       trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERT !== 'false',
  //       enableArithAbort: process.env.MSSQL_ENABLE_ARITH_ABORT !== 'false',
  //       requestTimeout: parseInt(process.env.MSSQL_REQUEST_TIMEOUT || '30000'),
  //       connectionTimeout: parseInt(process.env.MSSQL_CONNECTION_TIMEOUT || '15000')
  //     }
  //   }
  // },

  // // 🗄️ Database State Management Configuration
  // databaseStateManagement: {
  //   // Enable database state validation in tests
  //   enabled: process.env.DB_STATE_VALIDATION !== 'false',
    
  //   // Automatic cleanup after test suites
  //   autoCleanup: process.env.DB_AUTO_CLEANUP !== 'false',
    
  //   // Snapshot configuration
  //   enableSnapshots: process.env.DB_ENABLE_SNAPSHOTS === 'true',
  //   snapshotRetention: parseInt(process.env.DB_SNAPSHOT_RETENTION || '24'), // hours
    
  //   // Health check configuration
  //   healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '60000'), // ms
  //   enableHealthChecks: process.env.DB_ENABLE_HEALTH_CHECKS !== 'false',
    
  //   // Transaction configuration
  //   defaultTransactionTimeout: parseInt(process.env.DB_DEFAULT_TX_TIMEOUT || '30000'),
  //   enableTransactionLogging: process.env.DB_ENABLE_TX_LOGGING === 'true',
    
  //   // Migration and seeding
  //   enableMigrations: process.env.DB_ENABLE_MIGRATIONS === 'true',
  //   seedDataPath: process.env.DB_SEED_DATA_PATH || './test-data/seeds',
  //   migrationPath: process.env.DB_MIGRATION_PATH || './test-data/migrations'
  // },

  // // 🚀 Enterprise Performance & Load Testing
  // performance: {
  //   enabled: process.env.PERFORMANCE_TESTING === 'true',
  //   engine: (process.env.PERFORMANCE_ENGINE as 'k6' | 'artillery') || 'k6', // k6 or artillery
  //   scenarios: {
  //     smoke: {
  //       vus: parseInt(process.env.SMOKE_VUS || '1'),
  //       duration: process.env.SMOKE_DURATION || '30s'
  //     },
  //     load: {
  //       vus: parseInt(process.env.LOAD_VUS || '10'),
  //       duration: process.env.LOAD_DURATION || '5m'
  //     },
  //     stress: {
  //       vus: parseInt(process.env.STRESS_VUS || '50'),
  //       duration: process.env.STRESS_DURATION || '10m'
  //     },
  //     spike: {
  //       vus: parseInt(process.env.SPIKE_VUS || '100'),
  //       duration: process.env.SPIKE_DURATION || '2m'
  //     }
  //   },
  //   thresholds: {
  //     http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
  //     http_req_failed: ['rate<0.1'],    // Error rate under 10%
  //     http_reqs: ['rate>10']            // More than 10 requests per second
  //   }
  // },

  // // 🔒 Enterprise Security & Compliance
  // security: {
  //   enabled: process.env.SECURITY_TESTING === 'true',
  //   zapProxy: {
  //     enabled: process.env.ZAP_ENABLED === 'true',
  //     host: process.env.ZAP_HOST || 'localhost',
  //     port: parseInt(process.env.ZAP_PORT || '8080'),
  //     apiKey: process.env.ZAP_API_KEY || ''
  //   },
  //   scanTypes: ['passive', 'active', 'baseline'],
  //   complianceFrameworks: ['OWASP', 'GDPR', 'SOX', 'HIPAA'],
  //   sensitiveDataPatterns: [
  //     'credit-card', 'ssn', 'email', 'phone', 'api-key'
  //   ]
  // }
}
export default config;