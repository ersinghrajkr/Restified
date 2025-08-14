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
      baseURL: process.env.API_GATEWAY_URL || 'https://jsonplaceholder.typicode.com',
      timeout: parseInt(process.env.API_TIMEOUT || '10000'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': process.env.API_VERSION || 'v1',
        'X-Client-ID': process.env.CLIENT_ID || 'testproject-test-suite',
        'X-Correlation-ID': '{{$random.uuid}}',
        'X-Source': 'enterprise-testing'
      },
      retries: 3,
      retryDelay: 1000
    },

    // Authentication service client
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
    'X-Test-Suite': process.env.TEST_SUITE_NAME || 'testproject-api-tests',
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
    testSuite: process.env.TEST_SUITE_NAME || 'testproject-api-tests',
    
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
      title: 'TestProject API Test Report',
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
