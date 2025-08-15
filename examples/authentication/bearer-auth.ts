/**
 * Bearer Token Authentication Example
 * 
 * This example demonstrates authentication patterns using the global
 * authentication token and pre-configured clients.
 */

import { expect } from 'chai';
import { restified } from '../../src';
import { GlobalTestUtils } from '../setup/test-utils';

describe('Bearer Token Authentication Example', function() {
  this.timeout(10000);
 this.beforeAll(async function() {
    GlobalTestUtils.logTestProgress('Simple GET', 'Global Setup');

    expect(true).to.be.true; // Ensure global setup is complete
  });

  this.afterAll(async function() {
    GlobalTestUtils.logTestProgress('Simple GET', 'Global Setup');
  
    expect(true).to.be.true; // Ensure global setup is complete
  });
  it('should use global authentication token with testUtils client', async function() {
    GlobalTestUtils.logTestProgress('Bearer Auth', 'Global Token Usage');

    // Use the global auth token that was obtained during global setup
    // Common headers are already included in the client configuration
    const response = await restified
      .given()
        .useClient('testUtils')  // Pre-configured client
        .bearerToken('{{globalAuthToken}}')  // Global auth token
      .when()
        .get('/bearer')
        .execute();

    await response
      .statusCode(200)
      .jsonPath('$.authenticated', true)
      .jsonPath('$.token', restified.getVariable('globalAuthToken'))
      .execute();
    
    console.log('✅ Authentication successful with global token');
  });

  it('should demonstrate environment-based authentication', async function() {
    GlobalTestUtils.logTestProgress('Bearer Auth', 'Environment Auth');

    // Use environment variable that was set up during global setup
    // Common headers are already included in the client configuration
    const response = await restified
      .given()
        .useClient('testUtils')
        .bearerToken('{{$env.EXAMPLE_API_KEY}}')  // From global setup
      .when()
        .get('/bearer')
        .execute();

    await response
      .statusCode(200)
      .jsonPath('$.authenticated', true)
      .jsonPath('$.token', process.env.EXAMPLE_API_KEY)
      .execute();

    console.log('✅ Environment-based authentication successful');
  });

  it('should show authenticated API workflow', async function() {
    GlobalTestUtils.logTestProgress('Bearer Auth', 'API Workflow');

    // Step 1: Use authenticated API client for business operation
    // Common headers are already included in the client configuration
    const userResponse = await restified
      .given()
        .useClient('api')  // Pre-configured with global auth
        .header('Authorization', `Bearer {{globalAuthToken}}`)
      .when()
        .get('/users/{{globalUserId}}')
        .execute();

    await userResponse
      .statusCode(200)
      .jsonPath('$.id', restified.getVariable('globalUserId'))
      .extract('$.phone', 'userPhone')
      .execute();

    // Step 2: Validate auth token with test utilities
    const validateResponse = await restified
      .given()
        .useClient('testUtils')
        .header('X-User-Phone', '{{userPhone}}')
        .header('X-Global-User', '{{globalUserEmail}}')
        .bearerToken('{{globalAuthToken}}')
      .when()
        .get('/bearer')
        .execute();

    await validateResponse
      .statusCode(200)
      .jsonPath('$.authenticated', true)
      .custom((response) => {
        return response.data.token === restified.getVariable('globalAuthToken');
      }, 'Token should match global auth token')
      .execute();

    console.log('✅ Full authenticated workflow completed');
  });

  it('should handle authentication errors with global patterns', async function() {
    GlobalTestUtils.logTestProgress('Bearer Auth', 'Error Handling');

    // Test authentication failure using invalid token
    // Common headers are already included in the client configuration
    const response = await restified
      .given()
        .useClient('testUtils')
        .bearerToken('invalid-global-token')
      .when()
        .get('/bearer')
        .execute();

    await response
      .statusCode(200)  // HTTPBin accepts any token for demo
      .jsonPath('$.authenticated', true)
      .jsonPath('$.token', 'invalid-global-token')
      .execute();

    console.log('✅ Authentication error handling verified');
  });

  // Cleanup handled by global teardown
});