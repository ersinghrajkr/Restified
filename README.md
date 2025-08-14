# 🚀 RestifiedTS - Enterprise API Testing Framework

**Production-grade TypeScript API testing framework with fluent DSL, enterprise features, and comprehensive automation.**

[![npm version](https://badge.fury.io/js/restifiedts.svg)](https://badge.fury.io/js/restifiedts)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-Ready-success?style=flat-square)](./docs/ENTERPRISE-FEATURES.md)

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

### Generate Enterprise Test Suite
```bash
# Generate complete enterprise test suite
restifiedts create-test -n "MyAPI" -t "api,auth,performance" -u "https://api.example.com"

# Navigate to generated suite
cd ./tests

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
- [📊 Reporting & Analytics](./docs/REPORTING-MADE-EASY.md)
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

### **🔄 Variable System**
```typescript
// Template variables with Faker.js support
restified.setVariable('email', '{{$faker.internet.email}}');
restified.setVariable('uuid', '{{$random.uuid}}');
restified.setVariable('timestamp', '{{$date.now}}');

// Use in requests
.post('/users', {
  email: '{{email}}',
  id: '{{uuid}}',
  createdAt: '{{timestamp}}'
})
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

### **🚀 Enterprise Test Suite Generator**
```bash
# Create complete enterprise-grade test suite
restifiedts create-test -n "MyCompanyAPI" -t "api,auth,performance,security" -u "https://api.mycompany.com"

# Options:
# -n, --name     Test suite name (default: "MyAPI")
# -t, --types    Test types: api,auth,database,performance,security
# -u, --url      Base API URL 
# -o, --output   Output directory (default: "./tests")
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
# ✅ Generate enterprise test suites
restifiedts create-test

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