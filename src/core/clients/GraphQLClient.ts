/**
 * GraphQL Client for RestifiedTS
 * 
 * Provides comprehensive GraphQL query and mutation testing capabilities
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { VariableStore } from '../stores/variable.core';

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, any>;
  }>;
  extensions?: Record<string, any>;
}

export interface GraphQLClientConfig {
  endpoint: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  subscriptionEndpoint?: string; // For WebSocket subscriptions
}

export class GraphQLClient {
  private httpClient: AxiosInstance;
  private config: GraphQLClientConfig;
  private variableStore: VariableStore;

  constructor(config: GraphQLClientConfig, variableStore: VariableStore) {
    this.config = config;
    this.variableStore = variableStore;
    
    this.httpClient = axios.create({
      baseURL: config.endpoint,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });

    // Add request interceptor for variable resolution
    this.httpClient.interceptors.request.use((config) => {
      if (config.data) {
        config.data = this.variableStore.resolveVariables(config.data);
      }
      return config;
    });
  }

  /**
   * Execute a GraphQL query
   */
  async query<T = any>(
    query: string, 
    variables?: Record<string, any>, 
    operationName?: string
  ): Promise<AxiosResponse<GraphQLResponse<T>>> {
    const request: GraphQLRequest = {
      query: this.variableStore.resolveVariables(query) as string,
      variables: variables ? this.variableStore.resolveVariables(variables) : undefined,
      operationName
    };

    return await this.executeWithRetry(request);
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutation<T = any>(
    mutation: string, 
    variables?: Record<string, any>, 
    operationName?: string
  ): Promise<AxiosResponse<GraphQLResponse<T>>> {
    const request: GraphQLRequest = {
      query: this.variableStore.resolveVariables(mutation) as string,
      variables: variables ? this.variableStore.resolveVariables(variables) : undefined,
      operationName
    };

    return await this.executeWithRetry(request);
  }

  /**
   * Execute a raw GraphQL request
   */
  async execute<T = any>(request: GraphQLRequest): Promise<AxiosResponse<GraphQLResponse<T>>> {
    const resolvedRequest: GraphQLRequest = {
      query: this.variableStore.resolveVariables(request.query) as string,
      variables: request.variables ? this.variableStore.resolveVariables(request.variables) : undefined,
      operationName: request.operationName
    };

    return await this.executeWithRetry(resolvedRequest);
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T = any>(
    request: GraphQLRequest, 
    attempt: number = 1
  ): Promise<AxiosResponse<GraphQLResponse<T>>> {
    try {
      const startTime = Date.now();
      const response = await this.httpClient.post('', request);
      const endTime = Date.now();

      // Add timing information
      (response as any).timings = {
        duration: endTime - startTime,
        start: startTime,
        end: endTime
      };

      return response;
    } catch (error: any) {
      if (attempt < (this.config.retries || 3)) {
        await this.delay(this.config.retryDelay || 1000);
        return this.executeWithRetry(request, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Introspection query to get schema information
   */
  async introspect(): Promise<AxiosResponse<GraphQLResponse>> {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
        }
      }

      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }

      fragment InputValue on __InputValue {
        name
        description
        type { ...TypeRef }
        defaultValue
      }

      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    return this.query(introspectionQuery);
  }

  /**
   * Validate GraphQL query syntax
   */
  validateQuery(query: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Basic syntax validation
    if (!query.trim()) {
      errors.push('Query cannot be empty');
    }

    // Check for balanced braces
    const openBraces = (query.match(/{/g) || []).length;
    const closeBraces = (query.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced braces in query');
    }

    // Check for query/mutation/subscription keywords
    const hasOperation = /^\s*(query|mutation|subscription)\s+/i.test(query) || 
                        /^\s*{\s*\w+/.test(query);
    if (!hasOperation) {
      errors.push('Query must start with query, mutation, subscription, or be a shorthand query');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Update client headers
   */
  setHeaders(headers: Record<string, string>): void {
    Object.assign(this.httpClient.defaults.headers, headers);
  }

  /**
   * Set authorization header
   */
  setAuth(token: string, type: 'Bearer' | 'Basic' = 'Bearer'): void {
    this.httpClient.defaults.headers['Authorization'] = `${type} ${token}`;
  }

  /**
   * Get current configuration
   */
  getConfig(): GraphQLClientConfig {
    return { ...this.config };
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}