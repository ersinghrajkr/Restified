# Basic Concepts

This guide introduces the core concepts and architecture of Restified that you need to understand to use the framework effectively.

## Framework Philosophy

Restified is built on several key principles:

### 1. **Fluent DSL Design**
Inspired by Java's RestAssured, Restified uses a readable, chainable API:

```typescript
// Reads like natural language
await restified
  .given().baseURL('https://api.example.com')
  .when().get('/users/1')
  .then().statusCode(200)
```

### 2. **TypeScript-First**
Full TypeScript support with strict typing and IntelliSense:

```typescript
// Compile-time type checking
const response: ThenStep = await restified
  .given()
    .baseURL('https://api.example.com') // string
    .timeout(5000)                      // number
  .when()
    .get('/users/1')
    .execute();
```

### 3. **Double Execute Pattern**
Separation of request execution and assertion execution:

```typescript
// Step 1: Execute HTTP request
const response = await restified
  .given().baseURL('https://api.example.com')
  .when().get('/users/1')
  .execute(); // <-- First execute()

// Step 2: Execute assertions  
await response
  .statusCode(200)
  .jsonPath('$.name', 'John')
  .execute(); // <-- Second execute()
```

## Core Architecture

### 1. DSL Phases

Restified follows a three-phase pattern:

#### Given Phase (Setup)
Configure the HTTP request:

```typescript
restified.given()
  .baseURL('https://api.example.com')    // Base URL
  .header('Authorization', 'Bearer ...')  // Headers
  .contentType('application/json')        // Content type
  .timeout(10000)                        // Request timeout
  .bearerToken('token')                  // Authentication
  .queryParam('page', 1)                 // Query parameters
```

#### When Phase (Execution)
Define and execute the HTTP request:

```typescript
.when()
  .get('/users')                    // GET request
  .post('/users', userData)         // POST with body
  .put('/users/1', updateData)      // PUT with body  
  .delete('/users/1')               // DELETE request
  .patch('/users/1', patchData)     // PATCH with body
  .execute()                        // Execute the request
```

#### Then Phase (Assertions)
Validate the HTTP response:

```typescript
await response
  .statusCode(200)                           // Status code
  .header('content-type')                    // Header exists
  .jsonPath('$.name', 'John')               // JSON path value
  .jsonSchema(schema)                        // Schema validation
  .custom((res) => res.data.length > 0)     // Custom assertion
  .execute()                                 // Execute assertions
```

### 2. Variable Management System

Restified provides a sophisticated variable management system:

#### Variable Types

```typescript
// Global variables (persist across tests)
restified.setGlobalVariable('baseUrl', 'https://api.example.com');

// Local variables (test-scoped)
restified.setLocalVariable('userId', 123);

// Extracted variables (from responses)
await response.extract('$.token', 'authToken').execute();

// Environment variables
process.env.API_KEY = 'secret';
// Used as: '{{$env.API_KEY}}'
```

#### Variable Resolution

Variables are resolved in template strings using `{{variableName}}` syntax:

```typescript
restified.setGlobalVariable('userId', 1);
restified.setLocalVariable('action', 'profile');

// Variables resolved at runtime
await restified
  .given().baseURL('{{baseUrl}}')
  .when().get('/users/{{userId}}/{{action}}')  // -> /users/1/profile
  .execute();
```

#### Variable Priority (Highest to Lowest)
1. **Local variables** - Test-specific data
2. **Extracted variables** - Data from previous responses
3. **Global variables** - Shared across tests
4. **Environment variables** - System configuration

### 3. HTTP Client Architecture

#### Multi-Client Support

```typescript
// Configure multiple clients
restified.createClient('authService', {
  baseURL: 'https://auth.example.com',
  timeout: 5000,
  defaultHeaders: { 'Service': 'auth' }
});

restified.createClient('userService', {
  baseURL: 'https://users.example.com',
  timeout: 10000,
  defaultHeaders: { 'Service': 'users' }
});

// Use specific client
await restified
  .given().useClient('authService')
  .when().get('/login').execute();
```

#### Request/Response Lifecycle

```typescript
// 1. Configuration phase
const givenStep = restified.given()
  .baseURL('https://api.example.com')
  .header('Accept', 'application/json');

// 2. Request building phase  
const whenStep = givenStep.when()
  .get('/users/1');

// 3. Request execution phase
const response = await whenStep.execute();

// 4. Response validation phase
await response
  .statusCode(200)
  .execute();
```

## Authentication System

### Authentication Providers

Restified supports multiple authentication methods:

#### Bearer Token
```typescript
await restified
  .given()
    .bearerToken('your-jwt-token')
    // OR from variable
    .bearerToken('{{authToken}}')
  .when().get('/protected').execute();
```

#### Basic Authentication
```typescript
await restified
  .given()
    .basicAuth('username', 'password')
  .when().get('/protected').execute();
```

#### API Key
```typescript
await restified
  .given()
    .apiKey('X-API-Key', 'your-api-key')
  .when().get('/protected').execute();
```

#### Custom Authentication
```typescript
await restified
  .given()
    .auth({
      type: 'custom',
      apply: (config) => {
        config.headers['Authorization'] = `Custom ${token}`;
        return config;
      }
    })
  .when().get('/protected').execute();
```

## Response Assertion System

### Built-in Assertions

#### Status Code Validation
```typescript
await response
  .statusCode(200)           // Exact match
  .statusCode([200, 201])    // Multiple allowed
  .statusCodeBetween(200, 299) // Range
  .execute();
```

#### Header Validation
```typescript
await response
  .header('content-type')                    // Header exists
  .header('content-type', 'application/json') // Exact value
  .headerContains('content-type', 'json')    // Contains value
  .execute();
```

#### JSON Path Validation
```typescript
await response
  .jsonPath('$.name')                    // Path exists
  .jsonPath('$.name', 'John')           // Exact value
  .jsonPath('$.users[0].id', 1)         // Array element
  .jsonPath('$.users.length', 3)        // Array length
  .execute();
```

#### Schema Validation
```typescript
const userSchema = {
  type: 'object',
  required: ['id', 'name', 'email'],
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' }
  }
};

await response
  .jsonSchema(userSchema)
  .execute();
```

#### Custom Assertions
```typescript
await response
  .custom((response) => {
    return response.data.users.length > 0;
  }, 'Should have at least one user')
  .custom((response) => {
    return response.headers['x-rate-limit-remaining'] > 10;
  }, 'Should have rate limit remaining')
  .execute();
```

### Data Extraction

Extract data from responses for use in subsequent requests:

```typescript
// Extract single values
await response
  .extract('$.token', 'authToken')
  .extract('$.user.id', 'userId')
  .execute();

// Use extracted data
const nextResponse = await restified
  .given()
    .bearerToken('{{authToken}}')
  .when()
    .get('/users/{{userId}}/profile')
    .execute();
```

## Error Handling

### Assertion Failures
```typescript
try {
  await response
    .statusCode(200)
    .jsonPath('$.name', 'Expected Name')
    .execute();
} catch (error) {
  console.log('Assertion failed:', error.message);
  // Handle test failure
}
```

### Request Failures
```typescript
try {
  const response = await restified
    .given().baseURL('https://invalid-url.com')
    .when().get('/users').execute();
} catch (error) {
  console.log('Request failed:', error.message);
  // Handle network error
}
```

### Custom Error Messages
```typescript
await response
  .custom((response) => {
    return response.data.status === 'active';
  }, 'User account should be active') // Custom error message
  .execute();
```

## Configuration Management

### Default Configuration
```typescript
// Global configuration
restified.configure({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  defaultHeaders: {
    'User-Agent': 'Restified/1.0.0',
    'Accept': 'application/json'
  },
  retryConfig: {
    retries: 3,
    retryDelay: 1000
  }
});
```

### Environment-Specific Configuration
```typescript
// Development
if (process.env.NODE_ENV === 'development') {
  restified.configure({
    baseURL: 'https://dev-api.example.com',
    timeout: 30000, // Longer timeout for dev
    logging: true
  });
}

// Production  
if (process.env.NODE_ENV === 'production') {
  restified.configure({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    logging: false
  });
}
```

## Memory Management

### Cleanup
Always clean up resources after tests:

```typescript
describe('API Tests', function() {
  afterAll(async function() {
    await restified.cleanup(); // Essential for preventing memory leaks
  });
});
```

### Variable Scope Management
```typescript
describe('Test Suite', function() {
  beforeEach(function() {
    // Set up test-specific variables
    restified.setLocalVariable('testId', Math.random());
  });

  afterEach(function() {
    // Local variables are automatically cleaned up
    // Global variables persist unless explicitly cleared
  });
});
```

## Integration Patterns

### Mocha Integration
```typescript
describe('API Test Suite', function() {
  this.timeout(10000); // Set timeout for all tests
  
  before(async function() {
    // Suite-wide setup
    await restified.configure({ baseURL: 'https://api.example.com' });
  });
  
  beforeEach(function() {
    // Test-specific setup
    this.timeout(15000); // Override timeout for specific test
  });
  
  it('should test endpoint', async function() {
    // Test implementation
  });
  
  after(async function() {
    await restified.cleanup(); // Always clean up
  });
});
```

### Data-Driven Testing
```typescript
const testCases = [
  { userId: 1, expectedName: 'John' },
  { userId: 2, expectedName: 'Jane' },
  { userId: 3, expectedName: 'Bob' }
];

testCases.forEach(({ userId, expectedName }) => {
  it(`should validate user ${userId}`, async function() {
    const response = await restified
      .given().baseURL('https://api.example.com')
      .when().get(`/users/${userId}`).execute();
    
    await response
      .statusCode(200)
      .jsonPath('$.name', expectedName)
      .execute();
  });
});
```

## Performance Considerations

### Request Optimization
```typescript
// Reuse clients for better performance
const apiClient = restified.createClient('api', {
  baseURL: 'https://api.example.com',
  keepAlive: true
});

// Use keep-alive connections
await restified
  .given().useClient('api')
  .when().get('/users/1').execute();
```

### Memory Efficiency
```typescript
// Clean up after each test to prevent memory leaks
afterEach(async function() {
  await restified.cleanup();
});

// Use local variables instead of global when possible
restified.setLocalVariable('temp', 'value'); // Cleaned up automatically
```

## Next Steps

Now that you understand the core concepts:

1. 🔗 [Master the Fluent DSL](../guides/fluent-dsl.md) - Deep dive into DSL methods
2. 📊 [Variable Management](../guides/variables.md) - Advanced variable techniques
3. 🔐 [Authentication](../guides/authentication.md) - Set up authentication providers
4. ✅ [Assertions](../guides/assertions.md) - Complete assertion reference
5. 📖 [Examples](../../examples/) - See concepts in action