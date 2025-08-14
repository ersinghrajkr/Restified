# 🔐 Automatic Headers & Auth Token Injection

The Restified framework now automatically manages common headers and authentication tokens, so **end users never need to manually add headers or auth tokens in their tests**.

## 🎯 How It Works

### 1. **Configuration-Driven Setup**
Everything is configured in `restified.config.ts`:

```typescript
const config: RestifiedConfig = {
  // Global headers applied to ALL requests
  globalHeaders: {
    'X-Test-Suite': 'my-api-tests',
    'X-Environment': 'staging',
    'X-API-Version': 'v2'
  },

  // HTTP clients with their own headers
  clients: {
    api: {
      baseURL: 'https://api.example.com',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  },

  // Authentication with automatic token injection
  authentication: {
    endpoint: '/oauth/token',
    method: 'POST',
    client: 'auth',
    extractors: {
      token: '$.access_token',
      userEmail: '$.user.email',
      userId: '$.user.id'
    },
    // 🔑 Key feature: Automatic auth token application
    autoApplyToClients: 'all',        // Apply to all clients
    authHeaderName: 'Authorization'   // Header name to use
  }
};
```

### 2. **Automatic Header Merging**
The framework automatically merges headers in this order:

```
Final Headers = Global Headers + Client Headers + Auth Headers
```

**Example:**
```typescript
// Global headers (from config)
{
  'X-Test-Suite': 'my-api-tests',
  'X-Environment': 'staging'
}

// Client-specific headers (from config)
{
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

// Auth headers (automatic after authentication)
{
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
}

// = Final headers sent with EVERY request
{
  'X-Test-Suite': 'my-api-tests',
  'X-Environment': 'staging', 
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
}
```

### 3. **Automatic Auth Token Injection**
After authentication, the framework automatically:

1. ✅ **Extracts** auth token from response
2. ✅ **Adds** auth token to all configured clients
3. ✅ **Updates** client configurations with Bearer token
4. ✅ **Applies** to future requests automatically

**What You See:**
```
🔐 Performing authentication...
✅ Authentication successful - Auth token added to all clients
   📧 User Email: user@example.com
   🆔 User ID: 12345
   🔐 Auth token automatically applied using header: Authorization
```

## 🚀 End User Experience

### ✅ **Before: Manual Header Management**
```typescript
// Users had to manually add headers in every test
describe('API Tests', function() {
  it('should get user data', async function() {
    const response = await restified
      .given()
        .baseURL('https://api.example.com')
        .headers({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Test-Suite': 'my-tests',
          'X-Environment': 'staging',
          'Authorization': 'Bearer token-here'  // Manual auth
        })
      .when()
        .get('/users/1')
        .execute();
  });
});
```

### ✅ **After: Zero Header Management**
```typescript
// Users don't need to add ANY headers - all automatic!
describe('API Tests', function() {
  it('should get user data', async function() {
    const response = await restified
      .given()
        .useClient('api')  // Pre-configured with ALL headers
      .when()
        .get('/users/1')
        .execute();
    
    // Headers automatically included:
    // - X-Test-Suite: my-api-tests
    // - X-Environment: staging  
    // - Content-Type: application/json
    // - Accept: application/json
    // - Authorization: Bearer [auto-extracted-token]
  });
});
```

## 🔧 Configuration Options

### Client-Specific Auth Token Application
```typescript
authentication: {
  // Apply auth token only to specific clients
  autoApplyToClients: ['api', 'userService'],  // Not testUtils
  authHeaderName: 'Authorization'
}
```

### Custom Auth Header Names
```typescript
authentication: {
  // For APIs that use custom auth headers
  autoApplyToClients: 'all',
  authHeaderName: 'X-API-Key'  // Custom header name
}
```

### Multiple Client Configurations
```typescript
clients: {
  // Main API with auth
  api: {
    baseURL: 'https://api.example.com',
    headers: {
      'Content-Type': 'application/json',
      'X-Service': 'main-api'
    }
  },
  
  // Public API without auth  
  public: {
    baseURL: 'https://public-api.example.com',
    headers: {
      'Content-Type': 'application/json',
      'X-Service': 'public-api'
    }
  }
},

authentication: {
  // Only apply auth to main API, not public API
  autoApplyToClients: ['api'],
  authHeaderName: 'Authorization'
}
```

## 🛠️ Technical Implementation

### Dynamic Header Updates
The framework provides methods to update headers dynamically:

```typescript
// Update headers for all clients
restified.updateAllClientsHeaders({
  'X-New-Header': 'value'
});

// Update headers for specific client
restified.updateClientHeaders('api', {
  'X-API-Version': 'v3'
});

// Add auth token to all clients
restified.addAuthTokenToAllClients('new-token-123');
```

### Header Merging Logic
```typescript
// Step 1: Start with global headers
const finalHeaders = { ...config.globalHeaders };

// Step 2: Merge client-specific headers
Object.assign(finalHeaders, clientConfig.headers);

// Step 3: Add auth headers (after authentication)
if (authToken) {
  finalHeaders.Authorization = `Bearer ${authToken}`;
}

// Step 4: Allow per-request overrides
Object.assign(finalHeaders, requestSpecificHeaders);
```

## 🎯 Real-World Examples

### E-commerce API
```typescript
const config: RestifiedConfig = {
  globalHeaders: {
    'X-Store-ID': 'shop-123',
    'X-API-Version': 'v2',
    'X-Client': 'automated-tests'
  },
  
  clients: {
    products: {
      baseURL: 'https://api.shop.com/products',
      headers: { 'X-Service': 'products' }
    },
    orders: {
      baseURL: 'https://api.shop.com/orders', 
      headers: { 'X-Service': 'orders' }
    },
    payments: {
      baseURL: 'https://payments.shop.com',
      headers: { 'X-Service': 'payments' }
    }
  },
  
  authentication: {
    endpoint: '/auth/customer/login',
    method: 'POST',
    client: 'products',
    extractors: { token: '$.access_token' },
    autoApplyToClients: ['products', 'orders'], // Not payments
    authHeaderName: 'Authorization'
  }
};

// Result: Every API call automatically gets:
// - X-Store-ID: shop-123
// - X-API-Version: v2  
// - X-Client: automated-tests
// - X-Service: products/orders/payments (per client)
// - Authorization: Bearer [token] (products & orders only)
```

### Microservices Testing
```typescript
const config: RestifiedConfig = {
  globalHeaders: {
    'X-Trace-ID': '{{$random.uuid}}',
    'X-Environment': 'test',
    'X-Team': 'qa-automation'
  },
  
  clients: {
    userService: {
      baseURL: 'https://users.company.com',
      headers: { 'X-Service': 'user-service' }
    },
    orderService: {
      baseURL: 'https://orders.company.com',
      headers: { 'X-Service': 'order-service' }
    },
    inventoryService: {
      baseURL: 'https://inventory.company.com',
      headers: { 'X-Service': 'inventory-service' }
    }
  },
  
  authentication: {
    endpoint: '/oauth/token',
    method: 'POST', 
    client: 'userService',
    extractors: { token: '$.access_token' },
    autoApplyToClients: 'all',  // Apply to all microservices
    authHeaderName: 'Authorization'
  }
};
```

## 🎉 Benefits

### ✅ **For End Users:**
- **Zero header management** - everything automatic
- **No authentication code** - tokens applied automatically  
- **Consistent headers** - same headers across all requests
- **Environment-aware** - headers change based on config

### ✅ **For Teams:**
- **Centralized configuration** - one place to manage headers
- **Environment-specific** - different headers per environment
- **Service-specific** - different headers per microservice  
- **Security-conscious** - automatic token management

### ✅ **For Maintenance:**
- **DRY principle** - no repeated header code
- **Easy updates** - change headers in one place
- **Type-safe** - TypeScript validation for header configs
- **Testable** - header logic is isolated and configurable

---

**🎯 Result: End users can focus on testing business logic instead of managing headers and authentication!**