/**
 * Configuration Loader
 * 
 * Loads and validates the restified.config.ts file with smart defaults
 */

import * as fs from 'fs';
import * as path from 'path';
import { RestifiedConfig, EnvironmentConfig, AuthenticationConfig, ReportingConfig } from '../../RestifiedTypes';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: RestifiedConfig | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = this.findConfigFile();
  }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Load configuration with smart defaults
   */
  public async loadConfig(): Promise<RestifiedConfig> {
    if (this.config) {
      return this.config;
    }

    let userConfig: Partial<RestifiedConfig> = {};

    // Try to load user configuration
    try {
      if (this.configPath && fs.existsSync(this.configPath)) {
        console.log(`📋 Loading configuration from: ${path.relative(process.cwd(), this.configPath)}`);
        
        // Dynamic import for TypeScript config files
        const configModule = await import(this.configPath);
        userConfig = configModule.default || configModule;
      } else {
        console.log('📋 No config file found, using defaults');
      }
    } catch (error) {
      console.log(`⚠️  Warning: Could not load config file: ${error.message}`);
      console.log('📋 Using default configuration');
    }

    // Merge with defaults
    this.config = this.mergeWithDefaults(userConfig);
    return this.config;
  }

  /**
   * Get current configuration (must call loadConfig first)
   */
  public getConfig(): RestifiedConfig | null {
    return this.config;
  }

  /**
   * Find config file in project root
   */
  private findConfigFile(): string {
    const possiblePaths = [
      path.join(process.cwd(), 'restified.config.ts'),
      path.join(process.cwd(), 'restified.config.js'),
      path.join(process.cwd(), 'restified.config.json')
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return possiblePaths[0]; // Default to .ts file path
  }

  /**
   * Merge user config with smart defaults
   */
  private mergeWithDefaults(userConfig: Partial<RestifiedConfig>): RestifiedConfig {
    const defaultEnvironment: EnvironmentConfig = {
      name: process.env.TEST_ENV || 'development',
      timeout: 30000,
      retries: 3,
      enableLogging: true
    };

    const defaultAuthentication: AuthenticationConfig = {
      endpoint: '/users/1',
      method: 'GET',
      client: 'auth',
      extractors: {
        token: '$.name',
        userEmail: '$.email',
        userId: '$.id'
      },
      fallback: {
        token: 'fallback-token-123',
        userEmail: 'test@example.com',
        userId: 1
      }
    };

    const defaultReporting: ReportingConfig = {
      enabled: true,
      outputDir: 'reports',
      formats: ['html', 'json'],
      openAfterGeneration: false,
      includeRequestResponse: true,
      includeScreenshots: true
    };

    const defaultConfig: RestifiedConfig = {
      environment: defaultEnvironment,
      
      clients: {
        api: {
          baseURL: 'https://jsonplaceholder.typicode.com',
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        },
        testUtils: {
          baseURL: 'https://httpbin.org',
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        },
        auth: {
          baseURL: 'https://jsonplaceholder.typicode.com',
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      },

      globalHeaders: {
        'X-Test-Suite': 'restified-tests',
        'X-Environment': process.env.TEST_ENV || 'development',
        'X-API-Version': 'v1'
      },

      authentication: defaultAuthentication,

      globalVariables: {
        testEnvironment: process.env.TEST_ENV || 'development',
        apiVersion: 'v1',
        testSuite: 'restified-tests',
        defaultTimeout: 10000,
        maxRetries: 3,
        enableLogging: true
      },

      environmentVariables: {
        EXAMPLE_API_KEY: 'demo-api-key-12345',
        EXAMPLE_ENVIRONMENT: 'test',
        EXAMPLE_VERSION: '1.0.0'
      },

      reporting: defaultReporting,

      healthChecks: [
        {
          name: 'API Service',
          client: 'api',
          endpoint: '/posts/1',
          expectedStatus: 200
        }
      ]
    };

    // Deep merge user config with defaults
    return this.deepMerge(defaultConfig, userConfig) as RestifiedConfig;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Validate configuration
   */
  public validateConfig(config: RestifiedConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate environment
    if (config.environment) {
      if (!config.environment.name) {
        errors.push('Environment name is required');
      }
      if (config.environment.timeout < 1000) {
        errors.push('Environment timeout must be at least 1000ms');
      }
    }

    // Validate clients
    if (config.clients) {
      for (const [clientName, clientConfig] of Object.entries(config.clients)) {
        if (!clientConfig.baseURL) {
          errors.push(`Client '${clientName}' missing baseURL`);
        }
        if (clientConfig.timeout && clientConfig.timeout < 1000) {
          errors.push(`Client '${clientName}' timeout must be at least 1000ms`);
        }
      }
    }

    // Validate authentication
    if (config.authentication) {
      if (!config.authentication.client || !config.clients?.[config.authentication.client]) {
        errors.push('Authentication client must reference a valid client configuration');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}