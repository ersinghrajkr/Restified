import { AuthProvider } from './AuthTypes';

export class BearerAuth implements AuthProvider {
  constructor(private token: string) {}

  apply(config: any): void {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = `Bearer ${this.token}`;
  }

  getType(): string {
    return 'bearer';
  }

  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string {
    return this.token;
  }

  static create(token: string): BearerAuth {
    return new BearerAuth(token);
  }
}