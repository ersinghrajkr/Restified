/**
 * TestProject API Tests
 * 
 * Comprehensive API testing using RestifiedTS enterprise configuration
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('TestProject API Tests', function() {
  this.timeout(30000);

  afterAll(async function() {
    await restified.cleanup();
  });

  describe('Basic API Operations', function() {
    it('should get user data from API', async function() {
      const response = await restified
        .given()
          .useClient('api')  // Pre-configured with enterprise headers and auth
        .when()
          .get('/users/1')
          .execute();

      await response
        .statusCode(200)
        .header('Content-Type', /application\/json/)
        .jsonPath('$.id', 1)
        .jsonPath('$.name', (name) => typeof name === 'string')
        .jsonPath('$.email', (email) => email.includes('@'))
        .execute();
    });

    it('should create new user', async function() {
      const userData = {
        name: '{{$faker.person.fullName}}',
        email: '{{$faker.internet.email}}',
        username: '{{$faker.internet.userName}}'
      };

      const response = await restified
        .given()
          .useClient('api')
          .variable('userData', userData)
        .when()
          .post('/users')
          .json('{{userData}}')
          .execute();

      await response
        .statusCode(201)
        .jsonPath('$.id', (id) => typeof id === 'number')
        .extract('$.id', 'createdUserId')
        .execute();
    });

    it('should update user data', async function() {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await restified
        .given()
          .useClient('api')
        .when()
          .put('/users/1')
          .json(updateData)
          .execute();

      await response
        .statusCode(200)
        .jsonPath('$.name', 'Updated Name')
        .jsonPath('$.email', 'updated@example.com')
        .execute();
    });

    it('should handle error responses gracefully', async function() {
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/999999')
          .execute();

      await response
        .statusCode(404)
        .execute();
    });
  });

  describe('Enterprise Features', function() {
    it('should include enterprise headers in all requests', async function() {
      const response = await restified
        .given()
          .useClient('testUtils')
        .when()
          .get('/headers')
          .execute();

      await response
        .statusCode(200)
        .jsonPath('$.headers.X-Test-Suite', 'testproject-api-tests')
        .jsonPath('$.headers.X-Environment', 'development')
        .jsonPath('$.headers.X-Trace-ID', (traceId) => traceId !== undefined)
        .execute();
    });

    it('should use automatic authentication', async function() {
      // Auth token automatically applied by global setup
      const response = await restified
        .given()
          .useClient('api')
        .when()
          .get('/users/1')
          .execute();

      await response
        .statusCode(200)
        .execute();

      // Verify auth token was included (visible in logs with enterprise headers)
      expect(restified.getVariable('globalAuthToken')).to.exist;
    });
  });
});
