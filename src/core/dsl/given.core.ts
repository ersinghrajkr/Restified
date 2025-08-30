import { AuthConfig, RequestConfig, ConnectionPoolConfig } from '../../RestifiedTypes';

export class GivenStep {
  private config: RequestConfig = {};
  private localVars: Record<string, any> = {};

  constructor(private context: any) {}

  /**
   * Sets the base URL for the HTTP request
   * @param {string} url - Base URL (supports variable resolution like {{baseUrl}})
   * @returns {this} GivenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .baseURL('https://api.example.com')
   *   .baseURL('{{environment.apiUrl}}') // Using variables
   * ```
   */
  baseURL(url: string): this {
    this.config.baseURL = url;
    return this;
  }

  /**
   * Sets a single HTTP header for the request
   * @param {string} name - Header name (e.g., 'Content-Type', 'Authorization')
   * @param {string} value - Header value (supports variable resolution and utilities)
   * @returns {this} GivenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .header('Content-Type', 'application/json')
   *   .header('Authorization', 'Bearer {{authToken}}')
   *   .header('X-Request-ID', '{{$util.random.uuid()}}')
   *   .header('X-Timestamp', '{{$util.date.now("ISO")}}')
   * ```
   */
  header(name: string, value: string): this {
    if (!this.config.headers) {
      this.config.headers = {};
    }
    this.config.headers[name] = this.resolveVariables(value);
    return this;
  }

  /**
   * Sets multiple HTTP headers at once
   * @param {Record<string, string>} headers - Object containing header name-value pairs
   * @returns {this} GivenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .headers({
   *     'Content-Type': 'application/json',
   *     'Accept': 'application/json',
   *     'User-Agent': 'RestifiedTS/2.0.6',
   *     'X-API-Version': 'v2'
   *   })
   *   .headers({ 'Authorization': '{{bearerToken}}' }) // Can be chained
   * ```
   */
  headers(headers: Record<string, string>): this {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  /**
   * Sets the Content-Type header for the request (shorthand for .header('Content-Type', type))
   * @param {string} type - MIME type (e.g., 'application/json', 'application/xml', 'multipart/form-data')
   * @returns {this} GivenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .contentType('application/json')        // JSON requests
   *   .contentType('application/xml')         // XML requests
   *   .contentType('multipart/form-data')     // File uploads
   *   .contentType('application/x-www-form-urlencoded') // Form data
   * ```
   */
  contentType(type: string): this {
    return this.header('Content-Type', type);
  }

  /**
   * Sets the Accept header for the request (shorthand for .header('Accept', type))
   * @param {string} type - MIME type to accept in response (e.g., 'application/json', 'text/html')
   * @returns {this} GivenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .accept('application/json')  // Expect JSON response
   *   .accept('text/html')         // Expect HTML response
   *   .accept('application/xml')   // Expect XML response
   *   .accept('* /*')               // Accept any response type
   * ```
   */
  accept(type: string): this {
    return this.header('Accept', type);
  }

  auth(authConfig: AuthConfig): this {
    this.config.auth = authConfig;
    return this;
  }

  /**
   * Sets Bearer token authentication (adds Authorization: Bearer <token> header)
   * @param {string} token - JWT token or API token (without 'Bearer ' prefix)
   * @returns {this} GivenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .bearerToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
   *   .bearerToken('{{authToken}}')           // Using variable
   *   .bearerToken('{{$util.env.API_TOKEN}}') // From environment
   * ```
   */
  bearerToken(token: string): this {
    return this.auth({
      type: 'bearer',
      token: this.resolveVariables(token)
    });
  }

  basicAuth(username: string, password: string): this {
    return this.auth({
      type: 'basic',
      username: this.resolveVariables(username),
      password: this.resolveVariables(password)
    });
  }

  apiKey(key: string, name: string = 'X-API-Key', location: 'header' | 'query' = 'header'): this {
    return this.auth({
      type: 'api-key',
      apiKey: this.resolveVariables(key),
      keyName: name,
      keyLocation: location
    });
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  retries(count: number, delay: number = 1000): this {
    this.config.retries = count;
    this.config.retryDelay = delay;
    return this;
  }

  variable(name: string, value: any): this {
    this.localVars[name] = value;
    this.context.setLocalVariable(name, value);
    return this;
  }

  variables(vars: Record<string, any>): this {
    Object.entries(vars).forEach(([key, value]) => {
      this.variable(key, value);
    });
    return this;
  }

  useClient(clientName: string): this {
    const clientConfig = this.context.getClientConfig(clientName);
    if (clientConfig) {
      this.config = { ...this.config, ...clientConfig };
    }
    return this;
  }

  /**
   * Configure HTTP connection pooling for performance optimization
   * @param {ConnectionPoolConfig} config - Connection pool configuration
   * @returns {this} GivenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .connectionPool({
   *     keepAlive: true,
   *     maxSockets: 50,
   *     http2: true
   *   })
   *   .baseURL('https://api.example.com')
   * .when()
   *   .get('/users')
   * ```
   */
  connectionPool(config: ConnectionPoolConfig): this {
    this.config.connectionPool = config;
    return this;
  }

  when(): import('./when.core').WhenStep {
    const { WhenStep } = require('./when.core');
    return new WhenStep(this.context, this.config);
  }

  private resolveVariables(value: string): string {
    if (typeof value !== 'string') return value;
    
    return value.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedVarName = varName.trim();
      
      if (trimmedVarName.startsWith('$faker.')) {
        return this.resolveFakerVariable(trimmedVarName);
      }
      
      if (trimmedVarName.startsWith('$random.')) {
        return this.resolveRandomVariable(trimmedVarName);
      }
      
      if (trimmedVarName.startsWith('$date.')) {
        return this.resolveDateVariable(trimmedVarName);
      }
      
      if (trimmedVarName.startsWith('$env.')) {
        const envVar = trimmedVarName.substring(5);
        return process.env[envVar] || '';
      }
      
      return this.context.getVariable(trimmedVarName) || match;
    });
  }

  private resolveFakerVariable(varName: string): string {
    return `{{${varName}}}`;
  }

  private resolveRandomVariable(varName: string): string {
    if (varName === '$random.uuid') {
      return require('crypto').randomUUID();
    }
    
    const mathMatch = varName.match(/\$random\.(\w+)\((\d+),(\d+)\)/);
    if (mathMatch) {
      const [, operation, min, max] = mathMatch;
      const minNum = parseInt(min, 10);
      const maxNum = parseInt(max, 10);
      
      if (operation === 'int') {
        return String(Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
      }
    }
    
    return `{{${varName}}}`;
  }

  private resolveDateVariable(varName: string): string {
    if (varName === '$date.now') {
      return new Date().toISOString();
    }
    
    if (varName === '$date.timestamp') {
      return String(Date.now());
    }
    
    return `{{${varName}}}`;
  }
}