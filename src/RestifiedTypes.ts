/**
 * Configuration for HTTP requests
 * @interface RequestConfig
 * @example
 * ```typescript
 * const config: RequestConfig = {
 *   baseURL: 'https://api.example.com',
 *   timeout: 30000,
 *   headers: { 'User-Agent': 'MyApp/1.0' },
 *   retries: 3
 * };
 * ```
 */
export interface RequestConfig {
  /** Base URL for requests (e.g., 'https://api.example.com') */
  baseURL?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** HTTP headers to include with requests */
  headers?: Record<string, string>;
  /** Authentication configuration */
  auth?: AuthConfig;
  /** Number of retry attempts on failure (default: 0) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Connection pool configuration for performance optimization */
  connectionPool?: ConnectionPoolConfig;
  /** Smart retry configuration for reliability */
  retry?: RetryConfig;
  /** Circuit breaker configuration for resilience */
  circuitBreaker?: CircuitBreakerConfig;
  /** Intelligent timeout configuration for context-aware timeouts */
  timeoutIntelligence?: TimeoutConfig;
  /** Error recovery configuration for graceful degradation */
  errorRecovery?: ErrorRecoveryConfig;
  /** Advanced performance configuration for optimization features */
  advancedPerformance?: AdvancedPerformanceConfig;
}

/**
 * Connection pool configuration for HTTP performance optimization
 * @interface ConnectionPoolConfig
 * @example
 * ```typescript
 * const poolConfig: ConnectionPoolConfig = {
 *   keepAlive: true,
 *   maxSockets: 50,
 *   maxFreeSockets: 10,
 *   http2: true,
 *   timeout: 30000
 * };
 * ```
 */
export interface ConnectionPoolConfig {
  /** Enable connection keep-alive for connection reuse (default: true) */
  keepAlive?: boolean;
  /** Maximum number of concurrent connections per host (default: 50) */
  maxSockets?: number;
  /** Maximum number of idle connections to keep open (default: 10) */
  maxFreeSockets?: number;
  /** Connection timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Enable HTTP/2 support where available (default: true) */
  http2?: boolean;
  /** Keep-alive timeout in milliseconds (default: 60000) */
  keepAliveMsecs?: number;
  /** Enable TCP_NODELAY for reduced latency (default: true) */
  noDelay?: boolean;
  /** Initial delay for keep-alive probes in milliseconds (default: 1000) */
  keepAliveInitialDelay?: number;
}

/**
 * Smart retry configuration for HTTP request reliability
 * @interface RetryConfig
 * @example
 * ```typescript
 * const retryConfig: RetryConfig = {
 *   enabled: true,
 *   maxAttempts: 3,
 *   baseDelay: 1000,
 *   retryOnStatusCodes: [429, 500, 502, 503, 504]
 * };
 * ```
 */
export interface RetryConfig {
  /** Enable retry mechanism (default: true) */
  enabled?: boolean;
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelay?: number;
  /** Maximum delay between retries in milliseconds (default: 30000) */
  maxDelay?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Add random jitter to prevent thundering herd (default: true) */
  enableJitter?: boolean;
  /** Maximum jitter as percentage of delay (default: 0.1 = 10%) */
  jitterFactor?: number;
  /** HTTP status codes that should trigger retries (default: [408, 429, 500, 502, 503, 504]) */
  retryOnStatusCodes?: number[];
  /** Retry on network errors (default: true) */
  retryOnNetworkError?: boolean;
  /** Retry on timeout (default: true) */
  retryOnTimeout?: boolean;
  /** Custom retry condition function */
  retryCondition?: (error: any, attempt: number) => boolean;
  /** Callback function called before each retry attempt */
  onRetry?: (error: any, attempt: number, delay: number) => void;
  /** Callback function called when max attempts reached */
  onMaxAttemptsReached?: (error: any, attempts: number) => void;
}

/**
 * Authentication configuration for API requests
 * @interface AuthConfig
 * @example
 * ```typescript
 * // Bearer token authentication
 * const bearerAuth: AuthConfig = {
 *   type: 'bearer',
 *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * };
 * 
 * // Basic authentication
 * const basicAuth: AuthConfig = {
 *   type: 'basic',
 *   username: 'user@example.com',
 *   password: 'password123'
 * };
 * 
 * // API Key authentication
 * const apiKeyAuth: AuthConfig = {
 *   type: 'api-key',
 *   apiKey: 'sk-1234567890abcdef',
 *   keyName: 'X-API-Key',
 *   keyLocation: 'header'
 * };
 * ```
 */
export interface AuthConfig {
  /** Authentication type */
  type: 'bearer' | 'basic' | 'api-key' | 'oauth2';
  /** Bearer token (for bearer auth) */
  token?: string;
  /** Username (for basic auth) */
  username?: string;
  /** Password (for basic auth) */
  password?: string;
  /** API key value (for api-key auth) */
  apiKey?: string;
  /** API key header/query parameter name (for api-key auth) */
  keyName?: string;
  /** Where to place the API key (for api-key auth) */
  keyLocation?: 'header' | 'query';
  /** OAuth2 client ID */
  clientId?: string;
  /** OAuth2 client secret */
  clientSecret?: string;
  /** OAuth2 scope */
  scope?: string;
  /** OAuth2 token endpoint URL */
  tokenUrl?: string;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  config: any;
  error?: string; // Optional error message for failed requests
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
  
  // Login credentials for authentication request
  credentials?: {
    email?: string;
    password?: string;
    username?: string;
    // OAuth2 credentials
    clientId?: string;
    clientSecret?: string;
    // Custom credential fields
    [key: string]: any;
  };
  
  extractors: {
    token: string;
    userEmail?: string;
    userId?: string;
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
    userEmail?: string;
    userId?: number;
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
  outputFile?: string;               // Custom output file path (optional)
  formats: ('html' | 'json' | 'xml' | 'junit')[];
  openAfterGeneration: boolean;
  includeRequestResponse: boolean;
  includeScreenshots: boolean;
  
  // Report customization
  title?: string;                    // Custom report title (default: "Restified Test Report")
  logo?: string;                     // Custom logo/emoji for reports (default: none)
  filename?: string;                 // Custom report filename (default: "restified-html-report.html")
  subtitle?: string;                 // Optional subtitle/description
  
  // Enterprise reporting features
  includeMetrics?: boolean;
  includeTracing?: boolean;
  includeCompliance?: boolean;
  generateExcelReport?: boolean;
  
  // Theme configuration
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  
  // Footer configuration
  footer?: {
    show?: boolean;
    text?: string;
    links?: Array<{
      text: string;
      url: string;
      external?: boolean;
    }>;
    copyright?: string;
    timestamp?: boolean;
    version?: string;
    customHtml?: string;
  };
  
  // Branding configuration
  branding?: {
    showPoweredBy?: boolean;
    company?: string;
    website?: string;
  };
  
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
  /** Global retry configuration applied to all requests */
  retry?: RetryConfig;
  /** Global connection pool configuration */
  connectionPool?: ConnectionPoolConfig;
  /** Global circuit breaker configuration */
  circuitBreaker?: CircuitBreakerConfig;
  /** Global timeout intelligence configuration */
  timeoutIntelligence?: TimeoutConfig;
  /** Global error recovery configuration */
  errorRecovery?: ErrorRecoveryConfig;
  /** Global advanced performance configuration */
  advancedPerformance?: AdvancedPerformanceConfig;
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
  
  // GraphQL Configuration
  graphql?: {
    clients?: Record<string, {
      endpoint: string;
      headers?: Record<string, string>;
      timeout?: number;
      retries?: number;
      retryDelay?: number;
    }>;
    introspection?: {
      enabled?: boolean;
      cacheSchema?: boolean;
    };
  };
  
  // WebSocket Configuration
  websocket?: {
    clients?: Record<string, {
      url: string;
      protocols?: string[];
      headers?: Record<string, string>;
      timeout?: number;
      reconnectAttempts?: number;
      reconnectDelay?: number;
      pingInterval?: number;
      pongTimeout?: number;
    }>;
  };
  
  // Fixtures Configuration
  fixtures?: {
    baseDirectory?: string;
    autoResolveVariables?: boolean;
    variablePrefix?: string;
    variableSuffix?: string;
    fakerLocale?: string;
    enableFakerFunctions?: boolean;
  };
  
  // Variable Resolution Configuration
  variableResolvers?: {
    resolvers?: {
      faker?: {
        enabled?: boolean;
        locale?: string;
      };
      random?: {
        enabled?: boolean;
        seed?: number;
      };
      date?: {
        enabled?: boolean;
        timezone?: string;
      };
      util?: {
        enabled?: boolean;
        base64Encoding?: string;
      };
    };
  };
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

/**
 * Circuit Breaker Pattern configuration for network resilience
 * @interface CircuitBreakerConfig
 * @example
 * ```typescript
 * const circuitConfig: CircuitBreakerConfig = {
 *   enabled: true,
 *   failureThreshold: 5,
 *   failureThresholdPercentage: 50,
 *   requestVolumeThreshold: 10,
 *   timeoutDuration: 30000,
 *   resetTimeoutDuration: 60000
 * };
 * ```
 */
export interface CircuitBreakerConfig {
  /** Enable circuit breaker protection (default: true) */
  enabled?: boolean;
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Failure percentage threshold (0-100) before opening circuit (default: 50) */
  failureThresholdPercentage?: number;
  /** Minimum number of requests before evaluating circuit (default: 10) */
  requestVolumeThreshold?: number;
  /** Individual request timeout in milliseconds (default: 30000) */
  timeoutDuration?: number;
  /** Time to wait before transitioning from OPEN to HALF_OPEN in milliseconds (default: 60000) */
  resetTimeoutDuration?: number;
  /** Maximum attempts allowed in HALF_OPEN state (default: 3) */
  halfOpenMaxAttempts?: number;
  /** Monitoring window period in milliseconds (default: 60000) */
  monitoringPeriod?: number;
  /** Response time threshold for considering request as slow/failed (default: 5000) */
  responseTimeThreshold?: number;
  /** Callback function when circuit opens */
  onCircuitOpen?: (circuitId: string, stats: any) => Promise<void> | void;
  /** Callback function when circuit closes */
  onCircuitClose?: (circuitId: string, stats: any) => Promise<void> | void;
  /** Callback function when circuit transitions to half-open */
  onCircuitHalfOpen?: (circuitId: string, stats: any) => Promise<void> | void;
}

/**
 * Circuit Breaker states
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Request Timeout Intelligence configuration for context-aware timeouts
 * @interface TimeoutConfig
 * @example
 * ```typescript
 * const timeoutConfig: TimeoutConfig = {
 *   enabled: true,
 *   baseTimeout: 30000,
 *   adaptiveTimeout: true,
 *   learningEnabled: true,
 *   patternMatching: true
 * };
 * ```
 */
export interface TimeoutConfig {
  /** Enable intelligent timeout management (default: true) */
  enabled?: boolean;
  /** Base timeout in milliseconds (default: 30000) */
  baseTimeout?: number;
  /** Enable adaptive timeout based on historical performance (default: true) */
  adaptiveTimeout?: boolean;
  /** Enable learning from response times and timeout events (default: true) */
  learningEnabled?: boolean;
  /** Minimum allowed timeout in milliseconds (default: 1000) */
  minTimeout?: number;
  /** Maximum allowed timeout in milliseconds (default: 300000) */
  maxTimeout?: number;
  /** Confidence threshold for applying adaptive timeouts (default: 0.8) */
  confidenceThreshold?: number;
  /** Interval for automatic timeout optimization in milliseconds (default: 300000) */
  optimizationInterval?: number;
  /** Enable endpoint pattern matching for smart timeout assignment (default: true) */
  patternMatching?: boolean;
  /** Enable performance tracking for timeout intelligence (default: true) */
  performanceTracking?: boolean;
  /** Multiplier for calculating timeout from P95 response time (default: 2.5) */
  timeoutMultiplier?: number;
  /** Threshold for considering a request as slow (0.0-1.0 of timeout) (default: 0.8) */
  slowRequestThreshold?: number;
}

/**
 * Endpoint pattern for intelligent timeout assignment
 * @interface EndpointPattern
 * @example
 * ```typescript
 * const searchPattern: EndpointPattern = {
 *   name: 'search',
 *   pattern: /\/search($|\/|\?)/i,
 *   methods: ['GET', 'POST'],
 *   baseTimeout: 20000,
 *   multiplier: 2.0,
 *   description: 'Search operations typically need more time'
 * };
 * ```
 */
export interface EndpointPattern {
  /** Pattern name for identification */
  name: string;
  /** Regular expression to match endpoint URLs */
  pattern: RegExp;
  /** HTTP methods this pattern applies to */
  methods: string[];
  /** Base timeout for this pattern in milliseconds */
  baseTimeout?: number;
  /** Multiplier to apply to base timeout */
  multiplier?: number;
  /** Description of what this pattern matches */
  description?: string;
}

/**
 * Timeout profile for specific endpoint types
 */
export interface TimeoutProfile {
  /** Profile name */
  name: string;
  /** Base timeout for this profile */
  baseTimeout: number;
  /** Adaptive multiplier */
  multiplier: number;
  /** Whether to enable learning for this profile */
  learningEnabled: boolean;
  /** Pattern matching rules */
  patterns?: EndpointPattern[];
}

/**
 * Error Recovery configuration for graceful degradation
 * @interface ErrorRecoveryConfig
 * @example
 * ```typescript
 * const recoveryConfig: ErrorRecoveryConfig = {
 *   enabled: true,
 *   enableFallbacks: true,
 *   enableCaching: true,
 *   enableDegradation: true,
 *   cacheTimeout: 300000,
 *   maxFallbackAttempts: 3
 * };
 * ```
 */
export interface ErrorRecoveryConfig {
  /** Enable error recovery mechanisms (default: true) */
  enabled?: boolean;
  /** Enable fallback strategies (default: true) */
  enableFallbacks?: boolean;
  /** Enable response caching for fallbacks (default: true) */
  enableCaching?: boolean;
  /** Enable graceful degradation (default: true) */
  enableDegradation?: boolean;
  /** Cache timeout in milliseconds (default: 300000) */
  cacheTimeout?: number;
  /** Maximum fallback attempts before giving up (default: 3) */
  maxFallbackAttempts?: number;
  /** Timeout before attempting recovery from degradation (default: 60000) */
  degradationTimeout?: number;
  /** Interval between recovery attempts in milliseconds (default: 30000) */
  recoveryAttemptInterval?: number;
  /** Health check interval in milliseconds (default: 60000) */
  healthCheckInterval?: number;
  /** Timeout for individual fallback execution (default: 10000) */
  fallbackTimeout?: number;
  /** Enable automatic recovery attempts (default: true) */
  autoRecovery?: boolean;
}

/**
 * Fallback strategy for error recovery
 * @interface FallbackStrategy
 * @example
 * ```typescript
 * const cacheFallback: FallbackStrategy = {
 *   name: 'cache-fallback',
 *   type: 'cache',
 *   priority: 1,
 *   timeout: 5000,
 *   description: 'Return cached response if available',
 *   execute: async (error, context) => ({
 *     success: true,
 *     data: cachedData,
 *     source: 'cached'
 *   })
 * };
 * ```
 */
export interface FallbackStrategy {
  /** Strategy name for identification */
  name: string;
  /** Strategy type (cache, alternative, synthetic, default) */
  type: 'cache' | 'alternative' | 'synthetic' | 'default' | 'custom';
  /** Execution priority (lower numbers execute first) */
  priority: number;
  /** Execution timeout in milliseconds */
  timeout?: number;
  /** Description of what this strategy does */
  description?: string;
  /** Conditions when this strategy should be used */
  conditions?: {
    errorTypes?: string[];
    httpStatusCodes?: number[];
    methods?: string[];
    urlPatterns?: RegExp[];
  };
  /** Strategy execution function */
  execute: (error: Error, context: { method: string; url: string; body?: any }) => Promise<{
    success: boolean;
    data: any;
    source: 'primary' | 'fallback' | 'cached' | 'default' | 'synthetic';
    fallbackUsed?: string;
  }>;
}

/**
 * Recovery action for service restoration
 * @interface RecoveryAction
 * @example
 * ```typescript
 * const healthCheckAction: RecoveryAction = {
 *   name: 'health-check',
 *   type: 'health-check',
 *   priority: 1,
 *   interval: 30000,
 *   timeout: 5000,
 *   execute: async (endpointId) => {
 *     const response = await fetch(`${endpointId}/health`);
 *     return response.ok;
 *   }
 * };
 * ```
 */
export interface RecoveryAction {
  /** Action name for identification */
  name: string;
  /** Action type */
  type: 'health-check' | 'cache-warm' | 'reconnect' | 'reset' | 'custom';
  /** Execution priority (lower numbers execute first) */
  priority: number;
  /** Execution interval in milliseconds */
  interval?: number;
  /** Execution timeout in milliseconds */
  timeout?: number;
  /** Description of what this action does */
  description?: string;
  /** Recovery action execution function */
  execute: (endpointId: string) => Promise<void>;
}

// ================================
// Advanced Performance Configuration Types
// ================================

/**
 * Advanced Performance Configuration for RestifiedTS
 * @interface AdvancedPerformanceConfig
 * @example
 * ```typescript
 * const performanceConfig: AdvancedPerformanceConfig = {
 *   enabled: true,
 *   deduplication: { enabled: true, maxWaitTime: 30000 },
 *   caching: { enabled: true, maxCacheSize: 1000, defaultTtl: 300000 },
 *   batching: { enabled: true, maxBatchSize: 10, batchTimeout: 100 },
 *   streaming: { enabled: true, chunkSize: 65536 }
 * };
 * ```
 */
export interface AdvancedPerformanceConfig {
  /** Enable advanced performance features (default: true) */
  enabled?: boolean;
  
  /** Request deduplication configuration */
  deduplication?: RequestDeduplicationConfig;
  
  /** Response caching configuration */
  caching?: ResponseCachingConfig;
  
  /** Request batching configuration */
  batching?: RequestBatchingConfig;
  
  /** Streaming support configuration */
  streaming?: StreamingSupportConfig;
}

/**
 * Request Deduplication Configuration
 * @interface RequestDeduplicationConfig
 * @example
 * ```typescript
 * const deduplicationConfig: RequestDeduplicationConfig = {
 *   enabled: true,
 *   maxWaitTime: 30000,
 *   cacheTtl: 60000
 * };
 * ```
 */
export interface RequestDeduplicationConfig {
  /** Enable request deduplication (default: true) */
  enabled?: boolean;
  /** Maximum time to wait for duplicate request completion in ms (default: 30000) */
  maxWaitTime?: number;
  /** TTL for deduplication cache entries in ms (default: 60000) */
  cacheTtl?: number;
}

/**
 * Response Caching Configuration
 * @interface ResponseCachingConfig
 * @example
 * ```typescript
 * const cachingConfig: ResponseCachingConfig = {
 *   enabled: true,
 *   maxCacheSize: 1000,
 *   defaultTtl: 300000,
 *   evictionStrategy: 'lru'
 * };
 * ```
 */
export interface ResponseCachingConfig {
  /** Enable response caching (default: true) */
  enabled?: boolean;
  /** Maximum number of cached responses (default: 1000) */
  maxCacheSize?: number;
  /** Default cache TTL in milliseconds (default: 300000 - 5 minutes) */
  defaultTtl?: number;
  /** Enable automatic cache invalidation (default: true) */
  autoInvalidation?: boolean;
  /** Cache eviction strategy (default: 'lru') */
  evictionStrategy?: 'lru' | 'lfu' | 'fifo';
}

/**
 * Request Batching Configuration
 * @interface RequestBatchingConfig
 * @example
 * ```typescript
 * const batchingConfig: RequestBatchingConfig = {
 *   enabled: true,
 *   maxBatchSize: 10,
 *   batchTimeout: 100,
 *   autoBatch: true
 * };
 * ```
 */
export interface RequestBatchingConfig {
  /** Enable request batching (default: false) */
  enabled?: boolean;
  /** Maximum batch size (default: 10) */
  maxBatchSize?: number;
  /** Maximum wait time for batch collection in ms (default: 100) */
  batchTimeout?: number;
  /** Auto-batch similar requests (default: true) */
  autoBatch?: boolean;
}

/**
 * Streaming Support Configuration
 * @interface StreamingSupportConfig
 * @example
 * ```typescript
 * const streamingConfig: StreamingSupportConfig = {
 *   enabled: true,
 *   chunkSize: 65536,
 *   backpressureControl: true,
 *   maxMemoryUsage: 104857600
 * };
 * ```
 */
export interface StreamingSupportConfig {
  /** Enable streaming support (default: true) */
  enabled?: boolean;
  /** Chunk size for streaming responses in bytes (default: 65536 - 64KB) */
  chunkSize?: number;
  /** Enable backpressure control (default: true) */
  backpressureControl?: boolean;
  /** Maximum memory usage for streaming in bytes (default: 104857600 - 100MB) */
  maxMemoryUsage?: number;
}

/**
 * Cache Options for individual requests
 * @interface CacheOptions
 * @example
 * ```typescript
 * const cacheOptions: CacheOptions = {
 *   ttl: 600000,
 *   cacheable: true,
 *   cacheKey: 'users-list'
 * };
 * ```
 */
export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Whether this request is cacheable */
  cacheable?: boolean;
  /** Custom cache key (default: auto-generated from request) */
  cacheKey?: string;
}

/**
 * Batch Options for individual requests
 * @interface BatchOptions
 * @example
 * ```typescript
 * const batchOptions: BatchOptions = {
 *   batchable: true,
 *   batchKey: 'user-operations'
 * };
 * ```
 */
export interface BatchOptions {
  /** Whether this request can be batched */
  batchable?: boolean;
  /** Custom batch key for grouping requests */
  batchKey?: string;
}

/**
 * Stream Options for individual requests
 * @interface StreamOptions
 * @example
 * ```typescript
 * const streamOptions: StreamOptions = {
 *   chunkSize: 32768,
 *   encoding: 'utf8',
 *   highWaterMark: 16384
 * };
 * ```
 */
export interface StreamOptions {
  /** Chunk size for streaming */
  chunkSize?: number;
  /** Text encoding for streams */
  encoding?: BufferEncoding;
  /** High water mark for stream buffer */
  highWaterMark?: number;
  /** Enable object mode for streams */
  objectMode?: boolean;
}