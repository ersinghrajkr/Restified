/**
 * Global Setup for TestProject Tests
 * 
 * Enterprise-grade global setup with automatic configuration loading
 */

import { restified } from 'restifiedts';
import { ConfigLoader } from '../config/ConfigLoader';
import { RestifiedConfig } from 'restifiedts';

let config: RestifiedConfig;

// Global setup - runs once before all test suites
before(async function() {
  this.timeout(30000);
  
  console.log('\n🚀 === TestProject GLOBAL SETUP ===');

  // Load enterprise configuration
  console.log('📋 Loading configuration...');
  const configLoader = ConfigLoader.getInstance();
  config = await configLoader.loadConfig();
  console.log('✅ Configuration loaded');

  // Setup HTTP clients
  console.log('🔧 Setting up HTTP clients...');
  if (config.clients) {
    for (const [clientName, clientConfig] of Object.entries(config.clients)) {
      const headers = { ...config.globalHeaders, ...clientConfig.headers };
      restified.createClient(clientName, { ...clientConfig, headers });
    }
    console.log(`✅ ${Object.keys(config.clients).length} HTTP clients configured`);
  }

  // Perform authentication
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

      // Apply auth token to clients
      const authToken = restified.getVariable('globalAuthToken');
      if (authToken && config.authentication.autoApplyToClients) {
        restified.addAuthTokenToAllClients(authToken, config.authentication.authHeaderName || 'Authorization');
        console.log('✅ Authentication successful - Auth token added to all clients');
      }
    } catch (error) {
      console.log('⚠️  Authentication failed, using fallback values');
      if (config.authentication.fallback) {
        restified.setGlobalVariable('globalAuthToken', config.authentication.fallback.token);
        restified.setGlobalVariable('globalUserEmail', config.authentication.fallback.userEmail);
        restified.setGlobalVariable('globalUserId', config.authentication.fallback.userId);
      }
    }
  }

  // Set global variables
  if (config.globalVariables) {
    console.log('📋 Setting up global variables...');
    restified.setGlobalVariables(config.globalVariables);
    console.log(`✅ ${Object.keys(config.globalVariables).length} global variables configured`);
  }

  console.log('🎯 === GLOBAL SETUP COMPLETE ===\n');
});

// Global teardown - runs once after all test suites
after(async function() {
  this.timeout(10000);
  
  console.log('\n🧹 === TestProject GLOBAL TEARDOWN ===');
  
  // Cleanup
  console.log('🧽 Performing cleanup...');
  await restified.cleanup();
  
  console.log('✅ === GLOBAL TEARDOWN COMPLETE ===\n');
});
