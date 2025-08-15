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
  
  // Report customization
  title?: string;                    // Custom report title (default: "Restified Test Report")
  filename?: string;                 // Custom report filename (default: "restified-html-report.html")
  subtitle?: string;                 // Optional subtitle/description
  
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
  databases?: Record<string, DatabaseConfigEntry>;
  databaseStateManagement?: DatabaseStateManagementConfig;
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

// Database Configuration Types
export interface DatabasePoolConfig {
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
}

export interface DatabaseConfigOptions {
  // Common options
  ssl?: boolean | {
    ca?: string;
    cert?: string;
    key?: string;
    rejectUnauthorized?: boolean;
    servername?: string;
  };
  
  // MySQL/MariaDB specific
  charset?: string;
  timezone?: string;
  acquireTimeout?: number;
  multipleStatements?: boolean;
  supportBigNumbers?: boolean;
  bigNumberStrings?: boolean;
  dateStrings?: boolean;
  debug?: boolean;
  trace?: boolean;
  stringifyObjects?: boolean;
  reconnect?: boolean;
  queueLimit?: number;
  
  // PostgreSQL specific
  schema?: string;
  application_name?: string;
  search_path?: string;
  client_encoding?: string;
  
  // SQLite specific
  filename?: string;
  memory?: boolean;
  readonly?: boolean;
  fileMustExist?: boolean;
  journalMode?: string;
  synchronous?: string;
  tempStore?: string;
  mmapSize?: number;
  cacheSize?: number;
  pragmas?: Record<string, any>;
  functions?: Record<string, Function>;
  
  // MongoDB specific
  authSource?: string;
  replicaSet?: string;
  readPreference?: string;
  writeConcern?: any;
  maxPoolSize?: number;
  minPoolSize?: number;
  maxIdleTimeMS?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  connectTimeoutMS?: number;
  heartbeatFrequencyMS?: number;
  retryWrites?: boolean;
  retryReads?: boolean;
  compressors?: string[];
  
  // Redis specific
  family?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  enableOfflineQueue?: boolean;
  maxRetriesPerRequest?: number;
  retryConnectOnFailure?: boolean;
  lazyConnect?: boolean;
  keepAlive?: number;
  commandTimeout?: number;
  maxmemoryPolicy?: string;
  
  // SQL Server specific
  server?: string;
  user?: string;
  domain?: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  cancelTimeout?: number;
  authentication?: any;
  
  // Generic options
  [key: string]: any;
}

export interface DatabaseConfigEntry {
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb' | 'redis' | 'mssql' | 'oracle' | 'elasticsearch';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  connectionString?: string;
  timeout?: number;
  pool?: DatabasePoolConfig;
  options?: DatabaseConfigOptions;
}

export interface DatabaseStateManagementConfig {
  enabled: boolean;
  autoCleanup: boolean;
  enableSnapshots: boolean;
  snapshotRetention: number;
  healthCheckInterval: number;
  enableHealthChecks: boolean;
  defaultTransactionTimeout: number;
  enableTransactionLogging: boolean;
  enableMigrations: boolean;
  seedDataPath: string;
  migrationPath: string;
}