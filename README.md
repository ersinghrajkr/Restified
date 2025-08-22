# 🚀 RestifiedTS - Enterprise API Testing Framework

**Production-grade TypeScript testing framework with fluent DSL for REST APIs, GraphQL, WebSocket, and database testing. Features dynamic JSON fixtures, comprehensive variable resolution, and enterprise automation.**

[![npm version](https://badge.fury.io/js/restifiedts.svg)](https://badge.fury.io/js/restifiedts)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-Ready-success?style=flat-square)
](./docs/ENTERPRISE-FEATURES.md)

[
](./docs/ENTERPRISE-FEATURES.md)

## 🆕 **What's New in v2.0.5**

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

**Key Changes:**
- ✅ `scaffold` command creates folder with project name (not generic "tests" folder)
- ✅ Enhanced ConfigLoader with enterprise validation
- ✅ 50+ new environment variables for complete customization
- ✅ Better TypeScript integration and error handling

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

### Scaffold Enterprise Test Suite

```bash
# Scaffold complete enterprise test suite with performance optimization!
restifiedts scaffold -n "MyAPI" -t "api,auth,database,performance" -u "https://api.example.com"

# Navigate to generated suite
cd ./MyAPI

# Install dependencies and run
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
  endpoint: '/oauth/token',
  autoApplyToClients: 'all',  // Auth token added to all clients
  extractors: {
    token: '$.access_token',
    roles: '$.roles',
    permissions: '$.permissions'
  }
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

| Database | Status | Package Required | Features |
|----------|--------|------------------|----------|
| **PostgreSQL** | ✅ Complete | `pg` | Connection pooling, transactions, schemas, performance monitoring |
| **MySQL/MariaDB** | ✅ Complete | `mysql2` | Connection pooling, SSL, multiple statements, bulk operations |
| **MongoDB** | ✅ Complete | `mongodb` | Replica sets, aggregation, GridFS, transactions |
| **SQLite** | ✅ Complete | `sqlite3` | In-memory/file, WAL mode, custom functions, backup/restore |
| **Redis** | ✅ Complete | `redis` | Clustering, pipelines, key patterns, data types |
| **SQL Server** | ✅ Complete | `mssql` | Windows auth, encryption, bulk operations, stored procedures |
| **Oracle** | 🚧 Planned | `oracledb` | Enterprise features, wallet support |
| **Elasticsearch** | 🚧 Planned | `@elastic/elasticsearch` | Search operations, indexing |

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

### **Development**

- [🤝 Contributing](./docs/CONTRIBUTING.md)
- [📝 Changelog](./docs/CHANGELOG.md)
- [🔧 Claude AI Instructions](./docs/CLAUDE.md)

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

RestifiedTS provides a comprehensive CLI for project scaffolding and management:

```bash
# 🚀 Scaffold new test project (RECOMMENDED)
restifiedts scaffold -n "MyAPI" -t "api,auth,database" -u "https://api.example.com"

# 🔧 Initialize existing project  
restifiedts init MyProject --template enterprise

# 📊 Run tests with custom options
restifiedts test --pattern "tests/**/*.ts" --reporter spec

# ⚙️ Configuration management
restifiedts config init --force              # Initialize config file
restifiedts config show                      # Show current config

# 🔨 Generate specific components
restifiedts generate test UserAPI            # Generate test file
restifiedts generate config                  # Generate config
restifiedts generate auth LoginTest          # Generate auth test

# 📈 Report generation
restifiedts report --open --clean            # Generate and open HTML report

# 🔧 Initialize configuration only
restifiedts init-config --type ts --force    # Generate restified.config.ts
```

### **🚀 Enterprise Test Suite Scaffolding**

The `scaffold` command creates production-ready test suites:

```bash
# Scaffold complete enterprise-grade test suite
restifiedts scaffold -n "MyCompanyAPI" -t "api,auth,performance,security" -u "https://api.mycompany.com"

# Options:
# -n, --name     Test suite name (default: "MyAPI") 
# -t, --types    Test types: api,auth,database,performance,security,graphql,websocket
# -u, --url      Base API URL 
# -o, --output   Output directory (defaults to project name)
# -f, --force    Overwrite existing files
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

### **Ready to Use**

```bash
# ✅ Scaffold enterprise test suites
restifiedts scaffold

# ✅ Run comprehensive examples with enterprise config
npm run examples

# ✅ Generate detailed HTML reports  
npm run report

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

  // Enterprise authentication
  authentication: {
    endpoint: '/oauth/token',
    method: 'POST',
    client: 'auth',
    autoApplyToClients: 'all',
    extractors: {
      token: '$.access_token',
      roles: '$.roles',
      tenantId: '$.tenant_id'
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
