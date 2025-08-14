import { expect } from 'chai';
import { restified } from '../../src/index';

describe('Basic API Integration Tests', function() {
  this.timeout(10000);

  afterEach(async function() {
    await restified.cleanup();
  });

  describe('JSONPlaceholder API Tests', function() {
    it('should get all posts', async function() {
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get('/posts')
          .execute();

      await response
        .statusCode(200)
        .header('content-type')
        .jsonPath('$[0].id')
        .execute();
    });

    it('should get a specific post', async function() {
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get('/posts/1')
          .execute();

      await response
        .statusCode(200)
        .jsonPath('$.id', 1)
        .jsonPath('$.userId', 1)
        .execute();
    });

    it('should create a new post', async function() {
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
          .contentType('application/json')
        .when()
          .post('/posts', {
            title: 'Test Post',
            body: 'This is a test post created by Restified',
            userId: 1
          })
          .execute();

      await response
        .statusCode(201)
        .jsonPath('$.title', 'Test Post')
        .jsonPath('$.userId', 1)
        .extract('$.id', 'newPostId')
        .execute();

      // Verify the extracted variable
      expect(restified.getVariable('newPostId')).to.be.a('number');
    });
  });

  describe('Variable Resolution', function() {
    it('should resolve variables in requests', async function() {
      restified.setGlobalVariable('userId', 1);
      restified.setLocalVariable('postTitle', 'Variable Test Post');

      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
          .contentType('application/json')
        .when()
          .post('/posts', {
            title: '{{postTitle}}',
            body: 'Post for user {{userId}}',
            userId: '{{userId}}'
          })
          .execute();

      await response
        .statusCode(201)
        .jsonPath('$.title', 'Variable Test Post')
        .jsonPath('$.body', 'Post for user 1')
        .execute();
    });
  });

  describe('Authentication Tests', function() {
    it('should handle bearer token authentication', async function() {
      const response = await restified
        .given()
          .baseURL('https://httpbin.org')
          .bearerToken('test-token-123')
        .when()
          .get('/bearer')
          .execute();

      await response
        .statusCode(200)
        .jsonPath('$.authenticated', true)
        .jsonPath('$.token', 'test-token-123')
        .execute();
    });

    it('should handle basic authentication', async function() {
      const response = await restified
        .given()
          .baseURL('https://httpbin.org')
          .basicAuth('testuser', 'testpass')
        .when()
          .get('/basic-auth/testuser/testpass')
          .execute();

      await response
        .statusCode(200)
        .jsonPath('$.authenticated', true)
        .jsonPath('$.user', 'testuser')
        .execute();
    });
  });
});