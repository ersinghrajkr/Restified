/**
 * Data-Driven Testing Example
 * 
 * This example demonstrates how to use data-driven testing patterns
 * with Restified and Mocha for testing multiple scenarios.
 */

import { restified } from '../../src';

describe('Data-Driven Testing Example', function() {
  this.timeout(10000);

  const testUsers = [
    { id: 1, expectedName: 'Leanne Graham' },
    { id: 2, expectedName: 'Ervin Howell' },
    { id: 3, expectedName: 'Clementine Bauch' }
  ];

  testUsers.forEach(({ id, expectedName }) => {
    it(`should validate user ${id} has correct name: ${expectedName}`, async function() {
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get(`/users/${id}`)
          .execute();

      await response
        .statusCode(200)
        .jsonPath('$.id', id)
        .jsonPath('$.name', expectedName)
        .execute();
    });
  });

  const postTestData = [
    { userId: 1, expectedPostCount: { min: 10, max: 15 } },
    { userId: 2, expectedPostCount: { min: 8, max: 12 } },
    { userId: 3, expectedPostCount: { min: 5, max: 15 } }
  ];

  postTestData.forEach(({ userId, expectedPostCount }) => {
    it(`should validate user ${userId} has posts within expected range`, async function() {
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get(`/posts?userId=${userId}`)
          .execute();

      await response
        .statusCode(200)
        .custom((response) => {
          const posts = response.data;
          return Array.isArray(posts) && 
                 posts.length >= expectedPostCount.min && 
                 posts.length <= expectedPostCount.max;
        }, `User ${userId} should have ${expectedPostCount.min}-${expectedPostCount.max} posts`)
        .custom((response) => {
          return response.data.every(post => post.userId === userId);
        }, `All posts should belong to user ${userId}`)
        .execute();
    });
  });

  const httpStatusTests = [
    { endpoint: '/posts/1', expectedStatus: 200 },
    { endpoint: '/posts/999', expectedStatus: 404 },
    { endpoint: '/users/1', expectedStatus: 200 },
    { endpoint: '/users/999', expectedStatus: 404 }
  ];

  httpStatusTests.forEach(({ endpoint, expectedStatus }) => {
    it(`should return ${expectedStatus} for ${endpoint}`, async function() {
      const response = await restified
        .given()
          .baseURL('https://jsonplaceholder.typicode.com')
        .when()
          .get(endpoint)
          .execute();

      await response
        .statusCode(expectedStatus)
        .execute();
    });
  });

  after(async function() {
    await restified.cleanup();
  });
});