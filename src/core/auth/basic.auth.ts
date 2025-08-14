import { AuthProvider } from './AuthTypes';

export class BasicAuth implements AuthProvider {
  private credentials: string;

  constructor(private username: string, private password: string) {
    this.credentials = Buffer.from(`${username}:${password}`).toString('base64');
  }

  apply(config: any): void {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = `Basic ${this.credentials}`;
  }

  getType(): string {
    return 'basic';
  }

  setCredentials(username: string, password: string): void {
    this.username = username;
    this.password = password;
    this.credentials = Buffer.from(`${username}:${password}`).toString('base64');
  }

  getUsername(): string {
    return this.username;
  }

  getEncodedCredentials(): string {
    return this.credentials;
  }

  static create(username: string, password: string): BasicAuth {
    return new BasicAuth(username, password);
  }
}