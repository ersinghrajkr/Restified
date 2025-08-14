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

    // User Service (Microservice Architecture)
    userService: {
      baseURL: process.env.USER_SERVICE_URL || 'https://jsonplaceholder.typicode.com',
      timeout: parseInt(process.env.USER_SERVICE_TIMEOUT || '8000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Service': 'user-service',
        'X-Version': 'v2'
      },
      retries: 2
    },

    // Order Service (E-commerce/Business Logic)
    orderService: {
      baseURL: process.env.ORDER_SERVICE_URL || 'https://httpbin.org',
      timeout: parseInt(process.env.ORDER_SERVICE_TIMEOUT || '12000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Service': 'order-service',
        'X-Business-Unit': process.env.BUSINESS_UNIT || 'retail'
      },
      retries: 3
    },

    // Payment Gateway Integration
    paymentGateway: {
      baseURL: process.env.PAYMENT_GATEWAY_URL || 'https://httpbin.org',
      timeout: parseInt(process.env.PAYMENT_TIMEOUT || '20000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Service': 'payment-gateway',
        'X-PCI-Compliant': 'true'
      },
      retries: 5,
      retryDelay: 2000
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
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
  },

  // 📈 Enterprise Reporting & Analytics Configuration
  reporting: {
    enabled: process.env.REPORTING_ENABLED !== 'false',
    outputDir: process.env.REPORT_OUTPUT_DIR || 'reports',
    formats: ['html', 'json', 'xml', 'junit'],
    openAfterGeneration: process.env.OPEN_REPORT === 'true',
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

  // 🏥 Enterprise Health Checks & Service Discovery
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

  // 🚀 Enterprise Performance & Load Testing
  performance: {
    enabled: process.env.PERFORMANCE_TESTING === 'true',
    engine: (process.env.PERFORMANCE_ENGINE as 'k6' | 'artillery') || 'k6', // k6 or artillery
    scenarios: {
      smoke: {
        vus: parseInt(process.env.SMOKE_VUS || '1'),
        duration: process.env.SMOKE_DURATION || '30s'
      },
      load: {
        vus: parseInt(process.env.LOAD_VUS || '10'),
        duration: process.env.LOAD_DURATION || '5m'
      },
      stress: {
        vus: parseInt(process.env.STRESS_VUS || '50'),
        duration: process.env.STRESS_DURATION || '10m'
      },
      spike: {
        vus: parseInt(process.env.SPIKE_VUS || '100'),
        duration: process.env.SPIKE_DURATION || '2m'
      }
    },
    thresholds: {
      http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
      http_req_failed: ['rate<0.1'],    // Error rate under 10%
      http_reqs: ['rate>10']            // More than 10 requests per second
    }
  },

  // 🔒 Enterprise Security & Compliance
  security: {
    enabled: process.env.SECURITY_TESTING === 'true',
    zapProxy: {
      enabled: process.env.ZAP_ENABLED === 'true',
      host: process.env.ZAP_HOST || 'localhost',
      port: parseInt(process.env.ZAP_PORT || '8080'),
      apiKey: process.env.ZAP_API_KEY || ''
    },
    scanTypes: ['passive', 'active', 'baseline'],
    complianceFrameworks: ['OWASP', 'GDPR', 'SOX', 'HIPAA'],
    sensitiveDataPatterns: [
      'credit-card', 'ssn', 'email', 'phone', 'api-key'
    ]
  }
}
export default config;