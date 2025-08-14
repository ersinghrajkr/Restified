import axios from 'axios';
import { AuthProvider, OAuth2TokenResponse } from './AuthTypes';

export class OAuth2Auth implements AuthProvider {
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiry?: Date;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private tokenUrl: string,
    private scope?: string
  ) {}

  async authenticate(username?: string, password?: string): Promise<OAuth2TokenResponse> {
    const data = new URLSearchParams();
    
    if (username && password) {
      // Resource Owner Password Credentials Grant
      data.append('grant_type', 'password');
      data.append('username', username);
      data.append('password', password);
    } else {
      // Client Credentials Grant
      data.append('grant_type', 'client_credentials');
    }

    data.append('client_id', this.clientId);
    data.append('client_secret', this.clientSecret);
    
    if (this.scope) {
      data.append('scope', this.scope);
    }

    try {
      const response = await axios.post(this.tokenUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenResponse: OAuth2TokenResponse = response.data;
      
      this.accessToken = tokenResponse.access_token;
      this.refreshToken = tokenResponse.refresh_token;
      
      if (tokenResponse.expires_in) {
        this.tokenExpiry = new Date(Date.now() + (tokenResponse.expires_in * 1000));
      }

      return tokenResponse;
    } catch (error: any) {
      throw new Error(`OAuth2 authentication failed: ${error.message}`);
    }
  }

  async refreshAccessToken(): Promise<OAuth2TokenResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const data = new URLSearchParams();
    data.append('grant_type', 'refresh_token');
    data.append('refresh_token', this.refreshToken);
    data.append('client_id', this.clientId);
    data.append('client_secret', this.clientSecret);

    try {
      const response = await axios.post(this.tokenUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokenResponse: OAuth2TokenResponse = response.data;
      
      this.accessToken = tokenResponse.access_token;
      
      if (tokenResponse.refresh_token) {
        this.refreshToken = tokenResponse.refresh_token;
      }
      
      if (tokenResponse.expires_in) {
        this.tokenExpiry = new Date(Date.now() + (tokenResponse.expires_in * 1000));
      }

      return tokenResponse;
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  apply(config: any): void {
    if (!this.accessToken) {
      throw new Error('OAuth2 token not available. Call authenticate() first.');
    }

    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = `Bearer ${this.accessToken}`;
  }

  getType(): string {
    return 'oauth2';
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiry) {
      return false; // No expiry set, assume valid
    }
    return new Date() >= this.tokenExpiry;
  }

  hasAccessToken(): boolean {
    return !!this.accessToken;
  }

  hasRefreshToken(): boolean {
    return !!this.refreshToken;
  }

  getAccessToken(): string | undefined {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  static create(clientId: string, clientSecret: string, tokenUrl: string, scope?: string): OAuth2Auth {
    return new OAuth2Auth(clientId, clientSecret, tokenUrl, scope);
  }

  static clientCredentials(clientId: string, clientSecret: string, tokenUrl: string, scope?: string): OAuth2Auth {
    return new OAuth2Auth(clientId, clientSecret, tokenUrl, scope);
  }
}