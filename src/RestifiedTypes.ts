export interface RequestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  retries?: number;
  retryDelay?: number;
}

export interface AuthConfig {
  type: 'bearer' | 'basic' | 'api-key' | 'oauth2';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  keyName?: string;
  keyLocation?: 'header' | 'query';
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  tokenUrl?: string;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  config: any;
}

// Enhanced configuration for user-friendly setup
export interface EnvironmentConfig {
  name: string;
  timeout: number;
  retries: number;
  enableLogging: boolean;
  // Enterprise-specific settings
  datacenter?: string;
  region?: string;
  cluster?: string;
  deployment?: string;
}

export interface AuthenticationConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  client: string;
  extractors: {
    token: string;
    userEmail: string;
    userId: string;
    // Enterprise-specific extractions
    roles?: string;
    permissions?: string;
    tenantId?: string;
    organizationId?: string;
    sessionId?: string;
    refreshToken?: string;
  };
  fallback: {
    token: string;
    userEmail: string;
    userId: number;
    // Enterprise-specific fallbacks
    roles?: string[];
    permissions?: string[];
    tenantId?: string;
    organizationId?: string;
    sessionId?: string;
    refreshToken?: string;
  };
  autoApplyToClients?: string[] | 'all'; // Which clients to auto-apply auth token to
  authHeaderName?: string; // Custom auth header name (default: 'Authorization')
  // Enterprise security settings
  tokenRefreshThreshold?: number;
  enableTokenRefresh?: boolean;
  secureTokenStorage?: boolean;
}

export interface ReportingConfig {
  enabled: boolean;
  outputDir: string;
  formats: ('html' | 'json' | 'xml' | 'junit')[];
  openAfterGeneration: boolean;
  includeRequestResponse: boolean;
  includeScreenshots: boolean;
  // Enterprise reporting features
  includeMetrics?: boolean;
  includeTracing?: boolean;
  includeCompliance?: boolean;
  generateExcelReport?: boolean;
  // Archival & Retention
  archiveReports?: boolean;
  retentionDays?: number;
  // Distribution
  emailReports?: boolean;
  slackNotification?: boolean;
  teamsNotification?: boolean;
}

export interface HealthCheckConfig {
  name: string;
  client: string;
  endpoint: string;
  expectedStatus: number;
  timeout?: number;
  critical?: boolean;
}

export interface RestifiedConfig {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  auth?: AuthConfig;
  retries?: number;
  retryDelay?: number;
  clients?: Record<string, RequestConfig>;
  hooks?: {
    globalSetup?: () => Promise<void>;
    globalTeardown?: () => Promise<void>;
    beforeEach?: () => Promise<void>;
    afterEach?: () => Promise<void>;
    onRequest?: (config: any) => Promise<any>;
    onResponse?: (response: HttpResponse) => Promise<HttpResponse>;
    onError?: (error: any) => Promise<any>;
  };
  variables?: Record<string, any>;
  
  // Enhanced configuration options
  environment?: EnvironmentConfig;
  globalHeaders?: Record<string, string>;
  authentication?: AuthenticationConfig;
  globalVariables?: Record<string, any>;
  environmentVariables?: Record<string, string>;
  reporting?: ReportingConfig;
  healthChecks?: HealthCheckConfig[];
  schema?: {
    validator?: 'ajv';
    strictMode?: boolean;
    formats?: string[];
  };
  // Enterprise-specific configurations
  performance?: PerformanceConfig;
  security?: SecurityConfig;
}

export interface VariableContext {
  global: Record<string, any>;
  local: Record<string, any>;
  environment: Record<string, any>;
  extracted: Record<string, any>;
}

export interface AssertionResult {
  passed: boolean;
  message: string;
  actual?: any;
  expected?: any;
}

export interface TestExecutionContext {
  variables: VariableContext;
  response?: HttpResponse;
  startTime?: number;
  endTime?: number;
  assertions: AssertionResult[];
}

export interface SchemaValidationOptions {
  schema: object;
  data: any;
  strictMode?: boolean;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  headers?: Record<string, string>;
  timeout?: number;
}

export interface GraphQLConfig {
  endpoint: string;
  headers?: Record<string, string>;
  variables?: Record<string, any>;
}

// Enterprise Performance Testing Configuration
export interface PerformanceConfig {
  enabled: boolean;
  engine: 'k6' | 'artillery';
  scenarios: {
    smoke: {
      vus: number;
      duration: string;
    };
    load: {
      vus: number;
      duration: string;
    };
    stress: {
      vus: number;
      duration: string;
    };
    spike: {
      vus: number;
      duration: string;
    };
  };
  thresholds: Record<string, string[]>;
}

// Enterprise Security Testing Configuration
export interface SecurityConfig {
  enabled: boolean;
  zapProxy: {
    enabled: boolean;
    host: string;
    port: number;
    apiKey: string;
  };
  scanTypes: string[];
  complianceFrameworks: string[];
  sensitiveDataPatterns: string[];
}