import { GivenStep } from '@core/dsl/given.core';
import { VariableStore } from '@core/stores/variable.core';
import { ResponseStore } from '@core/stores/response.core';
import { ConfigManager } from '@core/config/config.core';
import { BearerAuth } from '@core/auth/bearer.auth';
import { BasicAuth } from '@core/auth/basic.auth';
import { ApiKeyAuth } from '@core/auth/apikey.auth';
import { OAuth2Auth } from '@core/auth/oauth2.auth';
import { RestifiedConfig, RequestConfig, HttpResponse, AssertionResult, AuthConfig } from '../RestifiedTypes';

export class Restified {
  private variableStore: VariableStore;
  private responseStore: ResponseStore;
  private configManager: ConfigManager;
  private config: RestifiedConfig;
  private requestDetails: any = null;
  private clientConfigs: Map<string, RequestConfig> = new Map();

  constructor(config: RestifiedConfig = {}) {
    this.configManager = ConfigManager.getInstance();
    this.config = { ...this.configManager.getConfig(), ...config };
    this.variableStore = new VariableStore();
    this.responseStore = new ResponseStore();
    
    this.initializeClients();
    this.loadConfigVariables();
  }

  given(): GivenStep {
    return new GivenStep(this);
  }

  // Variable management methods
  setGlobalVariable(name: string, value: any): void {
    this.variableStore.setGlobalVariable(name, value);
  }

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
  async cleanup(): Promise<void> {
    // Execute global teardown if configured
    if (this.config.hooks?.globalTeardown) {
      await this.config.hooks.globalTeardown();
    }

    // Dump variables for debugging
    this.variableStore.dumpVariables();

    // Clear local state
    this.clearLocalVariables();
    this.clearAssertions();
    this.requestDetails = null;
  }

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

  // Static factory method
  static create(config?: RestifiedConfig): Restified {
    return new Restified(config);
  }
}

// Create default instance for convenience
export const restified = Restified.create();

// Re-export supporting classes and types for direct access
export { VariableStore } from '@core/stores/variable.core';
export { ResponseStore } from '@core/stores/response.core';
export { ConfigManager } from '@core/config/config.core';
export { BearerAuth } from '@core/auth/bearer.auth';
export { BasicAuth } from '@core/auth/basic.auth';
export { ApiKeyAuth } from '@core/auth/apikey.auth';
export { OAuth2Auth } from '@core/auth/oauth2.auth';
export { GivenStep } from '@core/dsl/given.core';
export { WhenStep } from '@core/dsl/when.core';
export { ThenStep } from '@core/dsl/then.core';

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

export type { AuthProvider, OAuth2TokenResponse } from '@core/auth/AuthTypes';