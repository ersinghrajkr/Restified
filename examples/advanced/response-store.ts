/**
 * Response Store Example
 * 
 * This example demonstrates how to use the Response Store to cache
 * and retrieve HTTP responses using pre-configured clients from global setup.
 */

import { restified } from '../../src';
import { GlobalTestUtils } from '../setup/test-utils';

describe('Response Store Example', function() {
  this.timeout(15000);

  it('should store and retrieve responses using global client', async function() {
    GlobalTestUtils.logTestProgress('Response Store', 'Store and Retrieve');

    // Use pre-configured API client from global setup
    const userResponse = await restified
      .given()
        .useClient('api')  // Global client
              .when()
        .get('/users/{{globalUserId}}')  // Global user ID
        .execute();

    await userResponse
      .statusCode(200)
      .execute();

    // Store the response with a custom key
    restified.storeResponse('user1-data');

    // Later, retrieve the stored response
    const storedResponse = restified.getStoredResponse('user1-data');
    
    // Verify the stored response exists and has expected data
    if (storedResponse) {
      console.log('Retrieved stored response for user:', storedResponse.data.name);
      
      // You can perform additional assertions on stored responses
      await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get('/users/1')
          .execute()
        .then(response => response
          .statusCode(200)
          .custom((response) => {
            return response.data.id === storedResponse.data.id;
          }, 'Current response should match stored response ID')
          .execute()
        );
    }
  });

  it('should handle multiple stored responses', async function() {
    // Store responses for multiple users
    const users = [1, 2, 3];
    
    for (const userId of users) {
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get(`/users/${userId}`)
          .execute();

      await response.statusCode(200).execute();
      
      // Store each response with a unique key
      restified.storeResponse(`user-${userId}`);
    }

    // Retrieve and validate all stored responses
    for (const userId of users) {
      const storedResponse = restified.getStoredResponse(`user-${userId}`);
      
      if (storedResponse) {
        console.log(`User ${userId} stored data:`, {
          id: storedResponse.data.id,
          name: storedResponse.data.name,
          email: storedResponse.data.email
        });

        // Validate stored response data
        if (storedResponse.data.id !== userId) {
          throw new Error(`Stored response ID mismatch for user ${userId}`);
        }
      } else {
        throw new Error(`No stored response found for user ${userId}`);
      }
    }
  });

  it('should compare current response with stored response', async function() {
    // First, get and store user data
    const initialResponse = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/users/1')
        .execute();

    await initialResponse.statusCode(200).execute();
    restified.storeResponse('initial-user-data');

    // Later, get the same data again
    const currentResponse = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/users/1')
        .execute();

    await currentResponse.statusCode(200).execute();

    // Compare with stored response
    const storedResponse = restified.getStoredResponse('initial-user-data');
    
    if (storedResponse) {
      await currentResponse
        .custom((response) => {
          return JSON.stringify(response.data) === JSON.stringify(storedResponse.data);
        }, 'Current response should match stored response')
        .execute();
      
      console.log('✅ Response comparison successful - data is consistent');
    }
  });

  it('should demonstrate response store with POST operations', async function() {
    // Create a new post
    const createResponse = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
        .contentType('application/json')
      .when()
        .post('/posts', {
          title: 'Test Post for Response Store',
          body: 'This post is used to demonstrate response store functionality',
          userId: 1
        })
        .execute();

    await createResponse
      .statusCode(201)
      .extract('$.id', 'createdPostId')
      .execute();

    // Store the creation response
    restified.storeResponse('post-creation');

    // Use stored response data in subsequent tests
    const storedCreation = restified.getStoredResponse('post-creation');
    
    if (storedCreation) {
      console.log('Created post stored with ID:', storedCreation.data.id);
      console.log('Stored post title:', storedCreation.data.title);

      // Verify the stored response contains expected data
      if (!storedCreation.data.title.includes('Test Post')) {
        throw new Error('Stored response does not contain expected title');
      }

      // Use stored response data for validation
      const postId = storedCreation.data.id;
      console.log(`Using stored post ID ${postId} for further operations`);
    }
  });

  it('should handle response store cleanup and management', async function() {
    // Store multiple responses
    const responses = [];
    for (let i = 1; i <= 3; i++) {
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get(`/posts/${i}`)
          .execute();

      await response.statusCode(200).execute();
      restified.storeResponse(`post-${i}`);
      responses.push(`post-${i}`);
    }

    // Verify all responses are stored
    for (const key of responses) {
      const stored = restified.getStoredResponse(key);
      if (!stored) {
        throw new Error(`Response ${key} was not properly stored`);
      }
    }

    console.log('✅ All responses properly stored and retrieved');

    // Response store will be automatically cleaned up in the after hook
    // when restified.cleanup() is called
  });

  // Cleanup handled by global teardown
});