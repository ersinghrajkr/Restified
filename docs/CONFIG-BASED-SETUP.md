# 🎯 Configuration-Based Setup - Clean & Simple

We've introduced `restified.config.ts` to move all configuration out of the global setup, making it **clean, maintainable, and user-friendly**.

## 🚀 Quick Start

### 1. Generate Configuration File
```bash
# Generate TypeScript config (recommended)
restifiedts init-config

# Or generate JavaScript config
restifiedts init-config --type js

# Or generate JSON config
restifiedts init-config --type json
```

### 2. Customize Your Configuration
Edit the generated `restified.config.ts`:

```typescript
import { RestifiedConfig } from './src/RestifiedTypes';

const config: RestifiedConfig = {
  // Your API endpoints
  clients: {
    api: {
      baseURL: 'https://your-api.com',      // ← Change this
      timeout: 10000,
      headers: {
        'Authorization': 'Bearer your-token' // ← Add your auth
      }
    }
  },

  // Your authentication flow
  authentication: {
    endpoint: '/auth/login',                 // ← Your auth endpoint
    method: 'POST',
    client: 'api',
    extractors: {
      token: '$.access_token',              // ← Your token path
      userEmail: '$.user.email',            // ← Your user email path
      userId: '$.user.id'                   // ← Your user ID path
    }
  },

  // Your global variables
  globalVariables: {
    apiVersion: 'v2',                       // ← Your API version
    testSuite: 'my-awesome-tests'           // ← Your test suite name
  }
};

export default config;
```

### 3. Run Tests
```bash
# Run tests (uses your config automatically)
npm run examples

# Generate beautiful reports
npm run report
```

## 📋 Configuration Options

### HTTP Clients
```typescript
clients: {
  // Primary API
  api: {
    baseURL: 'https://api.example.com',
    timeout: 10000,
    headers: {
      'Authorization': 'Bearer token',
      'X-API-Key': 'your-key'
    }
  },
  
  // Auth service
  auth: {
    baseURL: 'https://auth.example.com',
    timeout: 5000
  },
  
  // Any other service
  payments: {
    baseURL: 'https://payments.example.com',
    timeout: 15000
  }
}
```

### Authentication Flow
```typescript
authentication: {
  endpoint: '/oauth/token',        // Your auth endpoint
  method: 'POST',                  // HTTP method
  client: 'auth',                  // Which client to use
  extractors: {
    token: '$.access_token',       // JSONPath to token
    userEmail: '$.user.email',     // JSONPath to email
    userId: '$.user.id'            // JSONPath to user ID
  },
  fallback: {                      // Fallback values if auth fails
    token: 'demo-token',
    userEmail: 'test@example.com',
    userId: 1
  }
}
```

### Global Headers
```typescript
globalHeaders: {
  'X-Test-Suite': 'my-tests',
  'X-Environment': 'staging',
  'X-Version': '2.0'
}
```

### Global Variables
```typescript
globalVariables: {
  apiVersion: 'v2',
  testEnvironment: 'staging',
  maxRetries: 5,
  defaultTimeout: 30000
}
```

### Environment Variables
```typescript
environmentVariables: {
  API_KEY: process.env.API_KEY || 'demo-key',
  ENVIRONMENT: 'test',
  DEBUG: 'true'
}
```

### Reporting Configuration
```typescript
reporting: {
  enabled: true,
  outputDir: 'test-reports',       // Custom report directory
  formats: ['html', 'json'],
  openAfterGeneration: true,       // Auto-open browser
  includeRequestResponse: true,
  includeScreenshots: true
}
```

### Health Checks
```typescript
healthChecks: [
  {
    name: 'Main API',
    client: 'api',
    endpoint: '/health',
    expectedStatus: 200
  },
  {
    name: 'Auth Service',
    client: 'auth', 
    endpoint: '/status',
    expectedStatus: 200
  }
]
```

## 🎯 Benefits

### ✅ Before: Heavy Global Setup
```typescript
// examples/setup/global-setup.ts (200+ lines)
before(async function() {
  // Hard-coded client configurations
  restified.createClient('api', {
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
    headers: { /* lots of headers */ }
  });
  
  // Hard-coded authentication
  const authResponse = await restified.given()...
  
  // Hard-coded variables
  restified.setGlobalVariables({ /* lots of variables */ });
  
  // Hard-coded environment setup
  process.env.EXAMPLE_API_KEY = 'demo-key';
  
  // Connectivity checks...
  // Reporting setup...
  // etc...
});
```

### ✅ After: Clean Configuration
```typescript
// restified.config.ts (user-friendly)
const config: RestifiedConfig = {
  clients: { /* user's API configs */ },
  authentication: { /* user's auth flow */ },
  globalVariables: { /* user's variables */ }
};

// examples/setup/global-setup.ts (50 lines)
before(async function() {
  config = await ConfigLoader.getInstance().loadConfig();
  // Setup everything from config automatically
});
```

## 🛠️ Global Setup Transformation

### What Changed
1. **Configuration Loading**: Smart config loader with defaults
2. **Dynamic Client Setup**: Creates clients from config
3. **Flexible Authentication**: Configurable auth flow
4. **Variable Management**: All variables come from config
5. **Health Checks**: User-defined connectivity tests
6. **Graceful Fallbacks**: Works even without config file

### New Global Setup Flow
```
📋 Loading configuration... ✅
🔧 Setting up HTTP clients... ✅ 3 HTTP clients configured  
🔐 Performing authentication... ✅ Authentication successful
📋 Setting up global variables... ✅ 6 global variables configured
✅ 3 environment variables set
🔍 Verifying service connectivity... ✅ API Service: OK
🎯 === GLOBAL SETUP COMPLETE ===
```

## 🔧 CLI Commands

### Configuration Management
```bash
# Generate config file
restifiedts init-config

# Generate with specific type
restifiedts init-config --type js
restifiedts init-config --type json

# Overwrite existing config
restifiedts init-config --force
```

### Testing & Reporting  
```bash
# Run tests (auto-loads config)
npm run examples

# Generate reports with config
npm run report

# Clean reports
npm run reports:clean
```

## 📚 Real-World Examples

### E-commerce API Testing
```typescript
const config: RestifiedConfig = {
  clients: {
    products: {
      baseURL: 'https://api.shop.com/products',
      headers: { 'X-API-Key': process.env.PRODUCTS_API_KEY }
    },
    orders: {
      baseURL: 'https://api.shop.com/orders',
      headers: { 'X-API-Key': process.env.ORDERS_API_KEY }
    },
    payments: {
      baseURL: 'https://payments.shop.com',
      headers: { 'Authorization': 'Bearer sandbox-token' }
    }
  },
  
  authentication: {
    endpoint: '/auth/customer/login',
    method: 'POST',
    client: 'products',
    extractors: {
      token: '$.customer.access_token',
      userEmail: '$.customer.email',
      userId: '$.customer.id'
    }
  },
  
  globalVariables: {
    testCustomerId: 12345,
    testProductId: 'SKU-001',
    testEnvironment: 'sandbox'
  }
};
```

### Microservices Testing
```typescript
const config: RestifiedConfig = {
  clients: {
    userService: { baseURL: 'https://users.company.com' },
    orderService: { baseURL: 'https://orders.company.com' },
    inventoryService: { baseURL: 'https://inventory.company.com' },
    notificationService: { baseURL: 'https://notifications.company.com' }
  },
  
  authentication: {
    endpoint: '/oauth/token',
    method: 'POST',
    client: 'userService',
    extractors: {
      token: '$.access_token',
      userEmail: '$.user.email', 
      userId: '$.user.id'
    }
  },
  
  healthChecks: [
    { name: 'User Service', client: 'userService', endpoint: '/health', expectedStatus: 200 },
    { name: 'Order Service', client: 'orderService', endpoint: '/health', expectedStatus: 200 },
    { name: 'Inventory Service', client: 'inventoryService', endpoint: '/status', expectedStatus: 200 }
  ]
};
```

## 🎉 Result

### ✅ For End Users:
- **One config file** to rule them all
- **No setup code** in tests
- **Easy customization** for different environments
- **Smart defaults** that work out of the box

### ✅ For Framework:
- **Clean separation** of concerns
- **Maintainable codebase** with less complexity in global setup
- **Flexible architecture** supporting any API configuration
- **Enterprise-ready** patterns built-in

### ✅ For Teams:
- **Environment-specific configs** (dev, staging, prod)
- **Shared configurations** across team members
- **Version control friendly** - track config changes
- **CI/CD ready** - environment variables and overrides

---

**🎯 Perfect Balance: Enterprise power with user-friendly simplicity through clean configuration!**