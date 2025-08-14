import { AuthProvider } from './AuthTypes';

export class ApiKeyAuth implements AuthProvider {
  constructor(
    private apiKey: string,
    private keyName: string = 'X-API-Key',
    private location: 'header' | 'query' = 'header'
  ) {}

  apply(config: any): void {
    if (this.location === 'header') {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers[this.keyName] = this.apiKey;
    } else if (this.location === 'query') {
      if (!config.params) {
        config.params = {};
      }
      config.params[this.keyName] = this.apiKey;
    }
  }

  getType(): string {
    return 'api-key';
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setKeyName(keyName: string): void {
    this.keyName = keyName;
  }

  setLocation(location: 'header' | 'query'): void {
    this.location = location;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getKeyName(): string {
    return this.keyName;
  }

  getLocation(): 'header' | 'query' {
    return this.location;
  }

  static create(apiKey: string, keyName?: string, location?: 'header' | 'query'): ApiKeyAuth {
    return new ApiKeyAuth(apiKey, keyName, location);
  }

  static header(apiKey: string, keyName: string = 'X-API-Key'): ApiKeyAuth {
    return new ApiKeyAuth(apiKey, keyName, 'header');
  }

  static query(apiKey: string, keyName: string): ApiKeyAuth {
    return new ApiKeyAuth(apiKey, keyName, 'query');
  }
}