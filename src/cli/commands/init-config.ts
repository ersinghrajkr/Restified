/**
 * CLI Command: Initialize Configuration
 * 
 * Generate restified.config.ts file for users to customize
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export const initConfigCommand = new Command('init-config')
  .description('Generate restified.config.ts configuration file')
  .option('-f, --force', 'Overwrite existing config file')
  .option('--type <type>', 'Config file type (ts|js|json)', 'ts')
  .action(async (options) => {
    console.log(chalk.cyan('\n🚀 === Restified Configuration Generator ===\n'));

    try {
      const projectRoot = process.cwd();
      const configFileName = `restified.config.${options.type}`;
      const configPath = path.join(projectRoot, configFileName);

      // Check if config already exists
      try {
        await fs.promises.access(configPath);
        if (!options.force) {
          console.log(chalk.yellow(`⚠️  Configuration file already exists: ${configFileName}`));
          console.log(chalk.white('💡 Use --force to overwrite or choose a different type'));
          console.log(chalk.gray('   Example: restifiedts init-config --type js --force'));
          return;
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error; // Re-throw if it's not a "file not found" error
        }
        // File doesn't exist, which is what we want for new creation
      }

      // Generate config content based on type
      let configContent = '';
      
      if (options.type === 'ts') {
        configContent = generateTypeScriptConfig();
      } else if (options.type === 'js') {
        configContent = generateJavaScriptConfig();
      } else if (options.type === 'json') {
        configContent = generateJSONConfig();
      } else {
        console.log(chalk.red('❌ Invalid config type. Use: ts, js, or json'));
        return;
      }

      // Write config file
      await fs.promises.writeFile(configPath, configContent, 'utf8');

      console.log(chalk.green('✅ Configuration file generated successfully!'));
      console.log(chalk.white('📁 Location:'), chalk.cyan(configPath));
      console.log(chalk.white('\n🎯 What you can customize:'));
      console.log(chalk.gray('   • HTTP client configurations (URLs, timeouts, headers)'));
      console.log(chalk.gray('   • Authentication settings and token extraction'));
      console.log(chalk.gray('   • Global variables and environment variables'));
      console.log(chalk.gray('   • Reporting preferences'));
      console.log(chalk.gray('   • Health check endpoints'));

      console.log(chalk.white('\n🚀 Next steps:'));
      console.log(chalk.cyan('   1. Edit the configuration file to match your API'));
      console.log(chalk.cyan('   2. Run: npm run examples'));
      console.log(chalk.cyan('   3. Generate reports: npm run report'));

    } catch (error) {
      console.log(chalk.red('\n❌ Error generating config file:'), error.message);
      throw error; // Re-throw instead of process.exit
    }
  });

function generateTypeScriptConfig(): string {
  return `/**
 * Restified Configuration File
 * 
 * Customize your testing environment, HTTP clients, authentication,
 * global variables, and reporting settings here.
 */

import { RestifiedConfig } from './src/RestifiedTypes';

const config: RestifiedConfig = {
  // Test Environment Configuration
  environment: {
    name: process.env.TEST_ENV || 'development',
    timeout: 30000,
    retries: 3,
    enableLogging: true
  },

  // HTTP Clients Configuration
  clients: {
    // Primary API client for your main service
    api: {
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': 'v1'
      }
    },

    // Testing utilities client
    testUtils: {
      baseURL: 'https://httpbin.org',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },

    // Authentication service client
    auth: {
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  },

  // Global Headers (applied to all requests)
  globalHeaders: {
    'X-Test-Suite': 'my-api-tests',
    'X-Environment': process.env.TEST_ENV || 'development'
  },

  // Authentication Configuration
  authentication: {
    // Customize this endpoint for your real authentication
    endpoint: '/users/1',
    method: 'GET',
    client: 'auth',
    extractors: {
      token: '$.name',        // JSONPath to extract auth token
      userEmail: '$.email',   // JSONPath to extract user email
      userId: '$.id'          // JSONPath to extract user ID
    },
    fallback: {
      token: 'fallback-token-123',
      userEmail: 'test@example.com',
      userId: 1
    },
    // Automatically apply auth token to these clients after authentication
    autoApplyToClients: 'all',        // 'all' or ['api', 'testUtils'] - specific clients
    authHeaderName: 'Authorization'   // Header name for auth token (default: 'Authorization')
  },

  // Global Variables (available in all tests as {{variableName}})
  globalVariables: {
    // Environment settings
    testEnvironment: process.env.TEST_ENV || 'development',
    apiVersion: 'v1',
    testSuite: 'my-api-tests',
    
    // Test configuration
    defaultTimeout: 10000,
    maxRetries: 3,
    enableLogging: true,

    // Feature flags
    runIntegrationTests: true
  },

  // Environment Variables Setup
  environmentVariables: {
    API_KEY: process.env.API_KEY || 'demo-api-key-12345',
    ENVIRONMENT: process.env.ENVIRONMENT || 'test',
    VERSION: '1.0.0'
  },

  // Reporting Configuration
  reporting: {
    enabled: true,
    outputDir: 'reports',
    formats: ['html', 'json'],
    openAfterGeneration: false,
    includeRequestResponse: true,
    includeScreenshots: true
  },

  // Service Health Checks
  healthChecks: [
    {
      name: 'API Service',
      client: 'api',
      endpoint: '/posts/1',
      expectedStatus: 200
    }
  ]
};

export default config;
`;
}

function generateJavaScriptConfig(): string {
  return `/**
 * Restified Configuration File
 */

const config = {
  // Test Environment Configuration
  environment: {
    name: process.env.TEST_ENV || 'development',
    timeout: 30000,
    retries: 3,
    enableLogging: true
  },

  // HTTP Clients Configuration
  clients: {
    api: {
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': 'v1'
      }
    },
    testUtils: {
      baseURL: 'https://httpbin.org',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  },

  // Global Headers
  globalHeaders: {
    'X-Test-Suite': 'my-api-tests',
    'X-Environment': process.env.TEST_ENV || 'development'
  },

  // Authentication Configuration
  authentication: {
    endpoint: '/users/1',
    method: 'GET',
    client: 'api',
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
  },

  // Global Variables
  globalVariables: {
    testEnvironment: process.env.TEST_ENV || 'development',
    apiVersion: 'v1',
    testSuite: 'my-api-tests',
    defaultTimeout: 10000,
    maxRetries: 3,
    enableLogging: true,
    runIntegrationTests: true
  },

  // Reporting Configuration
  reporting: {
    enabled: true,
    outputDir: 'reports',
    formats: ['html', 'json'],
    openAfterGeneration: false,
    includeRequestResponse: true,
    includeScreenshots: true
  },

  // Health Checks
  healthChecks: [
    {
      name: 'API Service',
      client: 'api',
      endpoint: '/posts/1',
      expectedStatus: 200
    }
  ]
};

module.exports = config;
`;
}

function generateJSONConfig(): string {
  return JSON.stringify({
    environment: {
      name: "development",
      timeout: 30000,
      retries: 3,
      enableLogging: true
    },
    clients: {
      api: {
        baseURL: "https://jsonplaceholder.typicode.com",
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-Version": "v1"
        }
      },
      testUtils: {
        baseURL: "https://httpbin.org",
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    },
    globalHeaders: {
      "X-Test-Suite": "my-api-tests",
      "X-Environment": "development"
    },
    authentication: {
      endpoint: "/users/1",
      method: "GET",
      client: "api",
      extractors: {
        token: "$.name",
        userEmail: "$.email",
        userId: "$.id"
      },
      fallback: {
        token: "fallback-token-123",
        userEmail: "test@example.com",
        userId: 1
      }
    },
    globalVariables: {
      testEnvironment: "development",
      apiVersion: "v1",
      testSuite: "my-api-tests",
      defaultTimeout: 10000,
      maxRetries: 3,
      enableLogging: true,
      runIntegrationTests: true
    },
    reporting: {
      enabled: true,
      outputDir: "reports",
      formats: ["html", "json"],
      openAfterGeneration: false,
      includeRequestResponse: true,
      includeScreenshots: true
    },
    healthChecks: [
      {
        name: "API Service",
        client: "api",
        endpoint: "/posts/1",
        expectedStatus: 200
      }
    ]
  }, null, 2);
}