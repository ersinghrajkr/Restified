/**
 * Multi-Client Example
 * 
 * This example demonstrates how to use multiple HTTP clients that were
 * configured in the global setup. Shows real-world patterns for testing
 * multiple services with shared authentication and configuration.
 */

import { restified } from '../../src';
import { GlobalTestUtils } from '../setup/test-utils';

describe('Multi-Client Integration Tests', function() {
  this.timeout(10000);

  it('should use pre-configured API client with global authentication', async function() {
    GlobalTestUtils.logTestProgress('Multi-Client', 'API Client Test');

    // Use the pre-configured API client (no setup needed!)
    // Common headers are already included in the client configuration
    const userResponse = await restified
      .given()
        .useClient('api')
        .header('Authorization', `Bearer {{globalAuthToken}}`)
      .when()
        .get('/users/{{globalUserId}}')
        .execute();

    await userResponse
      .statusCode(200)
      .jsonPath('$.id', restified.getVariable('globalUserId'))
      .jsonPath('$.email', restified.getVariable('globalUserEmail'))
      .extract('$.company.name', 'userCompany')
      .execute();

    console.log('🏢 User company:', restified.getVariable('userCompany'));
  });

  it('should use testing utilities client with global config', async function() {
    GlobalTestUtils.logTestProgress('Multi-Client', 'Test Utils Client');

    // Use the pre-configured test utilities client
    // Common headers are already included in the client configuration
    const validationResponse = await restified
      .given()
        .useClient('testUtils')
        .header('X-Global-Auth-Token', '{{globalAuthToken}}')
      .when()
        .get('/headers')
        .execute();

    await validationResponse
      .statusCode(200)
      .jsonPath('$.headers.X-Test-Suite', restified.getVariable('testSuite'))
      .jsonPath('$.headers.X-Environment', restified.getVariable('testEnvironment'))
      .custom((response) => {
        return response.data.headers['X-Global-Auth-Token'] === restified.getVariable('globalAuthToken');
      }, 'Should have correct global auth token in headers')
      .execute();
  });

  it('should demonstrate cross-service workflow using global data', async function() {
    if (!GlobalTestUtils.shouldRunIntegrationTests()) {
      console.log('⏭️  Skipping integration test');
      return;
    }

    GlobalTestUtils.logTestProgress('Multi-Client', 'Cross-Service Workflow');

    // Step 1: Use API service to get additional user data
    // Common headers are already included in the client configuration
    const userResponse = await restified
      .given()
        .useClient('api')
      .when()
        .get('/users/2')
        .execute();

    await userResponse
      .statusCode(200)
      .extract('$.name', 'workflowUserName')
      .extract('$.website', 'workflowWebsite')
      .execute();

    // Step 2: Use extracted data with test utilities service
    // Common headers are already included in the client configuration
    const workflowResponse = await restified
      .given()
        .useClient('testUtils')
      .when()
        .post('/post', {
          message: `User {{workflowUserName}} from {{workflowWebsite}}`,
          globalUser: '{{globalUserEmail}}',
          environment: '{{testEnvironment}}',
          timestamp: new Date().toISOString()
        })
        .execute();

    await workflowResponse
      .statusCode(200)
      .jsonPath('$.json.globalUser', restified.getVariable('globalUserEmail'))
      .jsonPath('$.json.environment', restified.getVariable('testEnvironment'))
      .execute();

    console.log('✅ Cross-service workflow completed successfully');
  });

  it('should handle service errors with global error patterns', async function() {
    GlobalTestUtils.logTestProgress('Multi-Client', 'Error Handling');

    // Test API service 404 error
    // Common headers are already included in the client configuration
    const apiErrorResponse = await restified
      .given()
        .useClient('api')
      .when()
        .get('/users/99999')
        .execute();

    await apiErrorResponse
      .statusCode(404)
      .execute();

    // Test utilities service 500 error
    // Common headers are already included in the client configuration
    const utilsErrorResponse = await restified
      .given()
        .useClient('testUtils')
      .when()
        .get('/status/500')
        .execute();

    await utilsErrorResponse
      .statusCode(500)
      .execute();

    console.log('✅ Error handling validated across all services');
  });

  it('should demonstrate environment-aware testing', async function() {
    GlobalTestUtils.logTestProgress('Multi-Client', 'Environment Testing');

    const environment = restified.getVariable('testEnvironment');
    const apiVersion = restified.getVariable('apiVersion');

    // Test shows how same test adapts to different environments
    const environmentResponse = await restified
      .given()
        .useClient('api')
        .header('X-Environment', environment)
        .header('X-API-Version', apiVersion)
        .header('X-Global-User', '{{globalUserEmail}}')
      .when()
        .get('/posts/1')
        .execute();

    await environmentResponse
      .statusCode(200)
      .jsonPath('$.id', 1)
      .custom((response) => {
        const hasTitle = response.data.hasOwnProperty('title');
        const hasBody = response.data.hasOwnProperty('body');
        return hasTitle && hasBody;
      }, 'Response should have expected structure for all environments')
      .execute();

    console.log(`✅ Environment-specific test completed for: ${environment}`);
  });

  // No individual cleanup needed - global teardown handles it
});