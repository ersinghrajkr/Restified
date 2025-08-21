import { AuthConfig, RequestConfig } from '../../RestifiedTypes';

export class GivenStep {
  private config: RequestConfig = {};
  private localVars: Record<string, any> = {};

  constructor(private context: any) {}

  baseURL(url: string): this {
    this.config.baseURL = url;
    return this;
  }

  header(name: string, value: string): this {
    if (!this.config.headers) {
      this.config.headers = {};
    }
    this.config.headers[name] = this.resolveVariables(value);
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  contentType(type: string): this {
    return this.header('Content-Type', type);
  }

  accept(type: string): this {
    return this.header('Accept', type);
  }

  auth(authConfig: AuthConfig): this {
    this.config.auth = authConfig;
    return this;
  }

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