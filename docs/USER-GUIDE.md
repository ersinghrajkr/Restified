# Restified User Guide

Welcome to Restified! This guide shows you the **simplest ways** to use the framework and generate beautiful test reports.

## Quick Start

### 1. Run Your Tests
```bash
# Run all examples (no report)
npm run examples

# Run unit tests  
npm test
```

### 2. Generate Beautiful HTML Reports ✨
```bash
# 🎯 THE EASIEST WAY - Just run this!
npm run report

# Or use the CLI command
restifiedts report

# Want to auto-open the report in browser?
restifiedts report --open

# Clean previous reports first?
restifiedts report --clean --open
```

**That's it!** Your beautiful HTML report will be at `reports/test-report.html`

## What You Get

### 📊 Interactive HTML Report
- **Charts and graphs** of test results
- **Request/Response details** for each API call
- **Code snippets** and test execution details
- **Timeline view** of test execution
- **Screenshots** of any failures

### 📁 Simple File Structure
```
reports/
├── test-report.html     # 🌟 Main interactive report
├── test-report.json     # Raw data (for CI/CD)
└── test-summary.json    # Quick summary
```

## Framework Features (Auto-Configured)

### 🌐 Pre-Configured HTTP Clients
The framework automatically sets up 3 HTTP clients for you:

```typescript
// These are ready to use in any test - no setup needed!
restified.given().useClient('api')      // JSONPlaceholder API
restified.given().useClient('testUtils') // HTTPBin utilities  
restified.given().useClient('auth')     // Authentication service
```

### 🔐 Global Authentication
Authentication happens once globally:
- ✅ Auth token automatically extracted
- ✅ Available as `{{globalAuthToken}}` in all tests
- ✅ User info available as `{{globalUserEmail}}` and `{{globalUserId}}`

### 📋 Global Headers (Automatic)
These headers are automatically added to every request:
```json
{
  "X-Test-Suite": "restified-examples",
  "X-Environment": "development", 
  "X-API-Version": "v1",
  "X-Example-Mode": "true",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

You can add more headers per request if needed:
```typescript
restified.given()
  .useClient('api')
  .header('Authorization', 'Bearer {{globalAuthToken}}')  // Add auth
  .header('Custom-Header', 'value')                       // Add custom
```

## Writing Tests (Super Simple)

### Basic Test Pattern
```typescript
import { restified } from 'restifiedts';

describe('My API Tests', function() {
  it('should get user data', async function() {
    // 1. Make request using pre-configured client
    const response = await restified
      .given()
        .useClient('api')  // Pre-configured! No URLs needed
      .when()
        .get('/users/1')
        .execute();

    // 2. Verify response
    await response
      .statusCode(200)
      .jsonPath('$.name', 'Leanne Graham')
      .execute();
  });

  // Cleanup is automatic - no need to add afterAll!
});
```

### Using Variables
```typescript
it('should create and retrieve post', async function() {
  // Create post
  const createResponse = await restified
    .given()
      .useClient('api')
    .when()
      .post('/posts', {
        title: 'My Post',
        body: 'Created by {{globalUserEmail}}',  // Uses global auth
        userId: '{{globalUserId}}'                // Uses global user ID
      })
      .execute();

  // Extract the created post ID
  await createResponse
    .statusCode(201)
    .extract('$.id', 'createdPostId')  // Save ID for later use
    .execute();

  // Retrieve the post using extracted ID
  const getResponse = await restified
    .given()
      .useClient('api')
    .when()
      .get('/posts/{{createdPostId}}')  // Use extracted ID
      .execute();

  await getResponse
    .statusCode(200)
    .jsonPath('$.title', 'My Post')
    .execute();
});
```

## Environment Support

### Set Environment
```bash
# Run in different environments
TEST_ENV=staging npm run report
TEST_ENV=production npm run report
```

### Environment Variables in Tests
```typescript
// These work automatically in any test:
'{{$env.API_KEY}}'           // Environment variable
'{{$faker.person.fullName}}' // Fake data  
'{{$random.uuid}}'           // Random UUID
'{{$date.now}}'              // Current timestamp
```

## CLI Commands (All Optional)

### Framework CLI
```bash
# Generate beautiful report (recommended!)
restifiedts report --open

# Create new project
restifiedts new my-api-tests

# Initialize existing project  
restifiedts init

# Generate test files from templates
restifiedts generate api-test MyAPI
```

### NPM Scripts (Simplified)
```bash
# Essential commands
npm run examples    # Run tests (no report)
npm run report      # Run tests + generate HTML report
npm test           # Run unit tests only

# Utility commands
npm run reports:clean  # Clean old reports
npm run build         # Build TypeScript
npm run lint          # Check code quality
```

## Viewing Reports

### Local Development
```bash
# Generate and open report
npm run report
# or
restifiedts report --open

# Report will open automatically in your browser
# File location: reports/test-report.html
```

### CI/CD Integration
```bash
# In your CI/CD pipeline
npm run report

# Upload reports/ directory as build artifacts
# The JSON files can be consumed by CI/CD tools
```

## What Makes This Easy?

### ✅ No Configuration Required
- HTTP clients pre-configured
- Global headers automatically set
- Authentication handled globally
- Report infrastructure ready

### ✅ One Command Reports
- `npm run report` - that's it!
- Beautiful HTML with charts
- Auto-opens in browser
- CI/CD ready JSON files

### ✅ Enterprise Patterns Built-In
- Global setup/teardown
- Variable management
- Response caching
- Error handling
- Retry logic

### ✅ Real-World Ready
- Multiple HTTP clients
- Cross-service testing  
- Environment support
- Authentication flows
- Data extraction

## Need Help?

### Common Issues
1. **No report generated**: Make sure you ran `npm install` first
2. **Tests failing**: That's OK! Report still generates
3. **Can't find reports**: Check `reports/test-report.html`

### Get Support
- 📖 **Full docs**: `/docs/` directory
- 🐛 **Report issues**: GitHub issues
- 💡 **Examples**: `/examples/` directory

---

**🎯 TL;DR: Just run `npm run report` and get beautiful test reports!**