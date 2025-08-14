# Restified Examples

This directory contains comprehensive examples demonstrating various features of the Restified API testing framework. All examples use Mocha test syntax to show real-world usage patterns.

## Directory Structure

```
examples/
├── basic/                    # Basic usage examples
│   ├── simple-get.ts         # Basic GET request with assertions
│   └── post-with-variables.ts # POST requests with variable usage
├── authentication/           # Authentication examples
│   └── bearer-auth.ts        # Bearer token authentication
├── advanced/                 # Advanced features
│   ├── schema-validation.ts   # JSON Schema validation
│   ├── multi-client.ts       # Multiple HTTP clients
│   ├── data-driven-testing.ts # Data-driven test patterns
│   ├── error-handling.ts     # Error handling and resilience
│   ├── response-store.ts     # Response store functionality
│   └── variable-store.ts     # Variable store management
└── README.md                 # This file
```

## Running Examples

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

### Running Examples

#### Using NPM Scripts (Recommended)

```bash
# Run all examples with global setup
npm run examples

# Run examples by category (all include global setup)
npm run examples:basic      # Basic usage examples (4 tests)
npm run examples:auth       # Authentication examples (3 tests)
npm run examples:advanced   # Advanced feature examples (35+ tests)
```

#### Global Setup and Teardown

All example scripts include `examples/setup/global-setup.ts` which:
- **Global Setup (`before`)**: Configures HTTP clients, performs authentication, sets global variables
- **Global Teardown (`after`)**: Performs cleanup after all test suites complete

This mirrors real-world enterprise testing where:
- Authentication happens once at the start
- HTTP clients are configured globally
- Shared configuration is available to all test suites
- Cleanup is centralized

**Note**: Some authentication examples may occasionally fail due to external service availability (HTTPBin). This is normal and doesn't indicate issues with the framework.

#### Using Mocha Directly

```bash
# Run individual examples
npx mocha -r ts-node/register examples/basic/simple-get.ts
npx mocha -r ts-node/register examples/basic/post-with-variables.ts

# Run authentication examples
npx mocha -r ts-node/register examples/authentication/bearer-auth.ts

# Run advanced examples
npx mocha -r ts-node/register examples/advanced/schema-validation.ts
npx mocha -r ts-node/register examples/advanced/multi-client.ts
npx mocha -r ts-node/register examples/advanced/data-driven-testing.ts
npx mocha -r ts-node/register examples/advanced/error-handling.ts

# Run all examples
npx mocha -r ts-node/register 'examples/**/*.ts'
```

### Import Note for Development

During development, examples import from the local source code:

```typescript
import { restified } from '../../src';  // Development import
```

Once the package is published, users should import from the published package:

```typescript
import { restified } from 'restified';  // Published package import
```

## Example Categories

### Basic Examples

**simple-get.ts** - Demonstrates the fundamental Restified pattern:
- Basic GET request setup
- Response status and header validation
- JSON path assertions
- Custom validation functions

**post-with-variables.ts** - Shows variable management:
- Setting global and local variables
- Using template variables in requests
- Data extraction from responses
- Chaining requests using extracted data

### Authentication Examples

**bearer-auth.ts** - Bearer token authentication:
- Static bearer token usage
- Environment variable integration
- Authentication failure handling

### Advanced Examples

**schema-validation.ts** - JSON Schema validation:
- Object schema validation with AJV
- Array schema validation
- Schema validation failure testing
- Complex nested object schemas

**multi-client.ts** - Multiple HTTP clients:
- Configuring multiple named clients
- Switching between clients in tests
- Client-specific headers and timeouts
- Cross-client data sharing

**data-driven-testing.ts** - Data-driven test patterns:
- Parameterized test generation
- Testing multiple scenarios with forEach
- Batch validation patterns
- Range-based assertions

**error-handling.ts** - Error handling and resilience:
- HTTP error status testing (404, 500)
- Network timeout and retry handling
- Malformed response handling
- Rate limiting behavior testing

**response-store.ts** - Response store functionality:
- Storing HTTP responses for later use with custom keys
- Retrieving stored responses for comparison or validation
- Multiple response management patterns
- Response data persistence across test steps
- Response store cleanup and management

**variable-store.ts** - Variable store management:
- Global variable management across tests
- Local variable scoping within tests
- Environment variable integration with `$env` prefix
- Variable priority resolution (local > global > environment)
- Data extraction from responses into variables
- Variable clearing and cleanup patterns

## Key Patterns Demonstrated

### 1. Fluent DSL Pattern
All examples use the characteristic given().when().then() pattern:

```typescript
const response = await restified
  .given()
    .baseURL('https://api.example.com')
    .bearerToken('token')
  .when()
    .get('/users/1')
    .execute();

await response
  .statusCode(200)
  .jsonPath('$.name')
  .execute();
```

### 2. Variable Management
Examples show comprehensive variable usage:

```typescript
// Set variables
restified.setGlobalVariable('baseUrl', 'https://api.example.com');
restified.setLocalVariable('userId', '123');

// Use in requests
.get('/users/{{userId}}')

// Extract from responses
.extract('$.token', 'authToken')
```

### 3. Mocha Integration
All examples follow Mocha best practices:

```typescript
describe('Test Suite', function() {
  this.timeout(10000);
  
  it('should do something', async function() {
    // Test implementation
  });
  
  after(async function() {
    await restified.cleanup(); // ALWAYS include cleanup
  });
});
```

### 4. Error Handling
Examples demonstrate proper error handling:

```typescript
try {
  // Test that should fail
  await response.statusCode(200).execute();
  throw new Error('Should have failed');
} catch (error) {
  // Expected failure
  console.log('Test failed as expected');
}
```

## Best Practices Shown

1. **Always include cleanup**: Every test suite includes `after(async () => await restified.cleanup())`

2. **Use regular functions**: All examples use `function()` syntax instead of arrow functions for proper Mocha context

3. **Set appropriate timeouts**: Examples use `this.timeout()` for network-dependent tests

4. **Comprehensive assertions**: Examples show multiple assertion types and custom validation functions

5. **Variable scoping**: Proper use of global vs local variables and data extraction

6. **Client configuration**: Examples show how to configure multiple clients for different services

## Environment Variables

Some examples use environment variables. Create a `.env` file in the project root:

```env
API_TOKEN=your-api-token-here
BASE_URL=https://api.example.com
```

## Notes

- All examples use public APIs that don't require authentication (JSONPlaceholder, HTTPBin)
- Examples are designed to be educational and may include intentional failure scenarios
- Real-world usage would typically involve internal APIs with proper authentication
- Examples demonstrate both positive and negative test scenarios

## Contributing

When adding new examples:
1. Follow the existing Mocha patterns
2. Include comprehensive comments
3. Use realistic test scenarios
4. Always include cleanup in `afterAll`
5. Test both success and failure cases
6. Update this README with the new example