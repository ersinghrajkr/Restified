/**
 * Configuration Loader
 * 
 * Enterprise configuration loading with environment support
 */

import * as fs from 'fs';
import * as path from 'path';
import { RestifiedConfig } from 'restifiedts';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: RestifiedConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public async loadConfig(): Promise<RestifiedConfig> {
    if (this.config) {
      return this.config;
    }

    // Try to load from restified.config.ts
    const configPath = path.resolve(process.cwd(), 'restified.config.ts');
    
    if (fs.existsSync(configPath)) {
      console.log(`📋 Loading configuration from: ${path.relative(process.cwd(), configPath)}`);
      
      // Use require to load the TypeScript config
      delete require.cache[require.resolve(configPath)];
      const configModule = require(configPath);
      this.config = configModule.default || configModule;
      
      return this.config;
    }

    // Fallback to default configuration
    console.log('📋 Using default configuration');
    this.config = this.getDefaultConfig();
    return this.config;
  }

  private getDefaultConfig(): RestifiedConfig {
    return {
      environment: {
        name: 'development',
        timeout: 30000,
        retries: 3,
        enableLogging: true
      },
      clients: {
        api: {
          baseURL: 'https://jsonplaceholder.typicode.com',
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      },
      globalHeaders: {
        'X-Test-Suite': 'restifiedts-tests',
        'X-Environment': 'development'
      },
      reporting: {
        enabled: true,
        outputDir: 'reports',
        formats: ['html', 'json']
      }
    };
  }
}
