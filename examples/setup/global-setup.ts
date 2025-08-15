/**
 * Global Setup for All Examples
 * 
 * This file loads configuration from restified.config.ts and sets up
 * the testing environment based on user preferences.
 */

import { restified } from '../../src';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigLoader } from '../../src/core/config/ConfigLoader';
import { RestifiedConfig } from '../../src/RestifiedTypes';
import { GlobalTestUtils } from './test-utils';

// Global test metrics and reporting configuration
interface TestMetrics {
  startTime: Date;
  endTime?: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  suiteExecutions: { name: string; duration: number; status: string }[];
}

const globalTestMetrics: TestMetrics = {
  startTime: new Date(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  suiteExecutions: []
};

// Auto-detect if user wants reporting (simplified for end users)
const isReportingEnabled = process.argv.includes('--reporter') || 
                          process.env.GENERATE_REPORTS === 'true' ||
                          process.argv.some(arg => arg.includes('mochawesome'));

// Global configuration
let config: RestifiedConfig;

// Global setup - runs once before all test suites
before('Before', async function() {
  this.timeout(30000); // Allow time for setup
  
  console.log('\n🚀 === GLOBAL SETUP: Initializing Restified ===');

  // Step 1: Load configuration
  console.log('📋 Loading configuration...');
  try {
    const configLoader = ConfigLoader.getInstance();
    config = await configLoader.loadConfig();
    
    // Validate configuration
    const validation = configLoader.validateConfig(config);
    if (!validation.valid) {
      console.log('⚠️  Configuration validation warnings:');
      validation.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('✅ Configuration loaded');
  } catch (error) {
    console.log('⚠️  Error loading configuration:', error.message);
    console.log('📋 Using default configuration');
    config = {} as RestifiedConfig; // Will use defaults
  }

  // Step 2: Setup reporting infrastructure (only when needed)
  if (isReportingEnabled && config.reporting?.enabled !== false) {
    console.log('📊 Setting up reporting infrastructure...');
    
    const reportsDir = path.join(process.cwd(), config.reporting?.outputDir || 'reports');
    
    try {
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const reportMetadata = {
        executionId: `restified-${Date.now()}`,
        timestamp: new Date().toISOString(),
        environment: config.environment?.name || 'development',
        framework: 'Restified v1.0.0',
        reportType: 'User-Generated Report'
      };

      fs.writeFileSync(
        path.join(reportsDir, 'report-info.json'),
        JSON.stringify(reportMetadata, null, 2)
      );

      console.log('✅ Reporting ready');
      console.log(`   📁 Reports will be saved to: ${reportsDir}/`);
    } catch (error) {
      console.log('⚠️  Warning: Could not setup reporting:', error.message);
    }
  }

  // Step 3: Configure HTTP clients from config
  console.log('🔧 Setting up HTTP clients...');
  
  if (config.clients) {
    for (const [clientName, clientConfig] of Object.entries(config.clients)) {
      // Merge global headers with client-specific headers
      const headers = {
        ...config.globalHeaders,
        ...clientConfig.headers
      };

      restified.createClient(clientName, {
        ...clientConfig,
        headers
      });
    }
    console.log(`✅ ${Object.keys(config.clients).length} HTTP clients configured`);
  } else {
    console.log('⚠️  No HTTP clients configured');
  }

  // Step 4: Perform authentication
  if (config.authentication) {
    console.log('🔐 Performing authentication...');
    
    try {
      const authResponse = await restified
        .given()
          .useClient(config.authentication.client)
        .when()
          [config.authentication.method.toLowerCase() as 'get'](config.authentication.endpoint)
          .execute();

      await authResponse
        .statusCode(200)
        .extract(config.authentication.extractors.token, 'globalAuthToken')
        .extract(config.authentication.extractors.userEmail, 'globalUserEmail')
        .extract(config.authentication.extractors.userId, 'globalUserId')
        .execute();

      // Automatically add auth token to configured HTTP clients
      const authToken = restified.getVariable('globalAuthToken');
      if (authToken) {
        const authHeaderName = config.authentication.authHeaderName || 'Authorization';
        const autoApplyToClients = config.authentication.autoApplyToClients || 'all';
        
        if (autoApplyToClients === 'all') {
          restified.addAuthTokenToAllClients(authToken, authHeaderName);
          console.log('✅ Authentication successful - Auth token added to all clients');
        } else if (Array.isArray(autoApplyToClients)) {
          for (const clientName of autoApplyToClients) {
            const headerValue = authHeaderName === 'Authorization' ? `Bearer ${authToken}` : authToken;
            restified.updateClientHeaders(clientName, { [authHeaderName]: headerValue });
          }
          console.log(`✅ Authentication successful - Auth token added to clients: ${autoApplyToClients.join(', ')}`);
        }
        
        console.log('   📧 User Email:', restified.getVariable('globalUserEmail'));
        console.log('   🆔 User ID:', restified.getVariable('globalUserId'));
        console.log(`   🔐 Auth token automatically applied using header: ${authHeaderName}`);
      }
    } catch (error) {
      console.log('⚠️  Authentication failed, using fallback values');
      if (config.authentication.fallback) {
        restified.setGlobalVariable('globalAuthToken', config.authentication.fallback.token);
        restified.setGlobalVariable('globalUserEmail', config.authentication.fallback.userEmail);
        restified.setGlobalVariable('globalUserId', config.authentication.fallback.userId);
        
        // Add fallback auth token to configured clients
        const authHeaderName = config.authentication.authHeaderName || 'Authorization';
        const autoApplyToClients = config.authentication.autoApplyToClients || 'all';
        
        if (autoApplyToClients === 'all') {
          restified.addAuthTokenToAllClients(config.authentication.fallback.token, authHeaderName);
          console.log('   🔐 Fallback auth token added to all clients');
        } else if (Array.isArray(autoApplyToClients)) {
          for (const clientName of autoApplyToClients) {
            const headerValue = authHeaderName === 'Authorization' 
              ? `Bearer ${config.authentication.fallback.token}` 
              : config.authentication.fallback.token;
            restified.updateClientHeaders(clientName, { [authHeaderName]: headerValue });
          }
          console.log(`   🔐 Fallback auth token added to clients: ${autoApplyToClients.join(', ')}`);
        }
      }
    }
  }

  // Step 5: Set up global variables from config
  if (config.globalVariables) {
    console.log('📋 Setting up global variables...');
    restified.setGlobalVariables(config.globalVariables);
    console.log(`✅ ${Object.keys(config.globalVariables).length} global variables configured`);
  }

  // Step 6: Set up environment variables from config
  if (config.environmentVariables) {
    for (const [key, value] of Object.entries(config.environmentVariables)) {
      process.env[key] = value;
    }
    console.log(`✅ ${Object.keys(config.environmentVariables).length} environment variables set`);
  }

  // Step 7: Verify connectivity with health checks
  if (config.healthChecks && config.healthChecks.length > 0) {
    console.log('🔍 Verifying service connectivity...');
    
    for (const healthCheck of config.healthChecks) {
      try {
        const response = await restified
          .given()
            .useClient(healthCheck.client)
          .when()
            .get(healthCheck.endpoint)
            .execute();

        await response.statusCode(healthCheck.expectedStatus).execute();
        console.log(`   ✅ ${healthCheck.name}: OK`);
      } catch (error) {
        console.log(`   ⚠️  ${healthCheck.name}: Failed`);
      }
    }
  }

  console.log('🎯 === GLOBAL SETUP COMPLETE ===\n');
});

// Global teardown - runs once after all test suites
after('After', async function() {
  this.timeout(10000);
  
  console.log('\n🧹 === GLOBAL TEARDOWN: Cleaning Up ===');
  
  globalTestMetrics.endTime = new Date();
  const executionDuration = globalTestMetrics.endTime.getTime() - globalTestMetrics.startTime.getTime();
  
  // Simple execution summary for end users
  const globalVars = restified.getGlobalVariables();
  console.log('\n📊 Test Execution Summary:');
  console.log(`   ⏱️  Duration: ${(executionDuration / 1000).toFixed(2)}s`);
  console.log(`   🌍 Environment: ${restified.getVariable('testEnvironment')}`);
  console.log(`   🔐 Authentication: ${restified.getVariable('globalUserEmail') ? 'Success' : 'Failed'}`);
  console.log(`   🌐 HTTP Clients: 3 pre-configured (api, testUtils, auth)`);

  // Generate detailed report only when reporting is enabled
  if (isReportingEnabled) {
    console.log('\n📊 Generating detailed test report...');
    
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      
      // Simple summary for end users
      const reportSummary = {
        framework: 'Restified v1.0.0',
        executionTime: new Date().toISOString(),
        duration: `${(executionDuration / 1000).toFixed(2)}s`,
        environment: restified.getVariable('testEnvironment') || 'development',
        authentication: {
          status: restified.getVariable('globalUserEmail') ? 'success' : 'failed',
          user: restified.getVariable('globalUserEmail') || 'unknown'
        },
        clients: {
          api: 'https://jsonplaceholder.typicode.com',
          testUtils: 'https://httpbin.org',
          auth: 'configured'
        },
        variables: {
          global: Object.keys(globalVars).length,
          extracted: restified.getVariable('globalAuthToken') ? 'available' : 'none'
        }
      };

      fs.writeFileSync(
        path.join(reportsDir, 'test-summary.json'),
        JSON.stringify(reportSummary, null, 2)
      );

      console.log('✅ Test report generated');
      console.log(`   📁 Reports directory: ${reportsDir}/`);
      console.log(`   📄 Summary: test-summary.json`);
      console.log(`   🌐 HTML Report: test-report.html (if using Mochawesome)`);
      
    } catch (error) {
      console.log('⚠️  Warning: Could not generate detailed report:', error.message);
    }
  }

  // Perform cleanup
  console.log('\n🧽 Performing cleanup...');
  await restified.cleanup();
  
  console.log('\n✅ === GLOBAL TEARDOWN COMPLETE ===');
  
  if (isReportingEnabled) {
    const reportDir = process.env.REPORT_OUTPUT_DIR || 'reports';
    const reportFile = process.env.REPORT_FILENAME || 'test-report.html';
    console.log(`📊 View your test report: ${reportDir}/${reportFile}`);
  } else {
    console.log('💡 Want a detailed HTML report? Run: npm run report');
  }
  console.log('');
});

// Re-export utilities for backward compatibility
export { GlobalTestUtils };