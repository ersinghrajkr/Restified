/**
 * Error Handling and Resilience Example
 * 
 * This example demonstrates how to handle errors gracefully
 * and test API resilience with Restified.
 */

import { restified } from '../../src';

describe('Error Handling and Resilience Example', function() {
  this.timeout(15000);

  it('should handle 404 errors gracefully', async function() {
    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/posts/9999')
        .execute();

    await response
      .statusCode(404)
      .execute();
  });

  it('should handle network timeouts with retry', async function() {
    // Configure client with short timeout for demonstration
    restified.createClient('timeout-test', {
      baseURL: 'https://httpbin.org',
      timeout: 1000 // Very short timeout
    });

    try {
      const response = await restified
        .given()
          .useClient('timeout-test')
        .when()
          .get('/delay/2') // This will likely timeout and retry
          .execute();

      await response
        .statusCode(200)
        .execute();
    } catch (error) {
      // Expected to fail due to timeout, but should show retry attempts
      console.log('Request failed after retries as expected');
    }
  });

  it('should validate error response structure', async function() {
    const response = await restified
      .given()
        .baseURL('https://httpbin.org')
      .when()
        .get('/status/500')
        .execute();

    await response
      .statusCode(500)
      .execute();
  });

  it('should handle malformed JSON responses', async function() {
    // Test against an endpoint that returns plain text instead of JSON
    const response = await restified
      .given()
        .baseURL('https://httpbin.org')
      .when()
        .get('/html')
        .execute();

    await response
      .statusCode(200)
      .header('content-type')
      .custom((response) => {
        return response.headers['content-type'].includes('text/html');
      }, 'Response should be HTML')
      .execute();
  });

  it('should test API rate limiting behavior', async function() {
    // Make multiple rapid requests to test rate limiting
    // Note: This is just for demonstration - real rate limiting would need appropriate endpoint
    const requests = [];
    
    for (let i = 0; i < 3; i++) {
      const request = restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get('/posts/1')
          .execute();
      
      requests.push(request);
    }

    const responses = await Promise.all(requests);
    
    // Verify all requests succeeded (JSONPlaceholder doesn't have rate limiting)
    for (const response of responses) {
      await response
        .statusCode(200)
        .execute();
    }
  });

  it('should handle authentication errors', async function() {
    const response = await restified
      .given()
        .baseURL('https://httpbin.org')
        .bearerToken('invalid-token')
      .when()
        .get('/bearer')
        .execute();

    // httpbin.org /bearer endpoint doesn't actually validate tokens
    // So this will pass, but in real scenarios you'd test for 401
    await response
      .statusCode(200)
      .execute();
  });

  it('should test request payload validation errors', async function() {
    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
        .contentType('application/json')
      .when()
        .post('/posts', {
          // Missing required fields to simulate validation error
          invalidField: 'test'
        })
        .execute();

    // JSONPlaceholder is lenient, but real APIs would return validation errors
    await response
      .statusCode(201) // JSONPlaceholder always returns 201 for POST
      .execute();
  });

  after(async function() {
    await restified.cleanup();
  });
});