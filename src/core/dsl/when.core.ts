import axios, { AxiosResponse } from 'axios';
import { RequestConfig, HttpResponse } from '../../RestifiedTypes';

export class WhenStep {
  constructor(
    private context: any,
    private config: RequestConfig
  ) {}

  get(path: string): this {
    return this.request('GET', path);
  }

  post(path: string, body?: any): this {
    return this.request('POST', path, body);
  }

  put(path: string, body?: any): this {
    return this.request('PUT', path, body);
  }

  patch(path: string, body?: any): this {
    return this.request('PATCH', path, body);
  }

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
      method,
      path: this.resolveVariables(path),
      body: body ? this.resolveVariables(body) : undefined,
      config: this.config
    });
    return this;
  }

  async execute(): Promise<import('./then.core').ThenStep> {
    const startTime = Date.now();
    
    try {
      const requestDetails = this.context.getRequestDetails();
      const url = this.buildUrl(requestDetails.path);
      
      const axiosConfig = this.buildAxiosConfig();
      
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
        
        this.context.setResponse(httpResponse);
        const { ThenStep } = require('./then.core');
        return new ThenStep(this.context, httpResponse);
      }
      
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
    const config: any = {
      timeout: this.config.timeout || 30000,
      headers: { ...this.config.headers },
      validateStatus: () => true // Accept all status codes
    };

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