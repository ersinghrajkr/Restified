import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { RestifiedConfig } from '../../RestifiedTypes';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: RestifiedConfig = {};
  private configPaths: string[] = [];

  private constructor() {
    this.loadEnvironmentVariables();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  loadConfig(configPath?: string): RestifiedConfig {
    if (configPath) {
      this.configPaths = [configPath];
    } else {
      this.configPaths = this.getDefaultConfigPaths();
    }

    this.config = this.mergeConfigs();
    return this.config;
  }

  getConfig(): RestifiedConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<RestifiedConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  setConfig(config: RestifiedConfig): void {
    this.config = config;
  }

  private getDefaultConfigPaths(): string[] {
    const cwd = process.cwd();
    const environment = process.env.NODE_ENV || process.env.RESTIFIED_ENV || 'development';
    
    return [
      path.join(cwd, 'restified.config.js'),
      path.join(cwd, 'restified.config.ts'),
      path.join(cwd, `restified.config.${environment}.js`),
      path.join(cwd, `restified.config.${environment}.ts`),
      path.join(cwd, 'config', 'default.json'),
      path.join(cwd, 'config', `${environment}.json`)
    ].filter(configPath => fs.existsSync(configPath));
  }

  private mergeConfigs(): RestifiedConfig {
    let mergedConfig: RestifiedConfig = {};

    for (const configPath of this.configPaths) {
      try {
        const config = this.loadConfigFile(configPath);
        mergedConfig = this.deepMerge(mergedConfig, config);
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error);
      }
    }

    // Override with environment variables
    this.applyEnvironmentOverrides(mergedConfig);

    return mergedConfig;
  }

  private loadConfigFile(configPath: string): RestifiedConfig {
    const ext = path.extname(configPath);
    
    if (ext === '.json') {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
    
    if (ext === '.js' || ext === '.ts') {
      delete require.cache[require.resolve(configPath)];
      const module = require(configPath);
      return module.default || module;
    }
    
    throw new Error(`Unsupported config file format: ${ext}`);
  }

  private deepMerge(target: any, source: any): any {
    if (source === null || typeof source !== 'object') {
      return source;
    }

    if (Array.isArray(source)) {
      return [...source];
    }

    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  private applyEnvironmentOverrides(config: RestifiedConfig): void {
    // Override baseURL from environment
    if (process.env.RESTIFIED_BASE_URL) {
      config.baseURL = process.env.RESTIFIED_BASE_URL;
    }

    // Override timeout from environment
    if (process.env.RESTIFIED_TIMEOUT) {
      config.timeout = parseInt(process.env.RESTIFIED_TIMEOUT, 10);
    }

    // Override retries from environment
    if (process.env.RESTIFIED_RETRIES) {
      config.retries = parseInt(process.env.RESTIFIED_RETRIES, 10);
    }

    // Override auth token from environment
    if (process.env.RESTIFIED_AUTH_TOKEN && config.auth) {
      config.auth.token = process.env.RESTIFIED_AUTH_TOKEN;
    }
  }

  private loadEnvironmentVariables(): void {
    const cwd = process.cwd();
    const environment = process.env.NODE_ENV || process.env.RESTIFIED_ENV || 'development';
    
    // Load .env files in order of precedence
    const envFiles = [
      path.join(cwd, '.env.local'),
      path.join(cwd, `.env.${environment}`),
      path.join(cwd, '.env')
    ];

    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        dotenv.config({ path: envFile });
      }
    }
  }

  reset(): void {
    this.config = {};
    this.configPaths = [];
    this.loadEnvironmentVariables();
  }

  dumpConfig(): void {
    console.log('=== Configuration Dump ===');
    console.log('Config Paths:', this.configPaths);
    console.log('Merged Config:', JSON.stringify(this.config, null, 2));
    console.log('Environment Variables:', {
      NODE_ENV: process.env.NODE_ENV,
      RESTIFIED_ENV: process.env.RESTIFIED_ENV,
      RESTIFIED_BASE_URL: process.env.RESTIFIED_BASE_URL,
      RESTIFIED_TIMEOUT: process.env.RESTIFIED_TIMEOUT
    });
    console.log('==========================');
  }
}

export const configManager = ConfigManager.getInstance();