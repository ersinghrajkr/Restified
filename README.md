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
