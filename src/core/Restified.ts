import { GivenStep } from './dsl/given.core';
import { VariableStore } from './stores/variable.core';
import { ResponseStore } from './stores/response.core';
import { ConfigManager } from './config/config.core';
import { BearerAuth } from './auth/bearer.auth';
import { BasicAuth } from './auth/basic.auth';
import { ApiKeyAuth } from './auth/apikey.auth';
import { OAuth2Auth } from './auth/oauth2.auth';
import { GraphQLClient, GraphQLClientConfig } from './clients/GraphQLClient';
import { WebSocketClient, WebSocketClientConfig } from './clients/WebSocketClient';
import { DatabaseManager } from './database/DatabaseManager';
import { DatabaseConfig } from './database/DatabaseClient';
import { UtilityManager } from './utils/UtilityManager';
import { CustomUtilityPlugin, UtilityResult } from './utils/UtilityTypes';
import { gracefulConfigManager } from './config/GracefulConfigManager';
import { globalConnectionManager, ConnectionStats } from './network/ConnectionManager';
import { globalRetryManager } from './network/RetryManager';
import { globalCircuitBreakerManager, CircuitBreakerStats, CircuitBreakerMetrics } from './network/CircuitBreakerManager';
import { globalTimeoutManager, TimeoutStats, TimeoutMetrics, TimeoutRecommendation } from './network/TimeoutManager';
import { ErrorRecoveryManager } from './network/ErrorRecoveryManager';
import { AdvancedPerformanceManager, PerformanceMetrics } from './performance/AdvancedPerformanceManager';
import RestifiedHtmlReporter = require('../reporting/restified-html-reporter');
import { RestifiedConfig, RequestConfig, HttpResponse, AssertionResult, AuthConfig } from '../RestifiedTypes';
import { externalAssertionCapture, ExternalAssertionResult } from './assertion/ExternalAssertionCapture';

export class Restified {
  private variableStore: VariableStore;
  private responseStore: ResponseStore;
  private configManager: ConfigManager;
  private config: RestifiedConfig;
  private requestDetails: any = null;
  private clientConfigs: Map<string, RequestConfig> = new Map();
  private graphqlClients: Map<string, GraphQLClient> = new Map();
  private websocketClients: Map<string, WebSocketClient> = new Map();
  private databaseManager: DatabaseManager;
  private utilityManager: UtilityManager;

  constructor(config: RestifiedConfig = {}) {
    this.configManager = ConfigManager.getInstance();
    this.config = { ...this.configManager.getConfig(), ...config };
    this.variableStore = new VariableStore();
    this.responseStore = new ResponseStore();
    this.databaseManager = new DatabaseManager(this.variableStore);
    
    // Initialize utility manager
    this.utilityManager = UtilityManager.create({
      variableStore: this.variableStore,
      currentRequest: null,
      currentResponse: null,
      globalConfig: this.config
    });
    
    // Connect utility manager to variable store for enhanced resolution
    this.variableStore.setUtilityManager(this.utilityManager);
    
    this.initializeClients();
    this.loadConfigVariables();
    this.configureReporting();
  }

  /**
   * Starts a new API test request configuration using RestifiedTS fluent DSL
   * @returns {GivenStep} GivenStep instance for chaining request setup methods
   * @example
   * ```typescript
   * const response = await restified
   *   .given()
   *     .baseURL('https://api.example.com')
   *     .header('Content-Type', 'application/json')
   *     .bearerToken('eyJhbGciOiJIUzI1NiJ9...')
   *   .when()
   *     .get('/users')
   *     .execute();
   * ```
   * @example
   * ```typescript
   * // With authentication and variables
   * await restified
   *   .given()
   *     .useClient('api')
   *     .variable('userId', 123)
   *     .header('X-Test-ID', '{{$util.random.uuid()}}')
   *   .when()
   *     .post('/users/{{userId}}/profile')
   *     .body({ name: 'John Doe' })
   *     .execute();
   * ```
   */
  given(): GivenStep {
    return new GivenStep(this);
  }

  // Variable management methods
  
  /**
   * Sets a global variable that can be used across all tests and requests
   * @param {string} name - Variable name (can be referenced as {{variableName}})
   * @param {any} value - Variable value (string, number, object, array, etc.)
   * @example
   * ```typescript
   * restified.setGlobalVariable('authToken', 'Bearer eyJhbGciOiJIUzI1NiJ9...');
   * restified.setGlobalVariable('baseUrl', 'https://api.staging.example.com');
   * restified.setGlobalVariable('testUser', { id: 123, email: 'test@example.com' });
   * 
   * // Use in requests
   * restified.given()
   *   .baseURL('{{baseUrl}}')
   *   .header('Authorization', '{{authToken}}')
   *   .when().get('/users/{{testUser.id}}');
   * ```
   */
  setGlobalVariable(name: string, value: any): void {
    this.variableStore.setGlobalVariable(name, value);
  }

  /**
   * Retrieves a global variable value
   * @param {string} name - Variable name to retrieve
   * @returns {any} Variable value or undefined if not found
   * @example
   * ```typescript
   * const token = restified.getGlobalVariable('authToken');
   * const userId = restified.getGlobalVariable('currentUserId');
   * 
   * // Check if variable exists
   * if (restified.getGlobalVariable('sessionId')) {
   *   // Variable exists
   * }
   * ```
   */
  getGlobalVariable(name: string): any {
    return this.variableStore.getGlobalVariable(name);
  }

  setGlobalVariables(variables: Record<string, any>): void {
    this.variableStore.setGlobalVariables(variables);
  }

  getGlobalVariables(): Record<string, any> {
    return this.variableStore.getGlobalVariables();
  }

  setLocalVariable(name: string, value: any): void {
    this.variableStore.setLocalVariable(name, value);
  }

  getLocalVariable(name: string): any {
    return this.variableStore.getLocalVariable(name);
  }

  setLocalVariables(variables: Record<string, any>): void {
    this.variableStore.setLocalVariables(variables);
  }

  getLocalVariables(): Record<string, any> {
    return this.variableStore.getLocalVariables();
  }

  setVariable(name: string, value: any): void {
    this.variableStore.setExtractedVariable(name, value);
  }

  getVariable(name: string): any {
    return this.variableStore.getVariable(name);
  }

  hasVariable(name: string): boolean {
    return this.variableStore.hasVariable(name);
  }

  clearLocalVariables(): void {
    this.variableStore.clearLocalVariables();
  }

  // Authentication helper methods
  createBearerAuth(token: string): BearerAuth {
    return BearerAuth.create(token);
  }

  createBasicAuth(username: string, password: string): BasicAuth {
    return BasicAuth.create(username, password);
  }

  createApiKeyAuth(apiKey: string, keyName?: string, location?: 'header' | 'query'): ApiKeyAuth {
    return ApiKeyAuth.create(apiKey, keyName, location);
  }

  createOAuth2Auth(clientId: string, clientSecret: string, tokenUrl: string, scope?: string): OAuth2Auth {
    return OAuth2Auth.create(clientId, clientSecret, tokenUrl, scope);
  }

  // Configuration methods
  getConfig(): RestifiedConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<RestifiedConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.configManager.updateConfig(newConfig);
    
    if (newConfig.clients) {
      this.initializeClients();
    }
    
    if (newConfig.variables) {
      this.loadConfigVariables();
    }
    
    if (newConfig.reporting) {
      this.configureReporting();
    }
  }

  loadConfigFromFile(configPath?: string): void {
    const loadedConfig = this.configManager.loadConfig(configPath);
    this.config = { ...this.config, ...loadedConfig };
    this.initializeClients();
    this.loadConfigVariables();
  }

  createClient(name: string, config: RequestConfig): void {
    this.clientConfigs.set(name, config);
  }

  getClientConfig(name: string): RequestConfig | undefined {
    return this.clientConfigs.get(name);
  }

  // Update headers for all clients
  updateAllClientsHeaders(headers: Record<string, string>): void {
    for (const [clientName, clientConfig] of this.clientConfigs.entries()) {
      const updatedConfig = {
        ...clientConfig,
        headers: {
          ...clientConfig.headers,
          ...headers
        }
      };
      this.clientConfigs.set(clientName, updatedConfig);
    }
  }

  // Update headers for a specific client
  updateClientHeaders(clientName: string, headers: Record<string, string>): void {
    const clientConfig = this.clientConfigs.get(clientName);
    if (clientConfig) {
      const updatedConfig = {
        ...clientConfig,
        headers: {
          ...clientConfig.headers,
          ...headers
        }
      };
      this.clientConfigs.set(clientName, updatedConfig);
    }
  }

  // Add auth token to all clients
  addAuthTokenToAllClients(token: string, headerName: string = 'Authorization'): void {
    const authHeader = headerName === 'Authorization' ? `Bearer ${token}` : token;
    this.updateAllClientsHeaders({ [headerName]: authHeader });
  }

  // Response management
  setResponse(response: HttpResponse): void {
    this.responseStore.setCurrentResponse(response);
  }

  getCurrentResponse(): HttpResponse | null {
    return this.responseStore.getCurrentResponse();
  }

  getLastResponse(): HttpResponse | null {
    return this.responseStore.getLastResponse();
  }

  storeResponse(key: string, response?: HttpResponse): void {
    const responseToStore = response || this.getCurrentResponse();
    if (responseToStore) {
      this.responseStore.storeResponse(key, responseToStore);
    }
  }

  getStoredResponse(key: string): HttpResponse | null {
    return this.responseStore.getStoredResponse(key);
  }

  getResponseHistory(): HttpResponse[] {
    return this.responseStore.getResponseHistory();
  }

  clearStoredResponses(): void {
    this.responseStore.clearStoredResponses();
  }

  clearResponseHistory(): void {
    this.responseStore.clearResponseHistory();
  }

  // Request details management (used internally by DSL)
  setRequestDetails(details: any): void {
    this.requestDetails = details;
  }

  getRequestDetails(): any {
    return this.requestDetails;
  }

  // Assertion management
  private assertions: AssertionResult[] = [];

  setAssertions(assertions: AssertionResult[]): void {
    this.assertions = assertions;
  }

  getAssertions(): AssertionResult[] {
    return [...this.assertions];
  }

  clearAssertions(): void {
    this.assertions = [];
  }

  // Lifecycle methods

  async reset(): Promise<void> {
    this.variableStore.reset();
    this.responseStore.clearAll();
    this.clearAssertions();
    this.requestDetails = null;
  }

  // Utility methods
  dumpState(): void {
    console.log('=== Restified State Dump ===');
    this.variableStore.dumpVariables();
    this.responseStore.dumpResponses();
    console.log('Current Assertions:', this.assertions.length);
    console.log('Client Configurations:', Array.from(this.clientConfigs.keys()));
    console.log('==============================');
  }

  private initializeClients(): void {
    if (this.config.clients) {
      Object.entries(this.config.clients).forEach(([name, config]) => {
        this.clientConfigs.set(name, config);
      });
    }
  }

  private loadConfigVariables(): void {
    if (this.config.variables) {
      this.variableStore.setGlobalVariables(this.config.variables);
    }
  }

  private configureReporting(): void {
    // Enhanced automatic reporter configuration for seamless integration
    const reportingConfig = this.config.reporting || {};
    
    // Auto-enable enhanced features if not explicitly configured
    const enhancedConfig = {
      title: 'RestifiedTS API Test Results',
      subtitle: 'Enterprise API Testing with Automatic Data Capture',
      enabled: true,
      filename: `restified-report-${new Date().toISOString().split('T')[0]}.html`,
      outputDir: 'restified-reports',
      includeRequestResponse: true,
      includeScreenshots: false,
      theme: {
        primaryColor: '#1e293b',
        secondaryColor: '#334155', 
        accentColor: '#007acc'
      },
      footer: {
        show: true,
        text: 'Generated by RestifiedTS Enterprise Test Framework',
        timestamp: true,
        version: 'v2.0.7'
      },
      ...reportingConfig
    };
    
    // Configure the enhanced reporter
    RestifiedHtmlReporter.configure(enhancedConfig);
    
    // Enable automatic data capture by default
    RestifiedHtmlReporter.enableDataCapture(true);
    
    // Auto-detect large report mode based on environment
    const expectedTestCount = process.env.EXPECTED_TEST_COUNT ? 
      parseInt(process.env.EXPECTED_TEST_COUNT) : 0;
    
    if (expectedTestCount > 5000 || process.env.LARGE_REPORT_MODE === 'true') {
      RestifiedHtmlReporter.setLargeReportMode(true);
      console.log('⚡ Automatically enabled large report mode for optimal performance');
    }
    
    console.log('✅ Enhanced HTML Reporter configured with automatic data capture');
  }

  // GraphQL client management
  createGraphQLClient(name: string, config: GraphQLClientConfig): GraphQLClient {
    const client = new GraphQLClient(config, this.variableStore);
    this.graphqlClients.set(name, client);
    return client;
  }

  getGraphQLClient(name: string): GraphQLClient {
    const client = this.graphqlClients.get(name);
    if (!client) {
      gracefulConfigManager.addWarning(`GraphQL client '${name}' not found. Returning fallback client.`);
      return gracefulConfigManager.getClientFallback(name, 'graphql') as GraphQLClient;
    }
    return client;
  }

  // WebSocket client management
  createWebSocketClient(name: string, config: WebSocketClientConfig): WebSocketClient {
    const client = new WebSocketClient(config, this.variableStore);
    this.websocketClients.set(name, client);
    return client;
  }

  getWebSocketClient(name: string): WebSocketClient {
    const client = this.websocketClients.get(name);
    if (!client) {
      gracefulConfigManager.addWarning(`WebSocket client '${name}' not found. Returning fallback client.`);
      return gracefulConfigManager.getClientFallback(name, 'websocket') as WebSocketClient;
    }
    return client;
  }

  async connectWebSocket(name: string): Promise<void> {
    const client = this.getWebSocketClient(name);
    await client.connect();
  }

  async disconnectWebSocket(name: string): Promise<void> {
    const client = this.getWebSocketClient(name);
    await client.disconnect();
  }

  // Database client management
  async createDatabaseClient(name: string, config: DatabaseConfig): Promise<void> {
    try {
      await this.databaseManager.createClient(name, config);
    } catch (error: any) {
      if (error.message.includes('requires') && error.message.includes('package')) {
        // Package missing - handle gracefully
        gracefulConfigManager.addWarning(`Database client '${name}' could not be created: ${error.message}`);
        gracefulConfigManager.addWarning(`Continuing without ${config.type} database support.`);
      } else {
        // Other errors (connection issues, etc.) - still handle gracefully
        gracefulConfigManager.addWarning(`Database client '${name}' failed to connect: ${error.message}`);
        gracefulConfigManager.addWarning(`Tests using this database will be skipped.`);
      }
    }
  }

  getDatabaseClient(name: string) {
    try {
      return this.databaseManager.getClient(name);
    } catch (error: any) {
      gracefulConfigManager.addWarning(`Database client '${name}' not found. Returning fallback client.`);
      return gracefulConfigManager.getClientFallback(name, 'database');
    }
  }

  async disconnectAllDatabases(): Promise<void> {
    await this.databaseManager.disconnectAll();
  }

  async validateDatabaseState(validations: Array<{
    client: string;
    table?: string;
    collection?: string;
    conditions?: Record<string, any>;
    expectedCount?: number | { min?: number; max?: number };
    customQuery?: string;
    expectedResult?: any;
    timeout?: number;
  }>): Promise<{ success: boolean; results: any[] }> {
    return this.databaseManager.validateDatabaseState(validations);
  }

  async setupDatabaseState(operations: Array<{
    client: string;
    action: 'insert' | 'update' | 'delete' | 'execute' | 'bulk';
    table?: string;
    collection?: string;
    data?: any[] | any;
    conditions?: Record<string, any>;
    sql?: string;
    parameters?: any[];
  }>): Promise<void> {
    return this.databaseManager.setupDatabaseState(operations);
  }

  async cleanupDatabaseState(operations: Array<{
    client: string;
    action: 'delete' | 'truncate' | 'execute';
    table?: string;
    collection?: string;
    conditions?: Record<string, any>;
    sql?: string;
    parameters?: any[];
  }>): Promise<void> {
    return this.databaseManager.cleanupDatabaseState(operations);
  }

  getClient(name: string) {
    return this.databaseManager.getClient(name);
  }

  hasClient(name: string): boolean {
    return this.databaseManager.hasClient(name);
  }

  getClientNames(): string[] {
    return this.databaseManager.getClientNames();
  }

  async databaseHealthCheck(): Promise<Record<string, any>> {
    return this.databaseManager.healthCheckAll();
  }

  async getDatabaseStats(): Promise<Record<string, any>> {
    return this.databaseManager.getStats();
  }

  // JSON Fixture and Variable Resolution Methods
  loadJsonFixture(fixturePath: string): any {
    return this.variableStore.loadJsonFixture(fixturePath);
  }

  resolveJsonString(jsonString: string): any {
    return this.variableStore.resolveJsonString(jsonString);
  }

  resolveVariables(data: any): any {
    return this.variableStore.resolveVariables(data);
  }

  // Utility system access methods
  
  /**
   * Executes a utility function synchronously (130+ built-in functions available)
   * @param {string} functionPath - Utility function path (e.g., 'string.toUpperCase', 'date.now', 'random.uuid')
   * @param {...any} args - Arguments to pass to the utility function
   * @returns {UtilityResult} Result containing success status, value, and metadata
   * @example
   * ```typescript
   * // String utilities
   * const upperName = restified.utility('string.toUpperCase', 'john doe'); // 'JOHN DOE'
   * const slug = restified.utility('string.slugify', 'Hello World!'); // 'hello-world'
   * 
   * // Date utilities  
   * const now = restified.utility('date.now', 'ISO'); // '2023-12-01T10:30:00.000Z'
   * const futureDate = restified.utility('date.addDays', '2023-12-01', 7, 'YYYY-MM-DD');
   * 
   * // Random utilities
   * const uuid = restified.utility('random.uuid'); // '550e8400-e29b-41d4-a716-446655440000'
   * const randomNum = restified.utility('random.number', 1, 100); // Random number 1-100
   * 
   * // Crypto utilities
   * const hash = restified.utility('crypto.sha256', 'password123');
   * const jwt = restified.utility('crypto.generateJWT', { userId: 123 }, 'secret');
   * ```
   */
  utility(functionPath: string, ...args: any[]): UtilityResult {
    this.utilityManager.updateContext({
      currentRequest: this.requestDetails,
      currentResponse: this.getCurrentResponse()
    });
    return this.utilityManager.execute(functionPath, ...args);
  }

  /**
   * Executes a utility function asynchronously (for async operations like file I/O)
   * @param {string} functionPath - Utility function path (e.g., 'file.read', 'network.fetch')
   * @param {...any} args - Arguments to pass to the utility function
   * @returns {Promise<UtilityResult>} Promise resolving to result with success status and value
   * @example
   * ```typescript
   * // File utilities (async)
   * const fileContent = await restified.utilityAsync('file.read', './test-data.json');
   * await restified.utilityAsync('file.write', './output.txt', 'Test content');
   * 
   * // Network utilities (async)
   * const response = await restified.utilityAsync('network.fetch', 'https://api.example.com/health');
   * const isOnline = await restified.utilityAsync('network.ping', 'google.com');
   * 
   * // Data processing (async)
   * const processed = await restified.utilityAsync('data.processLarge', largeDataset);
   * ```
   */
  async utilityAsync(functionPath: string, ...args: any[]): Promise<UtilityResult> {
    this.utilityManager.updateContext({
      currentRequest: this.requestDetails,
      currentResponse: this.getCurrentResponse()
    });
    return this.utilityManager.executeAsync(functionPath, ...args);
  }

  // Category-specific utility access
  stringUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`string.${functionName}`, ...args);
  }

  dateUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`date.${functionName}`, ...args);
  }

  mathUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`math.${functionName}`, ...args);
  }

  randomUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`random.${functionName}`, ...args);
  }

  validationUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`validation.${functionName}`, ...args);
  }

  dataUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`data.${functionName}`, ...args);
  }

  cryptoUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`crypto.${functionName}`, ...args);
  }

  securityUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`security.${functionName}`, ...args);
  }

  async fileUtil(functionName: string, ...args: any[]): Promise<UtilityResult> {
    return this.utilityAsync(`file.${functionName}`, ...args);
  }

  encodingUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`encoding.${functionName}`, ...args);
  }

  networkUtil(functionName: string, ...args: any[]): UtilityResult {
    return this.utility(`network.${functionName}`, ...args);
  }

  // Utility management methods
  
  registerUtilityPlugin(plugin: CustomUtilityPlugin): void {
    this.utilityManager.registerPlugin(plugin);
  }

  unregisterUtilityPlugin(pluginName: string): void {
    this.utilityManager.unregisterPlugin(pluginName);
  }

  registerCustomUtility(category: string, name: string, execute: (...args: any[]) => any, options?: {
    description?: string;
    parameters?: Array<{ name: string; type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'; required: boolean; description: string }>;
    isAsync?: boolean;
  }): void {
    this.utilityManager.registerFunction(category, name, execute, options);
  }

  listUtilityCategories(): string[] {
    return this.utilityManager.listCategories();
  }

  listUtilityFunctions(category?: string): Record<string, string[]> | string[] {
    return this.utilityManager.listFunctions(category);
  }

  getUtilityDocumentation(category: string, functionName?: string): any {
    return this.utilityManager.getFunctionDocumentation(category, functionName);
  }

  executeUtilityBatch(operations: Array<{ function: string; args: any[] }>): Array<UtilityResult> {
    return this.utilityManager.executeBatch(operations);
  }

  async executeUtilityBatchAsync(operations: Array<{ function: string; args: any[] }>): Promise<Array<UtilityResult>> {
    return this.utilityManager.executeBatchAsync(operations);
  }

  executeUtilityPipeline(input: any, operations: Array<{ function: string; args?: any[] }>): UtilityResult {
    return this.utilityManager.executePipeline(input, operations);
  }

  async executeUtilityPipelineAsync(input: any, operations: Array<{ function: string; args?: any[] }>): Promise<UtilityResult> {
    return this.utilityManager.executePipelineAsync(input, operations);
  }

  executeUtilityIf(condition: boolean | (() => boolean), functionPath: string, ...args: any[]): UtilityResult | null {
    return this.utilityManager.executeIf(condition, functionPath, ...args);
  }

  executeUtilitySafe(functionPath: string, fallbackValue: any, ...args: any[]): any {
    return this.utilityManager.executeSafe(functionPath, fallbackValue, ...args);
  }

  getUtilityPerformanceMetrics(): any {
    return this.utilityManager.getPerformanceMetrics();
  }

  utilityHealthCheck(): { status: 'healthy' | 'degraded' | 'unhealthy'; issues: string[]; metrics: any } {
    return this.utilityManager.healthCheck();
  }

  clearUtilityCache(): void {
    this.utilityManager.clearCache();
  }

  clearUtilityExecutionLog(): void {
    this.utilityManager.clearExecutionLog();
  }

  exportUtilityConfiguration(): any {
    return this.utilityManager.exportConfiguration();
  }

  // Configuration health check
  printConfigurationHealthReport(): void {
    gracefulConfigManager.printHealthReport();
  }

  getConfigurationWarnings(): string[] {
    return gracefulConfigManager.getWarnings();
  }

  getMissingFeatures(): string[] {
    return gracefulConfigManager.getMissingFeatures();
  }

  /**
   * Sleep/wait utility - can be used anywhere in test flow
   * @param {number} ms - Milliseconds to sleep (e.g., 1000 = 1 second)
   * @returns {Promise<void>} Promise that resolves after the delay
   * @example
   * ```typescript
   * // Between when and then
   * const response = await restified.given()
   *   .baseURL('https://api.example.com')
   * .when()
   *   .get('/users')
   *   .execute();
   * 
   * await restified.sleep(2000);  // Wait 2 seconds
   * 
   * response.then()
   *   .statusCode(200);
   * 
   * // Between multiple requests
   * await restified.given().when().get('/first').execute();
   * await restified.sleep(5000);  // Wait 5 seconds between requests
   * await restified.given().when().get('/second').execute();
   * ```
   */
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Alias for sleep() method
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>} Promise that resolves after the delay
   */
  async wait(ms: number): Promise<void> {
    return this.sleep(ms);
  }

  /**
   * Get HTTP connection pool statistics for performance monitoring
   * @returns {ConnectionStats} Connection pool statistics
   * @example
   * ```typescript
   * const stats = restified.getConnectionStats();
   * console.log(`Cache hit ratio: ${stats.cacheHitRatio}%`);
   * console.log(`Active connections: ${stats.activeConnections}`);
   * ```
   */
  getConnectionStats(): ConnectionStats {
    return globalConnectionManager.getStats();
  }

  /**
   * Get connection pool performance metrics
   * @returns Performance metrics including cache hit ratio and HTTP/2 usage
   */
  getConnectionMetrics(): {
    cacheHitRatio: number;
    averageConnectionReuse: number;
    http2Usage: number;
    poolEfficiency: number;
  } {
    return globalConnectionManager.getPerformanceMetrics();
  }

  /**
   * Reset connection pool statistics
   */
  resetConnectionStats(): void {
    globalConnectionManager.resetStats();
  }

  /**
   * Get retry statistics for reliability monitoring
   * @returns Retry statistics including attempts, success rates, and error analysis
   * @example
   * ```typescript
   * const retryStats = restified.getRetryStats();
   * console.log(`Retry rate: ${retryStats.retriedRequests / retryStats.totalRequests * 100}%`);
   * console.log(`Success after retry: ${retryStats.successAfterRetry}`);
   * ```
   */
  getRetryStats() {
    return globalRetryManager.getStats();
  }

  /**
   * Get retry performance metrics and analysis
   * @returns Retry metrics with recommendations
   */
  getRetryMetrics() {
    return globalRetryManager.getMetrics();
  }

  /**
   * Get retry recommendations based on current statistics
   * @returns Array of actionable recommendations
   */
  getRetryRecommendations(): string[] {
    return globalRetryManager.getRecommendations();
  }

  /**
   * Reset retry statistics
   */
  resetRetryStats(): void {
    globalRetryManager.resetStats();
  }

  /**
   * Get circuit breaker statistics for all circuits or a specific circuit
   * @param {string} [circuitId] - Optional circuit ID to get specific stats
   * @returns {Map<string, CircuitBreakerStats> | CircuitBreakerStats | null} Circuit breaker statistics
   * @example
   * ```typescript
   * const allStats = restified.getCircuitBreakerStats();
   * const apiStats = restified.getCircuitBreakerStats('GET:https://api.example.com');
   * console.log(`Circuit state: ${apiStats?.state}`);
   * console.log(`Failure rate: ${apiStats ? (apiStats.failureCount / apiStats.totalRequests * 100) : 0}%`);
   * ```
   */
  getCircuitBreakerStats(circuitId?: string): Map<string, CircuitBreakerStats> | CircuitBreakerStats | null {
    return globalCircuitBreakerManager.getStats(circuitId);
  }

  /**
   * Get circuit breaker metrics with calculated performance indicators
   * @param {string} circuitId - Circuit ID to get metrics for
   * @returns {CircuitBreakerMetrics | null} Circuit breaker metrics or null if not found
   * @example
   * ```typescript
   * const metrics = restified.getCircuitBreakerMetrics('GET:https://api.example.com');
   * if (metrics) {
   *   console.log(`Availability: ${metrics.availabilityPercentage.toFixed(2)}%`);
   *   console.log(`P95 Response Time: ${metrics.responseTimeP95}ms`);
   *   console.log(`Mean Time to Recovery: ${metrics.meanTimeToRecovery}ms`);
   * }
   * ```
   */
  getCircuitBreakerMetrics(circuitId: string): CircuitBreakerMetrics | null {
    return globalCircuitBreakerManager.getMetrics(circuitId);
  }

  /**
   * Reset circuit breaker statistics for all circuits or a specific circuit
   * @param {string} [circuitId] - Optional circuit ID to reset specific circuit
   * @example
   * ```typescript
   * restified.resetCircuitBreakerStats(); // Reset all circuits
   * restified.resetCircuitBreakerStats('GET:https://api.example.com'); // Reset specific circuit
   * ```
   */
  resetCircuitBreakerStats(circuitId?: string): void {
    globalCircuitBreakerManager.resetStats(circuitId);
  }

  /**
   * Force open a circuit breaker (for testing or maintenance)
   * @param {string} circuitId - Circuit ID to force open
   * @example
   * ```typescript
   * restified.forceOpenCircuit('GET:https://api.example.com');
   * ```
   */
  forceOpenCircuit(circuitId: string): void {
    globalCircuitBreakerManager.forceOpen(circuitId);
  }

  /**
   * Force close a circuit breaker (for emergency recovery)
   * @param {string} circuitId - Circuit ID to force close
   * @example
   * ```typescript
   * restified.forceCloseCircuit('GET:https://api.example.com');
   * ```
   */
  forceCloseCircuit(circuitId: string): void {
    globalCircuitBreakerManager.forceClose(circuitId);
  }

  /**
   * Get current state of a circuit breaker
   * @param {string} circuitId - Circuit ID to check
   * @returns {'CLOSED' | 'OPEN' | 'HALF_OPEN'} Current circuit state
   * @example
   * ```typescript
   * const state = restified.getCircuitState('GET:https://api.example.com');
   * console.log(`Circuit is currently: ${state}`);
   * ```
   */
  getCircuitState(circuitId: string): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return globalCircuitBreakerManager.getCurrentState(circuitId);
  }

  /**
   * Get all circuit IDs being tracked
   * @returns {string[]} Array of circuit IDs
   * @example
   * ```typescript
   * const circuits = restified.getAllCircuitIds();
   * circuits.forEach(id => {
   *   console.log(`Circuit: ${id}, State: ${restified.getCircuitState(id)}`);
   * });
   * ```
   */
  getAllCircuitIds(): string[] {
    return globalCircuitBreakerManager.getAllCircuitIds();
  }

  /**
   * Get timeout statistics for all endpoints or a specific endpoint
   * @param {string} [endpointId] - Optional endpoint ID to get specific stats
   * @returns {Map<string, TimeoutStats> | TimeoutStats | null} Timeout statistics
   * @example
   * ```typescript
   * const allStats = restified.getTimeoutStats();
   * const apiStats = restified.getTimeoutStats('GET:https://api.example.com/users');
   * if (apiStats) {
   *   console.log(`Average response time: ${apiStats.averageResponseTime}ms`);
   *   console.log(`P95 response time: ${apiStats.p95ResponseTime}ms`);
   *   console.log(`Timeout rate: ${apiStats.timeoutRate}%`);
   * }
   * ```
   */
  getTimeoutStats(endpointId?: string): Map<string, TimeoutStats> | TimeoutStats | null {
    return globalTimeoutManager.getTimeoutStats(endpointId);
  }

  /**
   * Get timeout metrics with performance analysis for a specific endpoint
   * @param {string} endpointId - Endpoint ID to get metrics for
   * @returns {TimeoutMetrics | null} Timeout metrics or null if not found
   * @example
   * ```typescript
   * const metrics = restified.getTimeoutMetrics('GET:https://api.example.com/search');
   * if (metrics) {
   *   console.log(`Current timeout: ${metrics.currentTimeout}ms`);
   *   console.log(`Recommended timeout: ${metrics.recommendedTimeout}ms`);
   *   console.log(`Performance trend: ${metrics.performanceTrend}`);
   *   console.log(`Confidence level: ${(metrics.confidenceLevel * 100).toFixed(1)}%`);
   * }
   * ```
   */
  getTimeoutMetrics(endpointId: string): TimeoutMetrics | null {
    return globalTimeoutManager.getTimeoutMetrics(endpointId);
  }

  /**
   * Get intelligent timeout recommendations for all endpoints
   * @returns {TimeoutRecommendation[]} Array of timeout recommendations
   * @example
   * ```typescript
   * const recommendations = restified.getTimeoutRecommendations();
   * recommendations.forEach(rec => {
   *   console.log(`${rec.endpointId}: ${rec.action} timeout to ${rec.recommendedTimeout}ms`);
   *   console.log(`Reason: ${rec.reason}`);
   *   console.log(`Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
   *   console.log(`Impact: ${rec.impact}`);
   * });
   * ```
   */
  getTimeoutRecommendations(): TimeoutRecommendation[] {
    return globalTimeoutManager.getTimeoutRecommendations();
  }

  /**
   * Reset timeout statistics for all endpoints or a specific endpoint
   * @param {string} [endpointId] - Optional endpoint ID to reset specific endpoint
   * @example
   * ```typescript
   * restified.resetTimeoutStats(); // Reset all endpoints
   * restified.resetTimeoutStats('GET:https://api.example.com/users'); // Reset specific endpoint
   * ```
   */
  resetTimeoutStats(endpointId?: string): void {
    globalTimeoutManager.resetStats(endpointId);
  }

  /**
   * Set custom timeout for a specific endpoint (overrides intelligent timeout)
   * @param {string} method - HTTP method
   * @param {string} url - Endpoint URL
   * @param {number} timeout - Timeout in milliseconds
   * @example
   * ```typescript
   * restified.setTimeoutForEndpoint('POST', '/upload', 120000); // 2 minutes for uploads
   * restified.setTimeoutForEndpoint('GET', '/analytics', 60000);  // 1 minute for analytics
   * ```
   */
  setTimeoutForEndpoint(method: string, url: string, timeout: number): void {
    globalTimeoutManager.setTimeoutForEndpoint(method, url, timeout);
  }

  /**
   * Get current effective timeout for an endpoint
   * @param {string} method - HTTP method
   * @param {string} url - Endpoint URL
   * @returns {number | null} Current timeout in milliseconds or null if not set
   * @example
   * ```typescript
   * const timeout = restified.getCurrentTimeout('GET', '/users');
   * console.log(`Current timeout for GET /users: ${timeout}ms`);
   * ```
   */
  getCurrentTimeout(method: string, url: string): number | null {
    return globalTimeoutManager.getCurrentTimeout(method, url);
  }

  /**
   * Get all tracked endpoint IDs for timeout intelligence
   * @returns {string[]} Array of endpoint IDs
   * @example
   * ```typescript
   * const endpoints = restified.getAllTimeoutEndpoints();
   * endpoints.forEach(endpointId => {
   *   const metrics = restified.getTimeoutMetrics(endpointId);
   *   console.log(`${endpointId}: ${metrics?.currentTimeout}ms`);
   * });
   * ```
   */
  getAllTimeoutEndpoints(): string[] {
    return globalTimeoutManager.getAllEndpointIds();
  }

  // ================================
  // Error Recovery Management
  // ================================

  /**
   * Create an error recovery manager with custom configuration
   * @param {Partial<import('../RestifiedTypes').ErrorRecoveryConfig>} config - Error recovery configuration
   * @returns {ErrorRecoveryManager} New error recovery manager instance
   * @example
   * ```typescript
   * const errorRecovery = restified.createErrorRecoveryManager({
   *   enabled: true,
   *   enableFallbacks: true,
   *   enableCaching: true,
   *   maxFallbackAttempts: 3,
   *   fallbackStrategies: ['cache', 'default', 'synthetic']
   * });
   * ```
   */
  createErrorRecoveryManager(config?: Partial<import('../RestifiedTypes').ErrorRecoveryConfig>): ErrorRecoveryManager {
    return new ErrorRecoveryManager(config);
  }

  /**
   * Create an advanced performance manager with custom configuration
   * @param {Partial<import('../RestifiedTypes').AdvancedPerformanceConfig>} config - Advanced performance configuration
   * @returns {AdvancedPerformanceManager} New advanced performance manager instance
   * @example
   * ```typescript
   * const performanceManager = restified.createAdvancedPerformanceManager({
   *   enabled: true,
   *   deduplication: { enabled: true, maxWaitTime: 30000 },
   *   caching: { enabled: true, maxCacheSize: 1000, defaultTtl: 300000 },
   *   batching: { enabled: true, maxBatchSize: 10, batchTimeout: 100 },
   *   streaming: { enabled: true, chunkSize: 65536 }
   * });
   * ```
   */
  createAdvancedPerformanceManager(config?: Partial<import('../RestifiedTypes').AdvancedPerformanceConfig>): AdvancedPerformanceManager {
    return new AdvancedPerformanceManager(config);
  }

  /**
   * Get performance metrics from the global advanced performance manager
   * @returns {PerformanceMetrics | null} Performance metrics or null if not available
   * @example
   * ```typescript
   * const metrics = restified.getPerformanceMetrics();
   * if (metrics) {
   *   console.log(`Cache hit rate: ${(metrics.caching.hitRate * 100).toFixed(1)}%`);
   *   console.log(`Deduplication rate: ${(metrics.deduplication.deduplicationRate * 100).toFixed(1)}%`);
   *   console.log(`Total batches: ${metrics.batching.totalBatches}`);
   *   console.log(`Streams processed: ${metrics.streaming.totalStreams}`);
   * }
   * ```
   */
  getPerformanceMetrics(): PerformanceMetrics | null {
    try {
      const { globalAdvancedPerformanceManager } = require('./performance/AdvancedPerformanceManager');
      return globalAdvancedPerformanceManager.getPerformanceMetrics();
    } catch {
      return null;
    }
  }

  /**
   * Clear all performance caches and reset metrics
   * @example
   * ```typescript
   * restified.clearPerformanceCaches();
   * console.log('All performance caches cleared and metrics reset');
   * ```
   */
  clearPerformanceCaches(): void {
    try {
      const { globalAdvancedPerformanceManager } = require('./performance/AdvancedPerformanceManager');
      globalAdvancedPerformanceManager.clearCaches();
    } catch (error) {
      console.warn('Failed to clear performance caches:', error);
    }
  }

  /**
   * Add custom endpoint pattern for intelligent timeout assignment
   * @param {import('../RestifiedTypes').EndpointPattern} pattern - Endpoint pattern configuration
   * @example
   * ```typescript
   * restified.addTimeoutPattern({
   *   name: 'ml-inference',
   *   pattern: /\/ml\/predict|\/ai\/inference/i,
   *   methods: ['POST'],
   *   baseTimeout: 45000,
   *   multiplier: 3.0,
   *   description: 'Machine learning inference endpoints'
   * });
   * ```
   */
  addTimeoutPattern(pattern: import('../RestifiedTypes').EndpointPattern): void {
    globalTimeoutManager.addEndpointPattern(pattern);
  }

  // ================================
  // External Assertion Capture 
  // ================================

  /**
   * Start capturing external expect() assertions from test frameworks like Playwright, Cypress, Jest
   * @param {string} [testId] - Optional test identifier
   * @example
   * ```typescript
   * restified.startExternalAssertionCapture('my-test-1');
   * 
   * // These assertions will be captured in RestifiedTS reports
   * expect(response.data.length).toBeGreaterThan(0);
   * expect(response.data[0]).toHaveProperty('name');
   * 
   * const captured = restified.stopExternalAssertionCapture();
   * ```
   */
  startExternalAssertionCapture(testId?: string): void {
    externalAssertionCapture.startCapturing(testId);
  }

  /**
   * Stop capturing external assertions and return captured results
   * @returns {ExternalAssertionResult[]} Array of captured assertions
   * @example
   * ```typescript
   * restified.startExternalAssertionCapture();
   * 
   * expect(response.status).toBe(200);
   * expect(response.data).toBeDefined();
   * 
   * const captured = restified.stopExternalAssertionCapture();
   * console.log(`Captured ${captured.length} external assertions`);
   * ```
   */
  stopExternalAssertionCapture(): ExternalAssertionResult[] {
    return externalAssertionCapture.stopCapturing();
  }

  /**
   * Add a manual external assertion for custom frameworks
   * @param {Partial<ExternalAssertionResult>} assertion - Assertion details
   * @example
   * ```typescript
   * restified.addExternalAssertion({
   *   type: 'custom',
   *   framework: 'custom',
   *   passed: response.data.length > 0,
   *   message: 'Response should have data items',
   *   expected: '> 0 items',
   *   actual: response.data.length
   * });
   * ```
   */
  addExternalAssertion(assertion: Partial<ExternalAssertionResult>): void {
    externalAssertionCapture.addAssertion(assertion);
  }

  /**
   * Get all currently captured external assertions
   * @returns {ExternalAssertionResult[]} Array of captured external assertions
   */
  getCapturedExternalAssertions(): ExternalAssertionResult[] {
    return externalAssertionCapture.getCapturedAssertions();
  }

  /**
   * Get statistics about captured external assertions
   * @returns {object} Statistics including total, passed, failed, and breakdown by framework
   * @example
   * ```typescript
   * const stats = restified.getExternalAssertionStats();
   * console.log(`Total: ${stats.total}, Passed: ${stats.passed}, Failed: ${stats.failed}`);
   * console.log('By framework:', stats.byFramework);
   * ```
   */
  getExternalAssertionStats(): {
    total: number;
    passed: number;
    failed: number;
    byFramework: Record<string, number>;
    byType: Record<string, number>;
  } {
    return externalAssertionCapture.getStats();
  }

  /**
   * Clear all captured external assertions
   */
  clearExternalAssertions(): void {
    externalAssertionCapture.clear();
  }

  /**
   * Execute a callback function while capturing external assertions
   * @param {Function} callback - Function containing external assertions to capture
   * @param {string} [testId] - Optional test identifier  
   * @returns {Promise<ExternalAssertionResult[]>} Promise resolving to captured assertions
   * @example
   * ```typescript
   * const response = await restified.given().when().get('/api/users').execute();
   * 
   * const captured = await restified.withExternalAssertions(async () => {
   *   expect(response.data.length).toBeGreaterThan(0);
   *   expect(response.data[0]).toHaveProperty('name');
   *   expect(response.data[0].name).toBeTruthy();
   * }, 'user-validation-test');
   * 
   * console.log(`Captured ${captured.length} assertions`);
   * ```
   */
  async withExternalAssertions(
    callback: () => Promise<void> | void, 
    testId?: string
  ): Promise<ExternalAssertionResult[]> {
    this.startExternalAssertionCapture(testId);
    try {
      await callback();
    } finally {
      return this.stopExternalAssertionCapture();
    }
  }

  // Enhanced cleanup method
  async cleanup(): Promise<void> {
    // Disconnect WebSocket clients
    const wsDisconnectPromises = Array.from(this.websocketClients.values()).map(client =>
      client.disconnect().catch(error => console.warn('WebSocket disconnect failed:', error))
    );
    await Promise.all(wsDisconnectPromises);

    // Disconnect database clients
    await this.databaseManager.disconnectAll().catch(error => 
      console.warn('Database disconnect failed:', error)
    );

    // Execute global teardown if configured
    if (this.config.hooks?.globalTeardown) {
      await this.config.hooks.globalTeardown();
    }

    // Dump variables for debugging
    this.variableStore.dumpVariables();

    // Print configuration health report if there are warnings
    if (gracefulConfigManager.getWarnings().length > 0) {
      gracefulConfigManager.printHealthReport();
    }

    // Clear local state
    this.clearLocalVariables();
    this.clearAssertions();
    this.requestDetails = null;
    this.graphqlClients.clear();
    this.websocketClients.clear();
  }

  // Static factory method
  static create(config?: RestifiedConfig): Restified {
    return new Restified(config);
  }
}

// Create default instance for convenience
export const restified = Restified.create();

// Re-export supporting classes and types for direct access
export { VariableStore } from './stores/variable.core';
export { ResponseStore } from './stores/response.core';
export { ConfigManager } from './config/config.core';
export { BearerAuth } from './auth/bearer.auth';
export { BasicAuth } from './auth/basic.auth';
export { ApiKeyAuth } from './auth/apikey.auth';
export { OAuth2Auth } from './auth/oauth2.auth';
export { GivenStep } from './dsl/given.core';
export { WhenStep } from './dsl/when.core';
export { ThenStep } from './dsl/then.core';
export { GraphQLClient } from './clients/GraphQLClient';
export { WebSocketClient } from './clients/WebSocketClient';
export { DatabaseManager } from './database/DatabaseManager';
export { DatabaseClient } from './database/DatabaseClient';
export { PostgreSQLClient } from './database/PostgreSQLClient';
export { MongoDBClient } from './database/MongoDBClient';

// Re-export types
export type {
  RestifiedConfig,
  RequestConfig,
  HttpResponse,
  AuthConfig,
  AssertionResult,
  VariableContext,
  TestExecutionContext,
  SchemaValidationOptions,
  WebSocketConfig,
  GraphQLConfig
} from '../RestifiedTypes';

export type { AuthProvider, OAuth2TokenResponse } from './auth/AuthTypes';