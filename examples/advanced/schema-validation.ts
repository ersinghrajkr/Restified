/**
 * Schema Validation Example
 * 
 * This example demonstrates how to use JSON Schema validation with
 * pre-configured clients from global setup.
 */

import { restified } from '../../src';
import { GlobalTestUtils } from '../setup/test-utils';

describe('Schema Validation Example', function() {
  this.timeout(10000);

  const userSchema = {
    type: 'object',
    required: ['id', 'name', 'username', 'email'],
    properties: {
      id: {
        type: 'number'
      },
      name: {
        type: 'string'
      },
      username: {
        type: 'string'
      },
      email: {
        type: 'string',
        format: 'email'
      },
      address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          suite: { type: 'string' },
          city: { type: 'string' },
          zipcode: { type: 'string' },
          geo: {
            type: 'object',
            properties: {
              lat: { type: 'string' },
              lng: { type: 'string' }
            }
          }
        }
      }
    }
  };

  it('should validate user object against JSON schema using global client', async function() {
    GlobalTestUtils.logTestProgress('Schema Validation', 'User Object Validation');

    const response = await restified
      .given()
        .useClient('api')  // Pre-configured global client
              .when()
        .get('/users/{{globalUserId}}')  // Use global user ID
        .execute();

    await response
      .statusCode(200)
      .jsonSchema(userSchema)
      .jsonPath('$.name')
      .jsonPath('$.email')
      .execute();
  });

  it('should validate array of posts against JSON schema', async function() {
    // Define JSON schema for array of posts
    const postsArraySchema = {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'body', 'userId'],
        properties: {
          id: { type: 'number' },
          title: { type: 'string' },
          body: { type: 'string' },
          userId: { type: 'number' }
        }
      },
      minItems: 1,
      maxItems: 100
    };

    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/posts')
        .execute();

    await response
      .statusCode(200)
      .jsonSchema(postsArraySchema)
      .jsonPath('$[0].id')
      .jsonPath('$[0].title')
      .custom((response) => {
        return Array.isArray(response.data) && response.data.length > 0;
      }, 'Response should be a non-empty array')
      .execute();
  });

  it('should handle schema validation failure', async function() {
    const strictUserSchema = {
      type: 'object',
      required: ['id', 'name', 'username', 'email', 'nonExistentField'],
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        nonExistentField: { type: 'string' }
      }
    };

    try {
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get('/users/1')
          .execute();

      await response
        .statusCode(200)
        .jsonSchema(strictUserSchema)
        .execute();

      throw new Error('Should have failed schema validation');
    } catch (error) {
      // Expected to fail due to missing required field
      console.log('Schema validation correctly failed as expected');
    }
  });

  after(async function() {
    await restified.cleanup();
  });
});