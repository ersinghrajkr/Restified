# Quick Start Tutorial

Get started with Restified in 5 minutes! This tutorial will walk you through creating your first API test.

## Prerequisites

Before starting, make sure you have:
- ✅ [Restified installed](installation.md) in your project
- ✅ Basic understanding of TypeScript/JavaScript
- ✅ Familiarity with API testing concepts

## Your First Test

Let's create a simple test that validates a REST API endpoint.

### Step 1: Create Test File

Create `tests/quick-start.spec.ts`:

```typescript
import { restified } from 'restified';

describe('My First Restified Test', function() {
  this.timeout(10000);

  it('should get a user and validate response', async function() {
    // Step 1: Execute the HTTP request
    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/users/1')
        .execute();

    // Step 2: Execute the assertions
    await response
      .statusCode(200)
      .jsonPath('$.id', 1)
      .jsonPath('$.name', 'Leanne Graham')
      .jsonPath('$.email', 'Sincere@april.biz')
      .execute();
  });

  after(async function() {
    await restified.cleanup();
  });
});
```

### Step 2: Run Your Test

```bash
npm test
```

You should see output like:
```
  My First Restified Test
    ✓ should get a user and validate response

  1 passing (234ms)
```

🎉 **Congratulations!** You've just created your first Restified test!

## Understanding the Pattern

Restified uses a **fluent DSL** with three main phases:

### 1. Given (Setup Phase)
Configure your request:

```typescript
.given()
  .baseURL('https://api.example.com')
  .header('Authorization', 'Bearer token')
  .contentType('application/json')
```

### 2. When (Execution Phase)  
Define and execute the HTTP request:

```typescript
.when()
  .get('/users/1')           // GET request
  .post('/users', userData)  // POST request
  .execute()                 // Execute the request
```

### 3. Then (Assertion Phase)
Validate the response:

```typescript
await response
  .statusCode(200)
  .jsonPath('$.name', 'Expected Name')
  .header('content-type')
  .execute();  // Execute the assertions
```

## Building on the Basics

### Adding More Assertions

Let's enhance our test with more comprehensive validations:

```typescript
it('should validate user data comprehensively', async function() {
  const response = await restified
    .given()
      .baseURL('https://jsonplaceholder.typicode.com')
    .when()
      .get('/users/1')
      .execute();

  await response
    .statusCode(200)
    .header('content-type')
    .jsonPath('$.id', 1)
    .jsonPath('$.name', 'Leanne Graham')
    .jsonPath('$.username', 'Bret')
    .jsonPath('$.email', 'Sincere@april.biz')
    .jsonPath('$.address.city', 'Gwenborough')
    .custom((response) => {
      return typeof response.data.id === 'number';
    }, 'User ID should be a number')
    .execute();
});
```

### Working with Variables

Use variables to make tests more dynamic:

```typescript
it('should use variables for dynamic testing', async function() {
  // Set up test data
  restified.setGlobalVariable('userId', 1);
  restified.setLocalVariable('expectedName', 'Leanne Graham');

  const response = await restified
    .given()
      .baseURL('https://jsonplaceholder.typicode.com')
    .when()
      .get('/users/{{userId}}')  // Uses variable
      .execute();

  await response
    .statusCode(200)
    .jsonPath('$.id', '{{userId}}')
    .jsonPath('$.name', '{{expectedName}}')
    .extract('$.email', 'userEmail')  // Extract for later use
    .execute();

  console.log('Extracted email:', restified.getVariable('userEmail'));
});
```

### Creating Data with POST

Test creating new resources:

```typescript
it('should create a new post', async function() {
  const postData = {
    title: 'My Test Post',
    body: 'This is a test post created by Restified',
    userId: 1
  };

  const response = await restified
    .given()
      .baseURL('https://jsonplaceholder.typicode.com')
      .contentType('application/json')
    .when()
      .post('/posts', postData)
      .execute();

  await response
    .statusCode(201)
    .jsonPath('$.title', 'My Test Post')
    .jsonPath('$.userId', 1)
    .jsonPath('$.id')  // Verify ID exists
    .extract('$.id', 'createdPostId')
    .execute();

  console.log('Created post ID:', restified.getVariable('createdPostId'));
});
```

## Authentication

Add authentication to your requests:

```typescript
it('should authenticate with bearer token', async function() {
  const response = await restified
    .given()
      .baseURL('https://httpbin.org')
      .bearerToken('my-secret-token')
    .when()
      .get('/bearer')
      .execute();

  await response
    .statusCode(200)
    .jsonPath('$.authenticated', true)
    .jsonPath('$.token', 'my-secret-token')
    .execute();
});
```

## Environment Variables

Use environment variables for configuration:

```typescript
it('should use environment variables', async function() {
  // First set environment variable
  process.env.API_BASE_URL = 'https://jsonplaceholder.typicode.com';
  
  const response = await restified
    .given()
      .baseURL('{{$env.API_BASE_URL}}')  // Use env variable
    .when()
      .get('/users/1')
      .execute();

  await response
    .statusCode(200)
    .jsonPath('$.id', 1)
    .execute();
});
```

## Complete Example

Here's a comprehensive test that combines multiple concepts:

```typescript
describe('Complete Quick Start Example', function() {
  this.timeout(15000);

  beforeEach(function() {
    // Set up test data
    restified.setGlobalVariable('baseUrl', 'https://jsonplaceholder.typicode.com');
    restified.setLocalVariable('testUserId', 1);
  });

  it('should demonstrate end-to-end workflow', async function() {
    // 1. Get user data
    const userResponse = await restified
      .given()
        .baseURL('{{baseUrl}}')
      .when()
        .get('/users/{{testUserId}}')
        .execute();

    await userResponse
      .statusCode(200)
      .extract('$.name', 'userName')
      .extract('$.email', 'userEmail')
      .execute();

    // 2. Create a post for the user
    const postResponse = await restified
      .given()
        .baseURL('{{baseUrl}}')
        .contentType('application/json')
      .when()
        .post('/posts', {
          title: 'Post by {{userName}}',
          body: 'This post was created by {{userName}} ({{userEmail}})',
          userId: '{{testUserId}}'
        })
        .execute();

    await postResponse
      .statusCode(201)
      .jsonPath('$.userId', 1)
      .extract('$.id', 'postId')
      .execute();

    // 3. Verify the created post
    const verifyResponse = await restified
      .given()
        .baseURL('{{baseUrl}}')
      .when()
        .get('/posts/{{postId}}')
        .execute();

    await verifyResponse
      .statusCode(200)
      .jsonPath('$.id', restified.getVariable('postId'))
      .jsonPath('$.userId', 1)
      .custom((response) => {
        return response.data.title.includes(restified.getVariable('userName'));
      }, 'Post title should contain user name')
      .execute();

    console.log('Test completed successfully!');
    console.log('Variables used:', restified.getVariables());
  });

  after(async function() {
    await restified.cleanup();
  });
});
```

## Best Practices from the Start

### 1. Always Include Cleanup
```typescript
after(async function() {
  await restified.cleanup(); // ALWAYS include this
});
```

### 2. Use Regular Functions (Not Arrow Functions)
```typescript
// ✅ Correct - allows `this.timeout()`
describe('Tests', function() {
  it('should work', async function() {
    this.timeout(10000);
    // Test code
  });
});

// ❌ Incorrect - no `this` context
describe('Tests', () => {
  it('should work', async () => {
    // Can't use this.timeout() here
  });
});
```

### 3. Set Appropriate Timeouts
```typescript
describe('API Tests', function() {
  this.timeout(10000); // 10 second timeout for all tests
  
  it('slow test', async function() {
    this.timeout(20000); // Override timeout for specific test
    // Long-running test
  });
});
```

### 4. Use Meaningful Test Names
```typescript
// ✅ Good - descriptive
it('should return user data with valid email format when user exists', async function() {

// ❌ Bad - vague  
it('should work', async function() {
```

## Next Steps

Now that you've mastered the basics:

1. 🧠 [Learn Core Concepts](basic-concepts.md) - Understand Restified's architecture
2. 🔗 [Master the Fluent DSL](../guides/fluent-dsl.md) - Advanced DSL patterns
3. 📊 [Variable Management](../guides/variables.md) - Advanced variable usage
4. 🔐 [Authentication](../guides/authentication.md) - Set up authentication
5. 📖 [See More Examples](../../examples/) - Comprehensive examples

## Common Patterns

Save these patterns for quick reference:

```typescript
// Basic GET with validation
const response = await restified
  .given().baseURL('https://api.example.com')
  .when().get('/resource/1').execute();
await response.statusCode(200).jsonPath('$.id', 1).execute();

// POST with data extraction
const response = await restified
  .given().baseURL('https://api.example.com').contentType('application/json')
  .when().post('/resource', data).execute();
await response.statusCode(201).extract('$.id', 'resourceId').execute();

// Using variables
restified.setGlobalVariable('id', 123);
const response = await restified
  .given().baseURL('https://api.example.com')
  .when().get('/resource/{{id}}').execute();

// Authentication
const response = await restified
  .given().baseURL('https://api.example.com').bearerToken('token')
  .when().get('/protected').execute();
```

Happy testing with Restified! 🚀