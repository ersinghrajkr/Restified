/**
 * Simple GET Request Example
 * 
 * This example demonstrates the most basic usage of Restified using 
 * pre-configured clients from global setup.
 */

import { restified } from '../../src';
import { GlobalTestUtils } from '../setup/test-utils';

// Import mochawesome addContext for manual context addition
let addContext: any = null;
try {
  addContext = require('mochawesome/addContext');
} catch (error) {
  // mochawesome not available, context capture will be disabled
}

describe('Simple GET Request Example', function() {
  this.timeout(10000);

  it('should successfully get a post using pre-configured API client', async function() {
    GlobalTestUtils.logTestProgress('Simple GET', 'Basic API Request');

    // 📊 Add test context for enterprise reporting using mochawesome/addContext
    if (addContext) {
      addContext(this, {
        title: '🎯 Test Objective',
        value: 'Verify basic GET request functionality with enterprise headers and automatic context capture'
      });
    }

    // Use the pre-configured 'api' client from global setup
    // Common headers are already included in the client configuration
    const response = await restified
      .given()
        .useClient('api')  // Using global client with pre-configured headers
      .when()
        .get('/posts/1')
        .execute();

    // Note: RestifiedTS now automatically captures request/response details
    // in the .execute() method, but we can still add manual context if needed
    
    // Get response details for additional manual context (optional)
    const httpResponse = response.getResponse();
    
    // 📊 Add supplementary test information
    if (addContext) {
      addContext(this, {
        title: '📋 Manual Test Context',
        value: {
          testType: 'Basic GET Request',
          expectedBehavior: 'Should return post data with ID 1',
          actualResult: {
            status: httpResponse.status,
            responseTime: `${httpResponse.responseTime}ms`,
            dataReceived: !!httpResponse.data
          },
          notes: 'This test demonstrates RestifiedTS automatic context capture'
        }
      });
    }

    await response
      .statusCode(200)
      .header('content-type')
      .jsonPath('$.id', 1)
      .jsonPath('$.title')
      .execute();
  });

  it('should verify post has required fields using global configuration', async function() {
    GlobalTestUtils.logTestProgress('Simple GET', 'Field Validation');

    // Use global client and add environment-specific headers
    const response = await restified
      .given()
        .useClient('api')  // Pre-configured API client
        .header('X-Test-Environment', '{{testEnvironment}}')
        .header('X-Global-User', '{{globalUserEmail}}')
      .when()
        .get('/posts/1')
        .execute();

    await response
      .statusCode(200)
      .jsonPath('$.userId')
      .jsonPath('$.title')
      .jsonPath('$.body')
      .custom((response) => {
        return typeof response.data.id === 'number';
      }, 'Post ID should be a number')
      .custom((response) => {
        // Verify we're running in the expected environment
        return restified.getVariable('testEnvironment') === 'development';
      }, 'Should be running in expected test environment')
      .execute();
  });

  // Cleanup handled by global teardown
});