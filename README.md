# 🚀 RestifiedTS - Enterprise API Testing Framework

**Production-grade TypeScript testing framework with fluent DSL for REST APIs, GraphQL, WebSocket, and database testing. Features dynamic JSON fixtures, comprehensive variable resolution, and enterprise automation.**

[![npm version](https://badge.fury.io/js/restifiedts.svg)](https://badge.fury.io/js/restifiedts)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-Ready-success?style=flat-square)
](./docs/ENTERPRISE-FEATURES.md)

[
](./docs/ENTERPRISE-FEATURES.md)

## 🆕 **What's New in v2.0.8**

- **🚀 Performance Optimization**: Revolutionary virtual scrolling for HTML reports with 3000+ tests
- **⚡ Smart Data Loading**: On-demand loading of request/response/assertion details to prevent browser freeze
- **🎯 Automatic Optimization**: Virtual scrolling activates automatically when >100 tests detected
- **📊 Performance Indicator**: Visual feedback showing when optimization is active
- **💾 Zero Data Loss**: All test data preserved while maintaining browser responsiveness
- **🔧 Seamless Integration**: Works with existing npm scripts and CLI commands without changes

### 📈 **Performance Improvements**

RestifiedTS now handles **enterprise-scale test suites** with thousands of tests:

- **Before**: Browser unresponsive with 500+ tests, 12MB+ reports
- **After**: Smooth performance with 3000+ tests, responsive UI, on-demand loading
- **Virtual Scrolling**: Only renders 50 tests initially with "Load More" functionality
- **Smart Caching**: Request/response details cached after first load

### 🔄 **Migration from Previous Versions**

**No changes required!** All existing commands work exactly the same:

```bash
# Same commands, enhanced performance
npm run report:restified
restifiedts scaffold -n "MyAPI" -u "https://api.example.com"
```

### **🔄 Key Changes & Security Improvements:**

- ✅ `scaffold` command creates folder with project name (not generic "tests" folder)
- ✅ Enhanced ConfigLoader with enterprise validation and graceful fallbacks
- ✅ 50+ new environment variables for complete customization
- ✅ Better TypeScript integration and error handling
- 🆕 **Security-hardened CLI**: All commands now validate inputs for safety
- 🆕 **Path traversal protection**: Prevents `../../../` directory attacks
- 🆕 **Command injection prevention**: Blocks malicious shell commands
- 🆕 **AI-powered initialization**: Enhanced `init --interactive` command with intelligent recommendations (replaces `create --interactive`)
- 🆕 **Async file operations**: Non-blocking file operations for better performance

---

## ✨ **Why RestifiedTS?**

RestifiedTS is inspired by Java's RestAssured but built for the modern TypeScript ecosystem with **enterprise-first design**:

- **🏢 Enterprise-Ready**: Multi-tenant, microservices, SSO, compliance out of the box
- **🔄 Configuration-Driven**: Zero boilerplate with `restified.config.ts`
- **🔐 Automatic Authentication**: SSO/OAuth2 with automatic token injection
- **⚡ High-Performance**: HTTP/2 connection pooling for 20-40% faster requests
- **🔄 Smart Retry System**: Exponential backoff with jitter for maximum reliability
- **📊 Comprehensive Reporting**: HTML, JSON, XML, JUnit, Excel with CI/CD integration
- **🚀 Performance & Security**: Built-in K6, Artillery, and OWASP ZAP integration
- **🌐 Multi-Client**: Test multiple microservices with shared authentication

---

## 🚀 **Quick Start**

### Installation & Setup

```bash
# Install RestifiedTS globally
npm install -g restifiedts
```

### Initialize Your First Project

```bash
# 🆕 RECOMMENDED: Interactive wizard with AI-powered analysis
restifiedts init --interactive
# Follow the prompts for intelligent project setup with API analysis

# OR: Traditional scaffolding approach
restifiedts scaffold -n "MyAPI" -t "api,auth,database,performance" -u "https://api.example.com"

# Navigate to generated project
cd ./MyAPI

# Install dependencies and run tests
npm install
npm test
```

### Or Use This Repository

```bash
# Clone for framework development
git clone https://github.com/yourorg/restifiedts.git
cd restifiedts
npm install && npm run build

# Run comprehensive examples
npm run examples
```

### Simple Test Example

```typescript
import { restified } from 'restifiedts';

describe('API Tests', function() {
  it('should get user data', async function() {
    const response = await restified
      .given()
        .useClient('api')  // Pre-configured with auth & headers
      .when()
        .get('/users/1')
        .execute();

    await response
      .statusCode(200)
      .jsonPath('$.name', 'Leanne Graham')
      .execute();
  });
});
```

---

## 🏢 **Enterprise Features**

### **🌐 Multi-Client Architecture**

```typescript
// restified.config.ts - Configure once, use everywhere
clients: {
  api: { baseURL: 'https://api.company.com' },
  userService: { baseURL: 'https://users.company.com' },
  orderService: { baseURL: 'https://orders.company.com' },
  paymentGateway: { baseURL: 'https://payments.company.com' }
}
```

### **🔐 Automatic Authentication**

```typescript
// Authenticate once, use everywhere
authentication: {
  endpoint: '/auth/login',
  method: 'POST',
  client: 'api',
  
  // Login credentials
  credentials: {
    email: process.env.API_USERNAME || 'demo@example.com',
    password: process.env.API_PASSWORD || 'demo123'
    // Or use username/password if your API requires it
  },
  
  // Extract data from auth response
  extractors: {
    token: '$.access_token',
    userEmail: '$.user.email',
    userId: '$.user.id',
    roles: '$.user.roles',
    permissions: '$.user.permissions'
  },
  
  // Apply to all clients automatically
  autoApplyToClients: ['api', 'userService', 'orderService']
}
```

### **📊 Enterprise Headers & Tracing**

```typescript
// Automatic enterprise headers on all requests
globalHeaders: {
  'X-Tenant-ID': process.env.TENANT_ID,
  'X-Trace-ID': '{{$random.uuid}}',
  'X-Compliance-Mode': 'strict'
}
```

---

## 🌟 **Multi-Protocol Support**

RestifiedTS supports comprehensive testing across multiple protocols and technologies:

### **🔗 GraphQL Testing**

```typescript
// Create GraphQL client
restified.createGraphQLClient('graphql', {
  endpoint: 'https://api.example.com/graphql',
  headers: { 'Authorization': 'Bearer {{token}}' }
});

// Execute GraphQL queries and mutations
const response = await restified.getGraphQLClient('graphql')
  .query(`
    query GetUser($id: ID!) {
      user(id: $id) { name email }
    }
  `, { id: '123' });
```

### **⚡ WebSocket Testing**

```typescript
// Create WebSocket client
restified.createWebSocketClient('ws', {
  url: 'wss://api.example.com/ws',
  reconnectAttempts: 3
});

// Connect and test real-time communication
await restified.connectWebSocket('ws');
const client = restified.getWebSocketClient('ws');

await client.sendJSON({ type: 'subscribe', channel: 'orders' });
const message = await client.waitForMessage(
  (msg) => msg.data.type === 'order_update',
  5000
);
```

### **🗄️ Database Integration** ✅ *Fully Implemented*

> **Current Status**: All major database types now have complete implementations with enterprise-grade features.

```typescript
// ✅ PostgreSQL - Complete Implementation
await restified.createDatabaseClient('postgres', {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'testdb',
  username: 'postgres',
  password: 'password',
  connectionString: 'postgresql://postgres:password@localhost:5432/testdb',
  timeout: 30000,
  pool: {
    min: 1,
    max: 10,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000
  },
  options: {
    ssl: false,
    application_name: 'RestifiedTS',
    schema: 'public'
  }
});

// ✅ MySQL - Complete Implementation
await restified.createDatabaseClient('mysql', {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'testdb',
  username: 'root',
  password: 'password',
  timeout: 60000,
  pool: { min: 1, max: 10 },
  options: {
    charset: 'utf8mb4',
    timezone: 'UTC',
    ssl: false,
    multipleStatements: false,
    reconnect: true
  }
});

// ✅ MongoDB - Complete Implementation  
await restified.createDatabaseClient('mongo', {
  type: 'mongodb',
  connectionString: 'mongodb://localhost:27017/testdb',
  // OR individual options:
  host: 'localhost',
  port: 27017,
  database: 'testdb',
  username: 'mongouser',
  password: 'mongopass',
  timeout: 30000,
  options: {
    authSource: 'admin',
    maxPoolSize: 10,
    retryWrites: true
  }
});

// ✅ SQLite - Complete Implementation
await restified.createDatabaseClient('sqlite', {
  type: 'sqlite',
  options: {
    filename: './test.db',        // File path or ':memory:'
    memory: false,               // In-memory database
    readonly: false,             // Read-only mode
    timeout: 5000,              // Busy timeout
    journalMode: 'WAL',         // Journal mode
    synchronous: 'NORMAL',      // Sync mode
    pragmas: {                  // Custom PRAGMA settings
      'foreign_keys': 'ON',
      'journal_size_limit': 67108864
    }
  }
});

// ✅ Redis - Complete Implementation
await restified.createDatabaseClient('redis', {
  type: 'redis',
  host: 'localhost',
  port: 6379,
  password: 'redispass',
  timeout: 10000,
  options: {
    database: 0,
    keyPrefix: 'app:',
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    commandTimeout: 5000
  }
});

// ✅ SQL Server - Complete Implementation
await restified.createDatabaseClient('mssql', {
  type: 'mssql',
  host: 'localhost',
  port: 1433,
  database: 'testdb',
  username: 'sa',
  password: 'YourStrong!Passw0rd',
  timeout: 15000,
  pool: { min: 0, max: 10 },
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000
  }
});

// 🚀 Enhanced Database Operations
// Setup test data across multiple databases
await restified.setupDatabaseState([
  {
    client: 'postgres',
    action: 'execute',
    sql: 'CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100))'
  },
  {
    client: 'postgres', 
    action: 'insert',
    table: 'users',
    data: [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' }
    ]
  },
  {
    client: 'redis',
    action: 'execute',
    sql: 'SET user:alice:session active EX 3600'
  }
]);

// Comprehensive validation across databases
const validation = await restified.validateDatabaseState([
  {
    client: 'postgres',
    table: 'users', 
    expectedCount: 2
  },
  {
    client: 'postgres',
    customQuery: 'SELECT COUNT(*) as count FROM users WHERE email LIKE $1',
    expectedResult: { count: { min: 1 } }
  },
  {
    client: 'redis',
    customQuery: 'EXISTS user:alice:session'
  }
]);

console.log('Validation result:', validation.success);

// Database health monitoring
const health = await restified.databaseHealthCheck();
console.log('Database health:', health);

// Cleanup after tests
await restified.cleanupDatabaseState([
  {
    client: 'postgres',
    action: 'execute', 
    sql: 'DROP TABLE IF EXISTS users'
  },
  {
    client: 'redis',
    action: 'execute',
    sql: 'DEL user:alice:session'
  }
]);

// Always disconnect when done
await restified.disconnectAllDatabases();
```

### **📋 Supported Database Types**

| Database                | Status      | Package Required           | Features                                                          |
| ----------------------- | ----------- | -------------------------- | ----------------------------------------------------------------- |
| **PostgreSQL**    | ✅ Complete | `pg`                     | Connection pooling, transactions, schemas, performance monitoring |
| **MySQL/MariaDB** | ✅ Complete | `mysql2`                 | Connection pooling, SSL, multiple statements, bulk operations     |
| **MongoDB**       | ✅ Complete | `mongodb`                | Replica sets, aggregation, GridFS, transactions                   |
| **SQLite**        | ✅ Complete | `sqlite3`                | In-memory/file, WAL mode, custom functions, backup/restore        |
| **Redis**         | ✅ Complete | `redis`                  | Clustering, pipelines, key patterns, data types                   |
| **SQL Server**    | ✅ Complete | `mssql`                  | Windows auth, encryption, bulk operations, stored procedures      |
| **Oracle**        | 🚧 Planned  | `oracledb`               | Enterprise features, wallet support                               |
| **Elasticsearch** | 🚧 Planned  | `@elastic/elasticsearch` | Search operations, indexing                                       |

### **📦 Installation**

```bash
# Install RestifiedTS
npm install restifiedts

# Install database drivers as needed
npm install pg              # PostgreSQL
npm install mysql2          # MySQL/MariaDB  
npm install mongodb         # MongoDB
npm install sqlite3         # SQLite
npm install redis           # Redis
npm install mssql           # SQL Server
```

### **🗂️ Dynamic JSON Fixtures**

```typescript
// Load and resolve JSON fixtures with variables
const userData = restified.loadJsonFixture('./fixtures/user.json');

// Resolve complex nested objects
const template = {
  user: {
    id: '{{userId}}',
    name: '{{$faker.person.fullName}}',
    settings: {
      theme: '{{userTheme}}',
      language: '{{$env.DEFAULT_LANGUAGE}}'
    }
  },
  metadata: {
    timestamp: '{{$date.now}}',
    requestId: '{{$random.uuid}}'
  }
};

const resolved = restified.resolveVariables(template);
```

**Supported Variable Types:**

- **Global/Local/Extracted**: `{{userId}}`, `{{authToken}}`
- **Faker.js**: `{{$faker.person.fullName}}`, `{{$faker.internet.email}}`
- **Random**: `{{$random.uuid}}`, `{{$random.number(1,100)}}`
- **Date/Time**: `{{$date.now}}`, `{{$date.timestamp}}`
- **Environment**: `{{$env.API_KEY}}`
- **Enterprise Utilities**: `{{$util.string.toUpperCase(hello)}}`, `{{$util.crypto.sha256(data)}}`, `{{$util.date.addDays({{now}}, 7, "YYYY-MM-DD")}}`

### **📋 Supported Test Types**

Generate comprehensive test suites with:

```bash
restifiedts scaffold -t "api,auth,graphql,websocket,database,performance,security"
```

- **`api`** - REST API testing with full HTTP method support
- **`auth`** - Authentication flows and token management
- **`graphql`** - GraphQL queries, mutations, and schema introspection
- **`websocket`** - Real-time WebSocket communication testing
- **`database`** - Database state validation and consistency checks
- **`performance`** - Load testing with K6 and Artillery integration
- **`security`** - Security testing with OWASP ZAP integration

---

## 📚 **Documentation**

### **Getting Started**

- [🚀 Quick Start Guide](./docs/getting-started/quick-start.md)
- [📖 Basic Concepts](./docs/getting-started/basic-concepts.md)
- [⚙️ Installation](./docs/getting-started/installation.md)

### **Configuration**

- [🔧 Configuration Guide](./docs/CONFIG-BASED-SETUP.md)
- [🔐 Authentication Setup](./docs/AUTOMATIC-HEADERS-AUTH.md)
- [🏢 Enterprise Features](./docs/ENTERPRISE-FEATURES.md)

### **Advanced Topics**

- [📊 Reporting &amp; Analytics](./docs/REPORTING-MADE-EASY.md)
- [👤 User Guide](./docs/USER-GUIDE.md)
- [🛡️ Security](./docs/SECURITY.md)
- [🔒 CLI Security Guide](./docs/CLI-SECURITY.md) - **New!**

### **Development**

- [🤝 Contributing](./docs/CONTRIBUTING.md)
- [📝 Changelog](./docs/CHANGELOG.md)
- [🔧 Claude AI Instructions](./docs/CLAUDE.md)
- [🏢 CLI Architecture](./src/cli/README.md)

---

## 🎯 **Core Features**

### **🔄 Fluent DSL**

```typescript
const response = await restified
  .given()
    .baseURL('https://api.example.com')
    .headers({ 'X-API-Key': 'secret' })
    .variable('userId', 123)
  .when()
    .get('/users/{{userId}}')
    .execute();

await response
  .statusCode(200)
  .jsonPath('$.name', 'Expected Name')
  .extract('$.id', 'extractedUserId')
  .execute();
```

### **⚡ High-Performance Connection Pooling**

```typescript
// HTTP/2 connection pooling for faster requests
const response = await restified
  .given()
    .connectionPool({
      keepAlive: true,
      maxSockets: 50,
      http2: true
    })
    .baseURL('https://api.example.com')
  .when()
    .get('/users')
    .execute();

// Monitor performance metrics
const metrics = restified.getConnectionMetrics();
console.log(`${metrics.cacheHitRatio}% connection reuse`);
```

### **🔄 Smart Retry with Monitoring**

```typescript
// Intelligent retry with comprehensive monitoring
const response = await restified
  .given()
    .retry({
      enabled: true,
      maxAttempts: 3,
      baseDelay: 1000,
      retryOnStatusCodes: [429, 500, 502, 503, 504]
    })
    .baseURL('https://api.example.com')
  .when()
    .get('/users')
    .execute();

// Monitor retry statistics
const retryStats = restified.getRetryStats();
console.log(`${retryStats.successAfterRetry} successful retries`);
```

### **📊 Advanced Assertions**

```typescript
await response
  .statusCode(200)
  .header('Content-Type', 'application/json')
  .jsonPath('$.data[*].id', (ids) => ids.length > 0)
  .jsonSchema(userSchema)
  .responseTime((time) => time < 500)
  .execute();
```

### **⏱️ Sleep/Wait Methods**

RestifiedTS provides **three flexible approaches** for adding delays in your API tests:

#### **🔗 1. Independent Sleep/Wait (Between DSL Calls)**

```typescript
// Between requests or anywhere in test flow
const response1 = await restified.given()
  .baseURL('https://api.example.com')
.when()
  .get('/users/1')
  .execute();

response1.statusCode(200);

// Independent sleep - not part of DSL chain
await restified.sleep(2000);  // 2 seconds
await restified.wait(1000);   // 1 second (alias for sleep)

// Continue with next request
const response2 = await restified.given()
  .baseURL('https://api.example.com')
.when()
  .get('/users/2')
  .execute();

response2.statusCode(200);
```

#### **⚡ 2. WhenStep Sleep (Before HTTP Request)**

```typescript
// Sleep accumulates in WhenStep before making HTTP request
const response = await restified.given()
  .baseURL('https://api.example.com')
.when()
  .sleep(2000)   // 2 seconds
  .wait(1000)    // + 1 second  
  .sleep(2000)   // + 2 seconds = 5 seconds total
  .get('/users/delayed')  // HTTP request happens after 5-second delay
  .execute();

response.statusCode(200);
```

#### **✨ 3. ThenStep Sleep (After Assertions)**

```typescript
// Sleep after assertions for timing-sensitive scenarios
const response = await restified.given()
  .baseURL('https://api.example.com')
.when()
  .get('/users/process')
  .execute();

// Sleep after assertions (useful for async processing)
await response
  .statusCode(202)  // Processing started
  .jsonPath('$.status', 'processing')
  .sleep(5000);     // Wait 5 seconds for processing to complete

// Follow up with status check
const statusResponse = await restified.given()
  .baseURL('https://api.example.com')
.when()
  .get('/users/process/status')
  .execute();

statusResponse.statusCode(200).jsonPath('$.status', 'completed');
```

#### **🚀 Real-World Use Cases**

```typescript
// Rate limiting compliance
for (let i = 1; i <= 3; i++) {
  await restified.given()
    .baseURL('https://api.example.com')
  .when()
    .get(`/users/${i}`)
    .execute()
  .then()
    .statusCode(200);
  
  // Rate limit: 1 request per second
  if (i < 3) await restified.sleep(1000);
}

// Async processing workflow
await restified.given()
  .baseURL('https://api.example.com')
.when()
  .post('/jobs/start', { task: 'process-data' })
  .execute()
.then()
  .statusCode(202);

// Wait for processing
await restified.sleep(3000);

// Check job status
await restified.given()
  .baseURL('https://api.example.com')
.when()
  .get('/jobs/status')
  .execute()
.then()
  .statusCode(200)
  .jsonPath('$.status', 'completed');

// Simulating user interaction delays
await restified.given()
  .baseURL('https://api.example.com')
.when()
  .sleep(1500)  // Simulate user thinking time
  .post('/cart/add', { productId: 123 })
  .execute()
.then()
  .statusCode(201);

await restified.sleep(2000);  // User reviews cart

await restified.given()
  .baseURL('https://api.example.com')
.when()
  .post('/checkout/start')
  .execute()
.then()
  .statusCode(200);
```

#### **⚙️ Sleep Method Features**

✅ **Three Flexible Approaches**: Independent, WhenStep, and ThenStep  
✅ **Accumulative WhenStep**: Multiple `.sleep()` calls add up before HTTP request  
✅ **Both Aliases**: `.sleep()` and `.wait()` available in all contexts  
✅ **Fluent API**: Maintains clean method chaining  
✅ **Non-Breaking**: Doesn't affect existing RestifiedTS functionality  
✅ **Type-Safe**: Full TypeScript support with proper return types  
✅ **Use Case Optimized**: Perfect for rate limiting, async processing, and user simulation

### **🔄 Smart Retry System with Exponential Backoff**

RestifiedTS includes **intelligent retry mechanisms** with exponential backoff, jitter, and comprehensive error handling for maximum reliability in unstable network conditions.

#### **🎯 1. Basic Retry Configuration**

```typescript
// Enable smart retries for better reliability
const response = await restified.given()
  .retry({
    enabled: true,           // Enable retry mechanism (default: true)
    maxAttempts: 3,         // Max retry attempts (default: 3)
    baseDelay: 1000,        // Base delay in ms (default: 1000)
    backoffMultiplier: 2,   // Exponential backoff (default: 2)
    enableJitter: true,     // Add jitter to prevent thundering herd (default: true)
    retryOnStatusCodes: [408, 429, 500, 502, 503, 504] // Retry conditions
  })
  .baseURL('https://api.example.com')
.when()
  .get('/users')
  .execute();

response.statusCode(200);
```

#### **⚡ 2. Advanced Retry Strategies**

```typescript
// Custom retry conditions and callbacks
await restified.given()
  .retry({
    enabled: true,
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 30000,        // Cap maximum delay at 30s
    retryOnNetworkError: true,
    retryOnTimeout: true,
    
    // Custom retry condition
    retryCondition: (error, attempt) => {
      // Retry on specific conditions
      if (error.response?.status === 429) return true;  // Rate limited
      if (error.code === 'ECONNREFUSED') return true;   // Connection refused
      if (attempt < 3 && error.response?.status >= 500) return true;
      return false;
    },
    
    // Retry callback for logging/monitoring
    onRetry: (error, attempt, delay) => {
      console.log(`🔄 Retry attempt ${attempt} after ${delay}ms: ${error.message}`);
    },
    
    // Max attempts callback
    onMaxAttemptsReached: (error, attempts) => {
      console.error(`❌ Failed after ${attempts} attempts: ${error.message}`);
    }
  })
  .baseURL('https://unreliable-api.example.com')
.when()
  .get('/flaky-endpoint')
  .execute();
```

#### **🌐 3. Global Retry Configuration**

```typescript
// Configure retry behavior globally for all requests
const restifiedWithRetry = new Restified({
  retry: {
    enabled: true,
    maxAttempts: 3,
    baseDelay: 1000,
    retryOnStatusCodes: [429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    retryOnTimeout: true
  },
  connectionPool: {
    keepAlive: true,
    maxSockets: 20
  }
});

// All requests automatically use the global retry configuration
const response1 = await restifiedWithRetry.given()
  .baseURL('https://api1.example.com')
.when()
  .get('/data')
  .execute();

// Override global config for specific requests
const response2 = await restifiedWithRetry.given()
  .retry({
    enabled: true,
    maxAttempts: 1,  // Override: no retries for this request
    baseDelay: 0
  })
  .baseURL('https://api2.example.com')
.when()
  .get('/fast-endpoint')
  .execute();
```

#### **📊 4. Retry Monitoring and Analytics**

```typescript
// Monitor retry behavior and performance
describe('API Reliability Testing', () => {
  beforeEach(() => {
    restified.resetRetryStats();  // Clear stats for each test
  });

  it('should handle transient failures gracefully', async () => {
    // Simulate multiple API calls with potential failures
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      const request = restified.given()
        .retry({
          enabled: true,
          maxAttempts: 3,
          baseDelay: 200
        })
        .baseURL('https://api.example.com')
      .when()
        .get(`/endpoint-${i}`)
        .execute()
      .then(response => response.statusCode(200))
      .catch(error => console.log(`Request ${i} failed: ${error.message}`));
      
      requests.push(request);
    }
    
    await Promise.all(requests);
    
    // Analyze retry statistics
    const retryStats = restified.getRetryStats();
    console.log('📊 Retry Statistics:');
    console.log(`   Total requests: ${retryStats.totalRequests}`);
    console.log(`   Requests that needed retries: ${retryStats.retriedRequests}`);
    console.log(`   Total retry attempts: ${retryStats.totalRetryAttempts}`);
    console.log(`   Success after retry: ${retryStats.successAfterRetry}`);
    console.log(`   Failed after max retries: ${retryStats.failedAfterMaxRetries}`);
    
    // Get performance metrics and recommendations
    const metrics = restified.getRetryMetrics();
    console.log('📈 Performance Metrics:');
    console.log(`   Retry rate: ${metrics.retryRate.toFixed(2)}%`);
    console.log(`   Success rate after retry: ${metrics.successRateAfterRetry.toFixed(2)}%`);
    console.log(`   Average retry delay: ${metrics.averageRetryDelay.toFixed(2)}ms`);
    
    // Get actionable recommendations
    const recommendations = restified.getRetryRecommendations();
    console.log('💡 Recommendations:');
    recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));
  });
});
```

#### **🏭 5. Enterprise Scenarios**

```typescript
// Microservices with different retry strategies
describe('Microservices Retry Strategies', () => {
  it('should use different retry configs per service', async () => {
    // User service - fast retries for better UX
    const userServiceConfig = {
      enabled: true,
      maxAttempts: 2,
      baseDelay: 200,
      maxDelay: 2000,
      retryOnStatusCodes: [429, 502, 503]
    };

    // Payment service - more aggressive retries for critical operations
    const paymentServiceConfig = {
      enabled: true,
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 10000,
      retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
      onRetry: (error, attempt, delay) => {
        console.log(`💳 Payment retry ${attempt}: ${error.message}`);
      }
    };

    // Analytics service - fewer retries, non-critical
    const analyticsServiceConfig = {
      enabled: true,
      maxAttempts: 2,
      baseDelay: 500,
      retryOnStatusCodes: [503, 504]  // Only retry on service unavailable
    };

    // Execute requests with service-specific retry strategies
    const [userResponse, paymentResponse, analyticsResponse] = await Promise.allSettled([
      restified.given()
        .retry(userServiceConfig)
        .baseURL('https://users.company.com')
      .when()
        .get('/profile')
        .execute(),

      restified.given()
        .retry(paymentServiceConfig)
        .baseURL('https://payments.company.com')
      .when()
        .post('/charge', { amount: 100, currency: 'USD' })
        .execute(),

      restified.given()
        .retry(analyticsServiceConfig)
        .baseURL('https://analytics.company.com')
      .when()
        .post('/events', { action: 'purchase', userId: 123 })
        .execute()
    ]);

    // Handle results with different expectations per service
    if (userResponse.status === 'fulfilled') {
      userResponse.value.statusCode(200);
    }
    
    if (paymentResponse.status === 'fulfilled') {
      paymentResponse.value.statusCode(200);
    }
    
    // Analytics is optional - don't fail test if it fails
    if (analyticsResponse.status === 'rejected') {
      console.log('⚠️ Analytics service unavailable, continuing...');
    }
  });
});

// Circuit breaker pattern preparation
describe('Circuit Breaker Preparation', () => {
  it('should collect failure data for circuit breaker decisions', async () => {
    const failingEndpoint = '/always-fails';
    const attempts = 10;
    
    for (let i = 0; i < attempts; i++) {
      try {
        await restified.given()
          .retry({
            enabled: true,
            maxAttempts: 2,
            baseDelay: 100
          })
          .baseURL('https://api.example.com')
        .when()
          .get(failingEndpoint)
          .execute();
      } catch (error) {
        // Expected failures
      }
    }
    
    const retryStats = restified.getRetryStats();
    const failureRate = (retryStats.failedAfterMaxRetries / retryStats.totalRequests) * 100;
    
    console.log(`🔴 Failure rate for ${failingEndpoint}: ${failureRate.toFixed(2)}%`);
    
    // Circuit breaker decision logic
    if (failureRate > 50) {
      console.log('🚨 Circuit breaker should OPEN - too many failures');
    } else if (failureRate > 20) {
      console.log('⚠️ Circuit breaker should be HALF-OPEN - monitoring');
    } else {
      console.log('✅ Circuit breaker CLOSED - service healthy');
    }
  });
});
```

#### **⚙️ Retry Configuration Options**

```typescript
interface RetryConfig {
  enabled?: boolean;                    // Enable retry mechanism (default: true)
  maxAttempts?: number;                // Maximum retry attempts (default: 3)
  baseDelay?: number;                  // Base delay in ms (default: 1000)
  maxDelay?: number;                   // Maximum delay in ms (default: 30000)
  backoffMultiplier?: number;          // Exponential backoff multiplier (default: 2)
  enableJitter?: boolean;              // Add jitter to prevent thundering herd (default: true)
  jitterFactor?: number;               // Jitter percentage (default: 0.1 = 10%)
  retryOnStatusCodes?: number[];       // HTTP codes to retry (default: [408, 429, 500, 502, 503, 504])
  retryOnNetworkError?: boolean;       // Retry on network errors (default: true)
  retryOnTimeout?: boolean;            // Retry on timeout (default: true)
  retryCondition?: (error: any, attempt: number) => boolean;  // Custom retry logic
  onRetry?: (error: any, attempt: number, delay: number) => void;  // Retry callback
  onMaxAttemptsReached?: (error: any, attempts: number) => void;   // Max attempts callback
}
```

#### **🎯 Retry Benefits & Features**

✅ **Intelligent Backoff**: Exponential backoff with jitter prevents thundering herd  
✅ **Configurable Conditions**: Retry on specific status codes, network errors, or custom conditions  
✅ **Comprehensive Monitoring**: Detailed statistics and performance metrics  
✅ **Global Configuration**: Set retry behavior once, apply everywhere  
✅ **Per-Request Override**: Fine-tune retry behavior for specific endpoints  
✅ **Enterprise Ready**: Circuit breaker preparation, failure analysis, recommendations  
✅ **Callback Support**: Custom logging, monitoring, and alerting integration  
✅ **Network Resilience**: Handle timeouts, connection failures, and transient errors  
✅ **Performance Optimized**: Jitter and delay caps prevent resource exhaustion  
✅ **Backward Compatible**: Works seamlessly with all existing RestifiedTS features

### **🚀 HTTP Connection Pooling & Performance**

RestifiedTS includes **advanced connection pooling** with HTTP/2 support for enterprise-grade performance and efficiency. Achieve **20-40% faster request times** through intelligent connection reuse.

#### **🔗 1. Basic Connection Pooling**

```typescript
// Enable connection pooling for performance
const response = await restified.given()
  .connectionPool({
    keepAlive: true,      // Reuse connections (default: true)
    maxSockets: 50,       // Max concurrent connections (default: 50)
    maxFreeSockets: 10,   // Max idle connections to keep (default: 10)
    http2: true,          // Enable HTTP/2 where supported (default: true)
    timeout: 30000        // Connection timeout (default: 30000ms)
  })
  .baseURL('https://api.example.com')
.when()
  .get('/users')
  .execute();

response.statusCode(200);
```

#### **⚡ 2. High-Performance Configuration**

```typescript
// Optimized for high-throughput APIs
await restified.given()
  .connectionPool({
    keepAlive: true,
    maxSockets: 100,           // Higher concurrency
    maxFreeSockets: 20,        // More idle connections
    http2: true,               // HTTP/2 multiplexing
    keepAliveMsecs: 60000,     // Keep connections alive for 60s
    noDelay: true,             // TCP_NODELAY for lower latency
    keepAliveInitialDelay: 1000 // Probe delay
  })
  .baseURL('https://api.high-performance.com')
.when()
  .get('/data')
  .execute();
```

#### **🌐 3. Microservices Architecture**

```typescript
// Different pool configs for different services
const userServiceConfig = {
  keepAlive: true,
  maxSockets: 30,
  http2: true
};

const orderServiceConfig = {
  keepAlive: true,
  maxSockets: 50,    // Orders service needs more connections
  http2: true,
  timeout: 45000     // Longer timeout for complex operations
};

// User service request
const userResponse = await restified.given()
  .connectionPool(userServiceConfig)
  .baseURL('https://users.company.com')
.when()
  .get('/profile')
  .execute();

// Order service request
const orderResponse = await restified.given()
  .connectionPool(orderServiceConfig)
  .baseURL('https://orders.company.com')
.when()
  .post('/create', { userId: 123, items: [...] })
  .execute();
```

#### **📊 4. Performance Monitoring**

```typescript
// Make requests with connection pooling
for (let i = 0; i < 10; i++) {
  await restified.given()
    .connectionPool({ keepAlive: true, maxSockets: 5, http2: true })
    .baseURL('https://api.example.com')
  .when()
    .get(`/posts/${i}`)
    .execute()
  .then()
    .statusCode(200);
}

// Get connection statistics
const stats = restified.getConnectionStats();
console.log('📊 Connection Pool Statistics:');
console.log(`   Total requests: ${stats.totalRequests}`);
console.log(`   Cache hits: ${stats.cacheHits}`);
console.log(`   Active connections: ${stats.activeConnections}`);
console.log(`   Free connections: ${stats.freeConnections}`);

// Get performance metrics
const metrics = restified.getConnectionMetrics();
console.log('📈 Performance Metrics:');
console.log(`   Cache hit ratio: ${metrics.cacheHitRatio.toFixed(2)}%`);
console.log(`   Avg connection reuse: ${metrics.averageConnectionReuse.toFixed(2)}`);
console.log(`   HTTP/2 usage: ${metrics.http2Usage.toFixed(2)}%`);
console.log(`   Pool efficiency: ${metrics.poolEfficiency.toFixed(2)}%`);

// Reset stats for next test
restified.resetConnectionStats();
```

#### **🏭 5. Enterprise Load Testing**

```typescript
// Simulate high-load scenarios
describe('Load Testing with Connection Pooling', () => {
  const concurrentRequests = 100;
  const connectionPool = {
    keepAlive: true,
    maxSockets: 20,        // Limit connections to test pooling
    maxFreeSockets: 5,
    http2: true,
    timeout: 10000
  };

  it('should handle 100 concurrent requests efficiently', async () => {
    const startTime = Date.now();
    
    // Create array of concurrent requests
    const requests = Array.from({ length: concurrentRequests }, (_, i) =>
      restified.given()
        .connectionPool(connectionPool)
        .baseURL('https://api.example.com')
      .when()
        .get(`/posts/${i % 10}`)  // Cycle through 10 posts
        .execute()
      .then(response => {
        response.statusCode(200);
        return response;
      })
    );

    // Execute all requests concurrently
    await Promise.all(requests);
    
    const totalTime = Date.now() - startTime;
    const stats = restified.getConnectionStats();
    const metrics = restified.getConnectionMetrics();
    
    console.log(`⚡ Load Test Results:`);
    console.log(`   ${concurrentRequests} requests in ${totalTime}ms`);
    console.log(`   Average: ${(totalTime/concurrentRequests).toFixed(2)}ms per request`);
    console.log(`   Connection reuse: ${metrics.averageConnectionReuse.toFixed(2)}x`);
    console.log(`   Cache hit ratio: ${metrics.cacheHitRatio.toFixed(2)}%`);
    
    // Verify connection pooling effectiveness
    expect(metrics.cacheHitRatio).to.be.greaterThan(50); // At least 50% reuse
    expect(stats.totalRequests).to.equal(concurrentRequests);
  });
});
```

#### **🔧 6. Real-World Use Cases**

```typescript
// E-commerce checkout flow with connection pooling
describe('E-commerce Checkout with Optimized Connections', () => {
  const checkoutPooling = {
    keepAlive: true,
    maxSockets: 15,      // Balanced for checkout operations
    http2: true,
    timeout: 30000       // Higher timeout for payment processing
  };

  it('should optimize connections across checkout steps', async () => {
    // Step 1: Add items to cart
    const cartResponse = await restified.given()
      .connectionPool(checkoutPooling)
      .baseURL('https://api.shop.com')
      .bearerToken('{{authToken}}')
    .when()
      .post('/cart/add', { productId: 123, quantity: 2 })
      .execute();

    cartResponse.statusCode(200).extract('$.cartId', 'cartId');

    // Step 2: Calculate shipping (reuses connection)
    const shippingResponse = await restified.given()
      .connectionPool(checkoutPooling)
      .baseURL('https://api.shop.com')
      .bearerToken('{{authToken}}')
    .when()
      .post('/shipping/calculate', {
        cartId: '{{cartId}}',
        address: { zip: '12345', country: 'US' }
      })
      .execute();

    shippingResponse.statusCode(200).extract('$.shippingCost', 'shippingCost');

    // Step 3: Process payment (reuses connection again)
    const paymentResponse = await restified.given()
      .connectionPool(checkoutPooling)
      .baseURL('https://api.shop.com')
      .bearerToken('{{authToken}}')
    .when()
      .post('/payments/process', {
        cartId: '{{cartId}}',
        amount: '{{totalAmount}}',
        method: 'credit_card'
      })
      .execute();

    paymentResponse.statusCode(200).extract('$.orderId', 'orderId');

    // Verify connection efficiency
    const metrics = restified.getConnectionMetrics();
    console.log(`🛒 Checkout completed with ${metrics.averageConnectionReuse.toFixed(2)}x connection reuse`);
    
    // Connection pooling should show significant reuse
    expect(metrics.cacheHitRatio).to.be.greaterThan(60); // 60%+ connection reuse
  });
});

// API rate limiting compliance with connection pooling
describe('Rate Limiting with Connection Pooling', () => {
  it('should respect rate limits while optimizing connections', async () => {
    const rateLimitedPool = {
      keepAlive: true,
      maxSockets: 5,       // Limit concurrent connections
      http2: false,        // Some rate-limited APIs prefer HTTP/1.1
      timeout: 15000
    };

    // Make requests with rate limiting delay
    for (let i = 1; i <= 10; i++) {
      const response = await restified.given()
        .connectionPool(rateLimitedPool)
        .baseURL('https://api.rate-limited.com')
        .header('X-API-Key', '{{apiKey}}')
      .when()
        .get(`/data/${i}`)
        .execute();

      response.statusCode(200);

      // Rate limit: 1 request per second, but connections stay alive
      if (i < 10) await restified.sleep(1000);
    }

    const stats = restified.getConnectionStats();
    console.log(`🐌 Rate limited requests: ${stats.totalRequests}`);
    console.log(`🔄 Connection reuse despite rate limiting: ${stats.cacheHits}`);
  });
});
```

#### **⚙️ Connection Pool Configuration Options**

```typescript
interface ConnectionPoolConfig {
  keepAlive?: boolean;              // Enable connection reuse (default: true)
  maxSockets?: number;              // Max concurrent connections per host (default: 50)
  maxFreeSockets?: number;          // Max idle connections to keep (default: 10)
  timeout?: number;                 // Connection timeout in ms (default: 30000)
  http2?: boolean;                  // Enable HTTP/2 support (default: true)
  keepAliveMsecs?: number;          // Keep-alive timeout in ms (default: 60000)
  noDelay?: boolean;                // Enable TCP_NODELAY (default: true)
  keepAliveInitialDelay?: number;   // Keep-alive probe delay in ms (default: 1000)
}
```

#### **🎯 Performance Benefits**

✅ **20-40% Faster Requests**: Connection reuse eliminates handshake overhead  
✅ **HTTP/2 Multiplexing**: Multiple requests over single connection  
✅ **Reduced Latency**: TCP_NODELAY and optimized socket handling  
✅ **Better Resource Usage**: Controlled connection limits prevent exhaustion  
✅ **Automatic Compression**: Gzip/Brotli/Deflate support built-in  
✅ **TLS Optimization**: Session reuse for HTTPS connections  
✅ **Statistics & Monitoring**: Built-in performance metrics  
✅ **Enterprise Ready**: Handles thousands of concurrent requests efficiently  
✅ **Backward Compatible**: Works with all existing RestifiedTS features  
✅ **Zero Configuration**: Sensible defaults, optional optimization

### **🔄 Enterprise Utility System**

**130+ Built-in Utilities** across 12 categories with complete user-defined formatting:

```typescript
// String utilities
restified.stringUtil('toUpperCase', 'hello world');          // "HELLO WORLD"
restified.stringUtil('camelCase', 'hello world');            // "helloWorld"

// Date utilities with flexible formatting
restified.dateUtil('addDays', '2024-01-01', 7);              // ISO format (default)
restified.dateUtil('addDays', '2024-01-01', 7, 'YYYY-MM-DD'); // "2024-01-08"
restified.dateUtil('addDays', '2024-01-01', 7, 'timestamp');  // 1704758400000
restified.dateUtil('now', 'DD/MM/YYYY HH:mm:ss');            // "15/06/2024 14:30:45"

// Crypto utilities
restified.cryptoUtil('sha256', 'hello world');               // SHA256 hash
restified.cryptoUtil('generateJWT', { userId: 123 }, 'secret'); // JWT token

// Random data generation
restified.randomUtil('uuid');                                // UUID v4
restified.randomUtil('email', 'company.com');               // Random email

// Data transformation
restified.dataUtil('csvStringify', data);                   // Convert to CSV
restified.dataUtil('objectPath', user, 'profile.name');     // Extract nested value

// Validation utilities
restified.validationUtil('isEmail', 'test@example.com');    // true/false
restified.validationUtil('isUUID', uuid);                   // true/false

// Security utilities
restified.securityUtil('generateApiKey', 32, 'api');        // Secure API key
restified.securityUtil('maskSensitiveData', 'credit-card'); // Data masking

// File operations (async)
await restified.fileUtil('writeFile', 'output.txt', 'content');
await restified.fileUtil('readFile', 'input.txt');

// Network utilities
restified.networkUtil('parseUrl', 'https://api.example.com/users?page=1');
restified.networkUtil('buildUrl', 'https://api.example.com', { page: 1, limit: 10 });

// Encoding utilities
restified.encodingUtil('base64Encode', 'hello world');      // Base64 encoding
restified.encodingUtil('urlEncode', 'hello world');         // URL encoding
```

### **🔄 Variable System with Utilities**

```typescript
// Template variables with enterprise utilities
restified.setVariable('email', '{{$faker.internet.email}}');
restified.setVariable('uuid', '{{$random.uuid}}');
restified.setVariable('futureDate', '{{$util.date.addMonths({{$date.now}}, 3, "YYYY-MM-DD")}}');
restified.setVariable('hashedPassword', '{{$util.crypto.sha256({{password}})}}');

// Use in requests with automatic utility resolution
.post('/users', {
  email: '{{email}}',
  id: '{{uuid}}',
  activationDate: '{{futureDate}}',
  passwordHash: '{{hashedPassword}}'
})

// Complex utility chains in variables
const template = {
  user: {
    id: '{{$util.random.uuid}}',
    name: '{{$util.string.toUpperCase({{userName}})}}',
    email: '{{$util.string.toLowerCase({{userEmail}})}}',
    createdAt: '{{$util.date.now("ISO")}}',
    expiresAt: '{{$util.date.addYears({{$util.date.now}}, 1, "timestamp")}}',
    apiKey: '{{$util.security.generateApiKey(32, "user")}}',
    hash: '{{$util.crypto.sha256({{$util.string.join([{{id}}, {{name}}], "-")}})}}',
    isValid: '{{$util.validation.isEmail({{email}})}}'
  }
};
```

### **🔌 Custom Utility Plugins**

```typescript
// Register custom utilities
restified.registerCustomUtility('business', 'calculateTax', 
  (amount, rate) => amount * rate, {
    description: 'Calculates tax amount',
    parameters: [
      { name: 'amount', type: 'number', required: true, description: 'Base amount' },
      { name: 'rate', type: 'number', required: true, description: 'Tax rate' }
    ]
  }
);

// Use custom utilities
const tax = restified.utility('business.calculateTax', 100, 0.08);
console.log(tax.value); // 8

// Or in variable resolution
restified.setVariable('totalWithTax', '{{$util.business.calculateTax({{amount}}, 0.08)}}');
```

---

## 🏗️ **Architecture**

RestifiedTS follows a layered enterprise architecture:

```
┌─────────────────────────────────────────┐
│              DSL Layer                  │
│  (GivenStep → WhenStep → ThenStep)     │
├─────────────────────────────────────────┤
│            Service Layer                │
│   (HTTP, GraphQL, WebSocket clients)   │
├─────────────────────────────────────────┤
│              Data Layer                 │
│  (Variables, Responses, Snapshots)     │
├─────────────────────────────────────────┤
│          Infrastructure Layer           │
│    (Auth, Config, Reporting, CLI)      │
└─────────────────────────────────────────┘
```

---

## 🛠️ **CLI Tools**

### **🎯 Complete CLI Commands Reference**

RestifiedTS provides a comprehensive CLI with enhanced security and enterprise features:

```bash
# 🚀 Initialize new project with AI-powered wizard (RECOMMENDED)
restifiedts init --interactive               # Interactive wizard with smart recommendations
restifiedts init MyProject --quick           # Quick setup with minimal questions
restifiedts init --analyze-only --url "https://api.example.com"  # API analysis only

# 🏗️ Scaffold enterprise test suite
restifiedts scaffold -n "MyAPI" -t "api,auth,database" -u "https://api.example.com"
restifiedts scaffold -n "Enterprise" -c "enterprise" -t "api,auth,performance,security"

# 📊 Run tests with enhanced options
restifiedts test --pattern "tests/**/*.ts" --reporter "restified-html"
restifiedts test --reporter mocha --timeout 10000

# ⚙️ Configuration management
restifiedts config show                      # Display current configuration
restifiedts config validate                  # Validate configuration files
restifiedts config health                    # Run configuration health check

# 🔨 Generate components and templates
restifiedts generate test UserAPI            # Generate test file
restifiedts generate config                  # Generate configuration file
restifiedts generate auth                    # Generate authentication tests

# 📈 Advanced reporting
restifiedts report --open --format html      # Generate and open HTML report
restifiedts report --format json --output ./reports  # JSON format with custom output

# 🛠️ Legacy support (maintained for backward compatibility)
restifiedts init-config --force              # Generate restified.config.ts only
restifiedts create --interactive             # Alias for init --interactive
```

### **🚀 Enhanced Project Initialization & Scaffolding**

**Recommended Approach - Interactive Initialization:**

```bash
# 🆕 AI-powered interactive wizard (RECOMMENDED)
restifiedts init --interactive
# Features: API analysis, smart recommendations, enterprise templates

# Quick setup for experienced users
restifiedts init MyProject --quick --url "https://api.example.com"
```

**Traditional Scaffolding:**

```bash
# Enterprise-grade test suite scaffolding
restifiedts scaffold -n "MyCompanyAPI" -t "api,auth,performance,security" -u "https://api.mycompany.com"

# Available Options:
# -n, --name <name>          Test suite name (default: "MyAPI") 
# -t, --types <types>        Test types: api,auth,database,performance,security,graphql,websocket
# -u, --url <url>           Base API URL (default: jsonplaceholder.typicode.com)
# -o, --output <dir>        Output directory (defaults to project name)
# -c, --complexity <level>  Configuration complexity: minimal|standard|enterprise
# -f, --force               Overwrite existing files
```

### **What Gets Generated**

```bash
your-api-tests/
├── 📄 restified.config.ts     # Enterprise configuration
├── 📄 package.json           # Complete dependencies & scripts
├── 📄 tsconfig.json          # TypeScript configuration
├── 📄 .env.example           # Environment template
├── 📄 README.md              # Complete usage guide
├── 📁 setup/
│   └── 📄 global-setup.ts    # Automatic auth & client setup
├── 📁 tests/
│   ├── 📄 api-tests.ts       # Comprehensive API tests
│   ├── 📄 auth-tests.ts      # Authentication tests
│   └── 📄 performance-tests.ts # Performance testing
└── 📁 reports/               # Generated after tests
```

### **🛡️ CLI Security Enhancements**

RestifiedTS CLI includes enterprise-grade security features:

- **🔒 Path Traversal Protection**: Prevents `../../../` directory attacks
- **🛡️ Command Injection Prevention**: Blocks malicious shell commands
- **✅ Input Validation**: Comprehensive validation for all user inputs
- **🔐 Safe File Operations**: Async operations with proper error handling
- **📋 Security Auditing**: Built-in security validation for project setup

### **Ready to Use**

```bash
# ✅ Initialize with interactive wizard (RECOMMENDED)
restifiedts init --interactive

# ✅ Scaffold enterprise test suites
restifiedts scaffold -n "MyAPI" -t "api,auth"

# ✅ Run comprehensive examples with enterprise config
npm run examples

# ✅ Generate detailed HTML reports  
npm run report:restified

# ✅ Build and development
npm run build
npm run lint
```

---

## 🔧 **Configuration Example**

Complete `restified.config.ts` for enterprise environments:

```typescript
import { RestifiedConfig } from 'restifiedts';

const config: RestifiedConfig = {
  // Multi-environment support
  environment: {
    name: process.env.TEST_ENV || 'staging',
    datacenter: process.env.DATACENTER || 'us-east-1',
    cluster: process.env.CLUSTER || 'production'
  },

  // Microservices configuration
  clients: {
    api: {
      baseURL: process.env.API_GATEWAY_URL,
      timeout: 10000,
      headers: { 'X-Service': 'api-gateway' }
    },
    userService: {
      baseURL: process.env.USER_SERVICE_URL,
      timeout: 8000,
      headers: { 'X-Service': 'user-service' }
    }
  },

  // Complete authentication configuration with credentials
  authentication: {
    // Authentication endpoint and client
    endpoint: '/auth/login',         // Login endpoint
    method: 'POST',                  // HTTP method for auth request
    client: 'api',                   // Which client to use for auth request
    
    // Login credentials (from environment variables for security)
    credentials: {
      email: process.env.TEST_USERNAME || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'password123'
    },
    
    // Token extraction from authentication response
    extractors: {
      token: '$.access_token',       // Extract token from response
      userEmail: '$.user.email',     // Extract user email  
      userId: '$.user.id',           // Extract user ID
      roles: '$.roles'               // Extract user roles
    },
    
    // Automatically apply token to specified clients
    autoApplyToClients: ['api', 'userService', 'orderService'], // Apply to specific clients
    authHeaderName: 'Authorization', // Header name for auth token
    
    // Fallback for CI/CD environments
    fallback: {
      enabled: true,
      token: process.env.FALLBACK_TOKEN || 'ci-cd-token',
      userEmail: process.env.FALLBACK_EMAIL || 'ci-cd@company.com',
      userId: parseInt(process.env.FALLBACK_USER_ID || '999')
    }
  },

  // Global enterprise headers
  globalHeaders: {
    'X-Tenant-ID': process.env.TENANT_ID,
    'X-Trace-ID': '{{$random.uuid}}',
    'X-Compliance-Mode': 'strict'
  },

  // Comprehensive reporting
  reporting: {
    enabled: true,
    formats: ['html', 'json', 'junit'],
    includeMetrics: true,
    includeCompliance: true
  }
};

export default config;
```

### **🔐 How Authentication Works**

RestifiedTS provides automatic authentication with token extraction and multi-client application:

#### **1. Initial Authentication Request**
```typescript
// Framework automatically makes this request during setup:
const authResponse = await restified
  .given()
    .useClient('api')                    // Uses specified auth client
    .header('Content-Type', 'application/json')
  .when()
    .post('/auth/login', {               // POST to auth endpoint
      // Request body created from credentials config:
      // Email/password: { email: 'user@example.com', password: 'pass123' }
      // Username/password: { username: 'john_doe', password: 'pass123' }
      // Custom fields: { employeeId: 'EMP001', pin: '1234' }
    })
    .execute();
```

#### **2. Token Extraction**
```typescript
// Framework extracts tokens using JSONPath extractors:
await authResponse
  .statusCode(200)
  .extract('$.access_token', 'globalAuthToken')    // Saves as global variable
  .extract('$.user.email', 'globalUserEmail')      // Saves user info
  .extract('$.user.id', 'globalUserId')            // Saves user ID
  .execute();
```

#### **3. Automatic Token Application**
```typescript
// When autoApplyToClients is configured:
const authToken = restified.getVariable('globalAuthToken');
restified.addAuthTokenToClients(['api', 'userService', 'orderService'], authToken, 'Authorization');

// Now specified client requests automatically include:
// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **4. Usage in Tests**
```typescript
// Tests can use authenticated clients without additional setup:
await restified
  .given()
    .useClient('api')         // Already has auth token applied
  .when()
    .get('/users/profile')    // Request includes Authorization header
  .then()
    .status(200)
    .execute();
```

**Environment Variables for Secure Credentials:**
```bash
# .env file - Choose appropriate variables for your API

# Option 1: Email/password authentication
API_USERNAME=admin@company.com
API_PASSWORD=secure_password_123

# Option 2: Username/password authentication  
API_USERNAME=john_smith
API_PASSWORD=secure_password_123

# Option 3: Employee/corporate authentication
EMPLOYEE_ID=EMP001
PIN=1234
DEPARTMENT=IT

# Option 4: OAuth2 client credentials
CLIENT_ID=your-client-id-here
CLIENT_SECRET=your-client-secret-here

# Fallback and configuration
FALLBACK_TOKEN=ci-cd-backup-token
AUTH_APPLY_TO_CLIENTS=api,userService  # Or 'all'
AUTH_ENDPOINT=/auth/login              # Your actual login endpoint
```

**Multiple Authentication Examples:**
```typescript
// Email/password configuration
authentication: {
  endpoint: '/auth/login',
  credentials: {
    email: process.env.API_USERNAME,
    password: process.env.API_PASSWORD
  },
  extractors: { token: '$.access_token' }
}

// Username/password configuration  
authentication: {
  endpoint: '/api/authenticate',
  credentials: {
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD
  },
  extractors: { token: '$.jwt' }
}

// Corporate/employee authentication
authentication: {
  endpoint: '/corp/auth',
  credentials: {
    employeeId: process.env.EMPLOYEE_ID,
    pin: process.env.PIN,
    department: process.env.DEPARTMENT
  },
  extractors: { token: '$.authToken' }
}

// OAuth2 client credentials
authentication: {
  endpoint: '/auth/oauth/token',
  credentials: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    grantType: 'client_credentials'
  },
  extractors: { token: '$.access_token' }
}
```

---

## 📊 **Enterprise Benefits**

### **✅ For Development Teams**

- **Zero setup time** with configuration-driven approach
- **Consistent patterns** across all microservices
- **Built-in best practices** for enterprise environments
- **Automatic authentication** and header management

### **✅ For DevOps Teams**

- **CI/CD integration** ready out of the box
- **Infrastructure-aware** testing with proper headers
- **Performance monitoring** and regression detection
- **Comprehensive reporting** for stakeholders

### **✅ For Security Teams**

- **Security testing** automation with OWASP ZAP
- **Compliance framework** support (GDPR, SOX, HIPAA)
- **Vulnerability scanning** integration
- **Audit trail** and compliance reporting

### **✅ For Management**

- **Executive dashboards** with business metrics
- **ROI tracking** for testing investments
- **Cost attribution** by business unit
- **Regulatory compliance** reporting

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md).

### **Development Setup**

```bash
git clone https://github.com/yourorg/restifiedts.git
cd restifiedts
npm install
npm run build
npm test
```

---

## 📄 **License**

MIT License - see [LICENSE](./LICENSE) file.

---

## 🎯 **Enterprise Support**

RestifiedTS follows an **"enterprise support always"** philosophy. Every feature is designed to scale from small teams to large organizations.

**Need enterprise support?** Contact us at enterprise@restifiedts.com

---

**🚀 Ready to transform your API testing? Get started with RestifiedTS today!**
