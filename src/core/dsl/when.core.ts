import axios, { AxiosResponse } from 'axios';
import { RequestConfig, HttpResponse } from '../../RestifiedTypes';
import { ConnectionManager } from '../network/ConnectionManager';
import { RetryManager, globalRetryManager } from '../network/RetryManager';
import { CircuitBreakerManager, globalCircuitBreakerManager } from '../network/CircuitBreakerManager';
import { TimeoutManager, globalTimeoutManager } from '../network/TimeoutManager';
import { ErrorRecoveryManager } from '../network/ErrorRecoveryManager';
import { AdvancedPerformanceManager } from '../performance/AdvancedPerformanceManager';

export class WhenStep {
  private connectionManager: ConnectionManager;
  private retryManager: RetryManager;
  private circuitBreakerManager: CircuitBreakerManager;
  private timeoutManager: TimeoutManager;
  private errorRecoveryManager?: ErrorRecoveryManager;
  private advancedPerformanceManager?: AdvancedPerformanceManager;

  constructor(
    private context: any,
    private config: RequestConfig
  ) {
    // Initialize connection manager with config if provided
    this.connectionManager = new ConnectionManager(this.config.connectionPool);
    
    // Use global retry manager but update its config if provided
    this.retryManager = globalRetryManager;
    if (this.config.retry) {
      this.retryManager.updateConfig(this.config.retry);
    }
    
    // Use global circuit breaker manager
    this.circuitBreakerManager = globalCircuitBreakerManager;
    
    // Use global timeout manager
    this.timeoutManager = globalTimeoutManager;
    if (this.config.timeoutIntelligence) {
      this.timeoutManager.updateConfig(this.config.timeoutIntelligence);
    }
    
    // Initialize error recovery manager only if enabled
    if (this.config.errorRecovery?.enabled) {
      this.errorRecoveryManager = new ErrorRecoveryManager(this.config.errorRecovery);
    }
    
    // Initialize advanced performance manager only if enabled
    if (this.config.advancedPerformance?.enabled) {
      this.advancedPerformanceManager = new AdvancedPerformanceManager(this.config.advancedPerformance);
    }
  }

  /**
   * Executes a GET HTTP request
   * @param {string} path - API endpoint path (supports variable resolution)
   * @returns {this} WhenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .baseURL('https://api.example.com')
   * .when()
   *   .get('/users')                    // Simple GET
   *   .get('/users/{{userId}}')         // With path variable
   *   .get('/users?page={{pageNum}}')   // With query parameter
   * ```
   */
  get(path: string): this {
    return this.request('GET', path);
  }

  /**
   * Executes a POST HTTP request with optional request body
   * @param {string} path - API endpoint path (supports variable resolution)
   * @param {any} [body] - Request body (object, string, FormData, etc.)
   * @returns {this} WhenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .contentType('application/json')
   * .when()
   *   .post('/users', { name: 'John', email: 'john@example.com' })
   *   .post('/users/{{userId}}/posts', {
   *     title: 'My Post',
   *     content: 'Post content here'
   *   })
   *   .post('/upload', formData)  // File upload
   * ```
   */
  post(path: string, body?: any): this {
    return this.request('POST', path, body);
  }

  /**
   * Executes a PUT HTTP request with optional request body
   * @param {string} path - API endpoint path (supports variable resolution)
   * @param {any} [body] - Request body (object, string, FormData, etc.)
   * @returns {this} WhenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .contentType('application/json')
   * .when()
   *   .put('/users/{{userId}}', {
   *     name: 'Updated Name',
   *     email: 'updated@example.com'
   *   })
   *   .put('/posts/{{postId}}', { title: 'Updated Title' })
   * ```
   */
  put(path: string, body?: any): this {
    return this.request('PUT', path, body);
  }

  patch(path: string, body?: any): this {
    return this.request('PATCH', path, body);
  }

  /**
   * Executes a DELETE HTTP request
   * @param {string} path - API endpoint path (supports variable resolution)
   * @returns {this} WhenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .bearerToken('{{authToken}}')
   * .when()
   *   .delete('/users/{{userId}}')
   *   .delete('/posts/{{postId}}/comments/{{commentId}}')
   * ```
   */
  delete(path: string): this {
    return this.request('DELETE', path);
  }

  head(path: string): this {
    return this.request('HEAD', path);
  }

  options(path: string): this {
    return this.request('OPTIONS', path);
  }

  private request(method: string, path: string, body?: any): this {
    this.context.setRequestDetails({
      method: method.toUpperCase(),
      path: this.resolveVariables(path),
      body: body ? this.resolveVariables(body) : undefined
    });
    return this;
  }

  /**
   * Sleep/wait before executing the HTTP request
   * @param {number} ms - Milliseconds to sleep (e.g., 1000 = 1 second)
   * @returns {this} WhenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .baseURL('https://api.example.com')
   * .when()
   *   .sleep(2000)  // Wait 2 seconds before request
   *   .get('/users')
   *   .execute()
   * .then()
   *   .statusCode(200);
   * ```
   */
  sleep(ms: number): this {
    if (!this.context.sleepDuration) {
      this.context.sleepDuration = 0;
    }
    this.context.sleepDuration += ms;
    return this;
  }

  /**
   * Alias for sleep() method
   * @param {number} ms - Milliseconds to wait
   * @returns {this} WhenStep instance for method chaining
   */
  wait(ms: number): this {
    return this.sleep(ms);
  }

  async execute(): Promise<import('./then.core').ThenStep> {
    // Handle sleep if specified
    if (this.context.sleepDuration && this.context.sleepDuration > 0) {
      await new Promise(resolve => setTimeout(resolve, this.context.sleepDuration));
      this.context.sleepDuration = 0; // Reset after use
    }
    
    const requestDetails = this.context.getRequestDetails();
    const url = this.buildUrl(requestDetails.path);
    const requestId = `${requestDetails.method}:${url}:${Date.now()}`;
    
    // Create circuit ID for this endpoint
    const circuitId = `${requestDetails.method}:${this.buildUrl('')}`;
    
    // Execute HTTP request with all performance and resilience features
    const performanceContext = {
      method: requestDetails.method,
      url: url,
      headers: this.config.headers,
      body: requestDetails.body,
      cacheOptions: {
        cacheable: true,
        ttl: this.config.advancedPerformance?.caching?.defaultTtl,
      },
      batchOptions: {
        batchable: this.config.advancedPerformance?.batching?.enabled,
      },
      streamOptions: {
        chunkSize: this.config.advancedPerformance?.streaming?.chunkSize,
      },
    };

    // Check if advanced performance is enabled
    if (this.config.advancedPerformance?.enabled && this.advancedPerformanceManager) {
      // Execute with advanced performance optimizations (deduplication, caching, batching, streaming)
      return await this.advancedPerformanceManager.executeWithPerformanceOptimizations(
        requestId,
        async () => {
          // Execute with optional error recovery integration
          if (this.config.errorRecovery?.enabled && this.errorRecoveryManager) {
            const endpointId = `${requestDetails.method}:${url}`;
            const errorRecoveryContext = {
              method: requestDetails.method,
              url: url,
              body: requestDetails.body
            };
            
            const result = await this.errorRecoveryManager.executeWithRecovery(
              endpointId,
              async () => this.executeWithResilienceStack(circuitId, requestId),
              errorRecoveryContext,
              this.config.errorRecovery
            );
            
            return result.data;
          } else {
            return await this.executeWithResilienceStack(circuitId, requestId);
          }
        },
        performanceContext
      );
    } else if (this.config.errorRecovery?.enabled && this.errorRecoveryManager) {
      // Execute with error recovery only (no advanced performance)
      const endpointId = `${requestDetails.method}:${url}`;
      const requestContext = {
        method: requestDetails.method,
        url: url,
        body: requestDetails.body
      };
      
      const result = await this.errorRecoveryManager.executeWithRecovery(
        endpointId,
        async () => this.executeWithResilienceStack(circuitId, requestId),
        requestContext,
        this.config.errorRecovery
      );
      
      return result.data;
    } else {
      // Execute with standard resilience stack only - preserves original behavior
      return await this.executeWithResilienceStack(circuitId, requestId);
    }
  }

  /**
   * Execute request with standard resilience stack (circuit breaker -> retry)
   */
  private async executeWithResilienceStack(circuitId: string, requestId: string): Promise<import('./then.core').ThenStep> {
    return await this.circuitBreakerManager.executeWithCircuitBreaker(
      circuitId,
      async () => {
        // Execute with retry logic inside circuit breaker
        return await this.retryManager.executeWithRetry(
          requestId,
          async () => this.performHttpRequest(),
          this.config.retry
        );
      },
      this.config.circuitBreaker
    );
  }

  /**
   * Perform the actual HTTP request
   */
  private async performHttpRequest(): Promise<import('./then.core').ThenStep> {
    const startTime = Date.now();
    const requestDetails = this.context.getRequestDetails();
    const url = this.buildUrl(requestDetails.path);
    
    try {
      
      const axiosConfig = this.buildAxiosConfig();
      
      // Enhanced request data capture before HTTP call for guaranteed reporting
      const requestDataForReporting = {
        method: requestDetails.method,
        url: url,
        headers: axiosConfig.headers || {},
        body: requestDetails.body || null,
        timestamp: new Date().toISOString(),
        baseURL: axiosConfig.baseURL || ''
      };
      
      // Store request data globally for the reporter to access
      (global as any).__RESTIFIED_CURRENT_REQUEST__ = requestDataForReporting;
      
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('🔍 WhenStep: Captured request data:', requestDataForReporting);
      }
      
      let response: AxiosResponse;
      
      if (['POST', 'PUT', 'PATCH'].includes(requestDetails.method)) {
        response = await axios.request({
          ...axiosConfig,
          method: requestDetails.method.toLowerCase(),
          url,
          data: requestDetails.body
        });
      } else {
        response = await axios.request({
          ...axiosConfig,
          method: requestDetails.method.toLowerCase(),
          url
        });
      }

      const endTime = Date.now();
      const httpResponse: HttpResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        responseTime: endTime - startTime,
        config: response.config
      };

      // Store successful response data globally for the reporter
      (global as any).__RESTIFIED_CURRENT_RESPONSE__ = httpResponse;
      
      // Record response time for timeout intelligence
      this.timeoutManager.recordResponseTime(
        requestDetails.method,
        url,
        httpResponse.responseTime,
        false // not timed out
      );
      
      this.context.setResponse(httpResponse);
      
      const { ThenStep } = require('./then.core');
      return new ThenStep(this.context, httpResponse);
      
    } catch (error: any) {
      const endTime = Date.now();
      
      if (error.response) {
        const httpResponse: HttpResponse = {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers as Record<string, string>,
          data: error.response.data,
          responseTime: endTime - startTime,
          config: error.response.config
        };
        
        // Store error response data globally for the reporter
        (global as any).__RESTIFIED_CURRENT_RESPONSE__ = httpResponse;
        
        // Record response time for timeout intelligence (error response)
        this.timeoutManager.recordResponseTime(
          requestDetails.method,
          url,
          httpResponse.responseTime,
          false // not timed out, just error response
        );
        
        this.context.setResponse(httpResponse);
        const { ThenStep } = require('./then.core');
        return new ThenStep(this.context, httpResponse);
      } else {
        // Handle cases where there's no response (e.g., network errors, invalid URLs)
        const errorHttpResponse: HttpResponse = {
          status: 0,
          statusText: error.message || 'Request Failed',
          headers: {},
          data: null,
          responseTime: endTime - startTime,
          config: {},
          error: error.message || 'Unknown error'
        };
        
        // Store error response data globally for the reporter
        (global as any).__RESTIFIED_CURRENT_RESPONSE__ = errorHttpResponse;
        (global as any).__RESTIFIED_CURRENT_ERROR__ = {
          message: error.message,
          stack: error.stack,
          code: error.code,
          type: error.constructor.name
        };
        
        // Record timeout event for timeout intelligence
        const isTimeout = error.code === 'ECONNABORTED' || 
                         error.message?.includes('timeout') || 
                         error.message?.includes('ETIMEDOUT');
        
        this.timeoutManager.recordResponseTime(
          requestDetails.method,
          url,
          errorHttpResponse.responseTime,
          isTimeout
        );
      }
      
      // Still throw the error to maintain existing behavior, but data is captured
      throw error;
    }
  }

  private buildUrl(path: string): string {
    const baseURL = this.config.baseURL || this.context.getConfig().baseURL || '';
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const cleanBase = baseURL.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    
    return `${cleanBase}/${cleanPath}`;
  }

  private buildAxiosConfig(): any {
    const baseURL = this.config.baseURL || this.context.getConfig().baseURL || '';
    const requestDetails = this.context.getRequestDetails();
    const url = this.buildUrl(requestDetails.path);
    
    // Get intelligent timeout for this request
    const intelligentTimeout = this.timeoutManager.getTimeoutForEndpoint(
      requestDetails.method,
      url,
      this.config.timeout,
      this.config.timeoutIntelligence
    );
    
    // Start with base config
    const config: any = {
      timeout: intelligentTimeout,
      headers: { ...this.config.headers },
      validateStatus: () => true // Accept all status codes
    };

    // Apply connection pooling configuration
    const poolConfig = this.connectionManager.getAxiosConfig(baseURL);
    Object.assign(config, poolConfig);
    
    // Merge headers (connection pool headers + user headers)
    config.headers = {
      ...poolConfig.headers,
      ...config.headers
    };

    // Apply authentication (must be after connection pooling to preserve auth headers)
    if (this.config.auth) {
      this.applyAuthentication(config);
    }

    return config;
  }

  private applyAuthentication(config: any): void {
    const auth = this.config.auth!;

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          config.headers.Authorization = `Bearer ${auth.token}`;
        }
        break;
        
      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          config.headers.Authorization = `Basic ${credentials}`;
        }
        break;
        
      case 'api-key':
        if (auth.apiKey && auth.keyName) {
          if (auth.keyLocation === 'header') {
            config.headers[auth.keyName] = auth.apiKey;
          } else if (auth.keyLocation === 'query') {
            if (!config.params) config.params = {};
            config.params[auth.keyName] = auth.apiKey;
          }
        }
        break;
    }
  }

  private resolveVariables(value: any): any {
    if (typeof value === 'string') {
      return value.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        return this.context.getVariable(varName.trim()) || match;
      });
    }
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(item => this.resolveVariables(item));
      }
      
      const resolved: any = {};
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolveVariables(val);
      }
      return resolved;
    }
    
    return value;
  }

}