/**
 * POST Request with Variables Example
 * 
 * This example shows how to use variables and data extraction using
 * pre-configured clients from global setup.
 */

import { restified } from '../../src';
import { GlobalTestUtils } from '../setup/test-utils';

describe('POST Request with Variables Example', function() {
  this.timeout(10000);

  beforeEach(function() {
    // Set up test-specific data (global auth data already available from setup)
    restified.setLocalVariable('postTitle', 'My Test Post');
    restified.setLocalVariable('postBody', 'Created using global auth by {{globalUserEmail}}');
  });

  it('should create a post using global client and variables', async function() {
    GlobalTestUtils.logTestProgress('POST Variables', 'Create Post');

    // Use pre-configured API client from global setup
    // Common headers are already included in the client configuration
    const createResponse = await restified
      .given()
        .useClient('api')  // Global client with pre-configured headers
        .header('X-Author', '{{globalUserEmail}}')
      .when()
        .post('/posts', {
          title: '{{postTitle}}',
          body: '{{postBody}}',
          userId: '{{globalUserId}}'  // Using global user ID from auth
        })
        .execute();

    // Verify creation and extract the ID
    await createResponse
      .statusCode(201)
      .jsonPath('$.title', 'My Test Post')
      .jsonPath('$.userId', '1')  // JSONPlaceholder returns userId as string
      .extract('$.id', 'createdPostId')
      .execute();

    console.log('📝 Post created with ID:', restified.getVariable('createdPostId'));
  });

  it('should retrieve post using global client and extracted variables', async function() {
    GlobalTestUtils.logTestProgress('POST Variables', 'Retrieve Post');

    // Use the globalUserId that was set during global authentication
    // Common headers are already included in the client configuration
    const getResponse = await restified
      .given()
        .useClient('api')  // Pre-configured API client
        .header('X-Requested-By', '{{globalUserEmail}}')
      .when()
        .get('/posts/{{globalUserId}}')  // Using global user ID
        .execute();

    await getResponse
      .statusCode(200)
      .jsonPath('$.id', restified.getVariable('globalUserId'))
      .jsonPath('$.userId', restified.getVariable('globalUserId'))
      .jsonPath('$.title')
      .custom((response) => {
        // Verify we can access global variables in custom assertions
        return restified.getVariable('testEnvironment') === 'development';
      }, 'Should have access to global test environment')
      .execute();
  });

  it('should demonstrate cross-client variable usage', async function() {
    GlobalTestUtils.logTestProgress('POST Variables', 'Cross-Client');

    // First, create data using API client
    // Common headers are already included in the client configuration
    const apiResponse = await restified
      .given()
        .useClient('api')
      .when()
        .get('/users/{{globalUserId}}')
        .execute();

    await apiResponse
      .statusCode(200)
      .extract('$.company.catchPhrase', 'companyCatchPhrase')
      .execute();

    // Then use testUtils client to validate the extracted data
    // Common headers are already included in the client configuration
    const testResponse = await restified
      .given()
        .useClient('testUtils')  // Different client from global setup
      .when()
        .post('/post', {
          extractedData: '{{companyCatchPhrase}}',
          globalUser: '{{globalUserEmail}}',
          testSuite: '{{testSuite}}'
        })
        .execute();

    await testResponse
      .statusCode(200)
      .jsonPath('$.json.globalUser', restified.getVariable('globalUserEmail'))
      .jsonPath('$.json.testSuite', restified.getVariable('testSuite'))
      .execute();

    console.log('🌐 Cross-client variable sharing successful');
  });

  // Cleanup handled by global teardown
});