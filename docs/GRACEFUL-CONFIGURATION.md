# 🔧 Graceful Configuration in RestifiedTS

RestifiedTS is designed to handle partial configurations gracefully, allowing you to use only the features you need without worrying about missing dependencies or configurations.

## 🎯 **Philosophy: Graceful Degradation**

RestifiedTS follows the principle of **graceful degradation**:

- ✅ **Available features work perfectly**
- ⚠️ **Missing features generate warnings but don't break tests**
- 🔄 **Fallback clients provide meaningful responses**
- 📊 **Health reports show what's available vs. missing**

---

## 🚀 **What Works Out of the Box**

### **✅ Minimal Configuration**

```typescript
import { restified } from 'restifiedts';

// This works immediately - no configuration needed
const response = await restified
  .given()
    .baseURL('https://api.example.com')
  .when()
    .get('/users/1')
    .execute();

await response
  .statusCode(200)
  .execute();
```

### **✅ Partial Configuration**

```typescript
// Only configure what you need
restified.createClient('api', {
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: { 'Authorization': 'Bearer token123' }
});

// Use configured client
const response = await restified
  .given().useClient('api')
  .when().get('/data')
  .execute();
```

---

## ⚠️ **How Missing Features Are Handled**

### **Missing Database Packages**

```typescript
// This won't crash if mysql2 package is missing
await restified.createDatabaseClient('mysql', {
  type: 'mysql',
  host: 'localhost',
  // ... other config
});

// Output:
// ⚠️ RestifiedTS Warning: Database client 'mysql' could not be created: MySQL client requires "mysql2" package. Install with: npm install mysql2
// ⚠️ RestifiedTS Warning: Continuing without mysql database support.
```

### **Missing Database/GraphQL/WebSocket Clients**

```typescript
// These return fallback clients that don't crash
const dbClient = restified.getDatabaseClient('nonexistent');
const gqlClient = restified.getGraphQLClient('nonexistent'); 
const wsClient = restified.getWebSocketClient('nonexistent');

// All return proxy objects that log warnings instead of throwing errors
const result = await dbClient.query('SELECT 1');
// Returns: { warning: "database client 'nonexistent' is not available", success: false }
```

### **Missing Configuration Sections**

```typescript
// Missing GraphQL config? No problem - just don't use GraphQL features
// Missing WebSocket config? No problem - just don't use WebSocket features
// Missing database config? No problem - just don't use database features

const config = {
  // Only HTTP clients configured
  clients: {
    api: { baseURL: 'https://api.example.com' }
  }
  // No databases, graphql, websocket configs
};

const restified = Restified.create(config);
// Works perfectly for HTTP testing
```

---

## 🎛️ **Environment Variable Control**

Control graceful behavior with environment variables:

### **Strict Mode**
```bash
# Make missing features throw errors (good for CI/CD validation)
RESTIFIED_STRICT_MODE=true

# Default: false (warnings only)
RESTIFIED_STRICT_MODE=false
```

### **Warning Control**
```bash
# Suppress all warnings (clean output)
RESTIFIED_ENABLE_WARNINGS=false

# Enable warnings (default)
RESTIFIED_ENABLE_WARNINGS=true
```

### **Silent Failures**
```bash
# Make specific features fail silently
RESTIFIED_SILENT_FAILURES=database,graphql,websocket

# No silent failures (default)
RESTIFIED_SILENT_FAILURES=
```

### **Fallback Control**
```bash
# Disable fallback clients (return null instead)
RESTIFIED_ENABLE_FALLBACKS=false

# Enable fallback clients (default)
RESTIFIED_ENABLE_FALLBACKS=true
```

---

## 🏥 **Configuration Health Reports**

Get comprehensive reports on what's working vs. missing:

### **Automatic Health Report**
```typescript
// Automatic health report during cleanup (if warnings exist)
await restified.cleanup();

// Output:
// 🏥 RestifiedTS Configuration Health Report
// ==========================================
// ⚠️ Configuration Warnings:
//    - Database client 'mysql' could not be created: MySQL client requires "mysql2" package
//    - GraphQL client 'main' not found. Returning fallback client.
// 
// ❌ Missing Features:
//    - mysql
//    - graphql
// 
// 💡 Note: RestifiedTS will continue to work with available features.
```

### **Manual Health Report**
```typescript
// Print health report anytime
restified.printConfigurationHealthReport();

// Get warnings programmatically
const warnings = restified.getConfigurationWarnings();
const missing = restified.getMissingFeatures();

console.log(`Found ${warnings.length} warnings and ${missing.length} missing features`);
```

---

## 📋 **Common Scenarios**

### **Scenario 1: Only HTTP Testing**
```typescript
// Minimal setup - works perfectly
const restified = Restified.create({
  clients: {
    api: { baseURL: 'https://api.example.com' }
  }
});

// All HTTP features work
// Database/GraphQL/WebSocket features silently ignored
```

### **Scenario 2: HTTP + Some Database**
```typescript
// Only PostgreSQL available
const restified = Restified.create({
  clients: {
    api: { baseURL: 'https://api.example.com' }
  },
  databases: {
    postgres: {
      type: 'postgresql',
      connectionString: 'postgresql://...'
    }
  }
});

// HTTP + PostgreSQL work
// MySQL/MongoDB/Redis features generate warnings but don't crash
```

### **Scenario 3: Full Configuration (All Features)**
```typescript
// Everything configured
const restified = Restified.create({
  clients: { /* HTTP clients */ },
  databases: { /* All DB types */ },
  // GraphQL, WebSocket, etc.
});

// Everything works perfectly
// No warnings generated
```

---

## 🔧 **Configuration Validation**

RestifiedTS validates configurations gracefully:

```typescript
// Invalid database config
databases: {
  mysql: {
    // Missing required 'type' field
    host: 'localhost'
  }
}

// Output:
// ⚠️ RestifiedTS Warning: Configuration section 'mysql' is missing required settings: type
```

---

## 🧪 **Testing with Partial Configurations**

### **Smart Test Skipping**
```typescript
describe('Database Tests', function() {
  it('should test PostgreSQL', async function() {
    if (!restified.hasClient('postgres')) {
      console.log('⚠️ PostgreSQL not available - skipping test');
      this.skip();
    }
    
    // Test only runs if PostgreSQL is available
    const client = restified.getDatabaseClient('postgres');
    const result = await client.query('SELECT 1');
    expect(result.rows).to.have.length(1);
  });
});
```

### **Graceful Feature Detection**
```typescript
// Check what's available before using
const availableFeatures = {
  postgres: restified.hasClient('postgres'),
  mysql: restified.hasClient('mysql'),
  graphql: !restified.getMissingFeatures().includes('graphql')
};

console.log('Available features:', availableFeatures);
```

---

## 💡 **Best Practices**

### **1. Use Feature Detection**
```typescript
// Good
if (restified.hasClient('postgres')) {
  const result = await restified.getDatabaseClient('postgres').query('SELECT 1');
}

// Also Good (but generates warnings)
const result = await restified.getDatabaseClient('postgres').query('SELECT 1');
```

### **2. Check Health Reports in CI/CD**
```typescript
// In test setup
after(function() {
  const warnings = restified.getConfigurationWarnings();
  if (warnings.length > 0 && process.env.CI) {
    console.log('CI Environment - Configuration warnings detected:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
});
```

### **3. Environment-Specific Configurations**
```typescript
// Development: Relaxed (warnings only)
RESTIFIED_STRICT_MODE=false
RESTIFIED_ENABLE_WARNINGS=true

// CI/CD: Strict (fail on missing deps)
RESTIFIED_STRICT_MODE=true
RESTIFIED_ENABLE_WARNINGS=true

// Production Testing: Clean output
RESTIFIED_STRICT_MODE=false
RESTIFIED_ENABLE_WARNINGS=false
```

---

## 📊 **Summary**

RestifiedTS **never crashes** due to partial configurations:

| Feature | Configured | Missing Package | Missing Config | Result |
|---------|------------|-----------------|----------------|---------|
| HTTP Clients | ✅ Works | N/A | ⚠️ Warning + Fallback | Always functional |
| Database | ✅ Works | ⚠️ Warning + Skip | ⚠️ Warning + Fallback | Graceful degradation |
| GraphQL | ✅ Works | ⚠️ Warning + Fallback | ⚠️ Warning + Fallback | Graceful degradation |
| WebSocket | ✅ Works | ⚠️ Warning + Fallback | ⚠️ Warning + Fallback | Graceful degradation |

**🎯 Result**: You can start with minimal configuration and gradually add features as needed, without any breaking changes or crashes.