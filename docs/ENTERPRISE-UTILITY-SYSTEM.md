# 🛠️ Enterprise Utility System

RestifiedTS includes a comprehensive enterprise-grade utility system with **130+ built-in functions** across 12 categories, providing developers with powerful tools for data manipulation, validation, formatting, and automation in API testing scenarios.

## 🎯 **Overview**

The utility system is designed with enterprise requirements in mind:

- **🏢 Production-Ready**: Battle-tested utilities for enterprise environments
- **🔌 Extensible**: Custom utility plugins and functions
- **🎨 Flexible Formatting**: User-defined output formats for all functions
- **⚡ High Performance**: Caching, batching, and pipeline processing
- **🔗 Variable Integration**: Seamless integration with Restified's variable resolution
- **📊 Monitoring**: Performance metrics and health checks
- **🛡️ Security**: Built-in security utilities and data sanitization

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────┐
│           Restified Class               │
│   (stringUtil, dateUtil, cryptoUtil)   │
├─────────────────────────────────────────┤
│          Utility Manager                │
│  (execute, batch, pipeline, plugins)   │
├─────────────────────────────────────────┤
│          Utility Registry               │
│    (functions, categories, cache)      │
├─────────────────────────────────────────┤
│         Core Utility Classes            │
│ String│Date│Math│Random│Validation│... │
└─────────────────────────────────────────┘
```

### **Key Components:**

1. **UtilityManager** - High-level interface for utility execution
2. **UtilityRegistry** - Central registry with caching and plugin management
3. **Core Utility Classes** - Built-in utility implementations
4. **Custom Plugins** - User-defined utility extensions
5. **Variable Integration** - Seamless template variable resolution

---

## 📚 **Utility Categories**

### **🔤 String Utilities (`stringUtil`)**

Comprehensive string manipulation and formatting functions:

```typescript
// Case conversion
restified.stringUtil('toUpperCase', 'hello world');        // "HELLO WORLD"
restified.stringUtil('toLowerCase', 'Hello World');        // "hello world"
restified.stringUtil('camelCase', 'hello world');          // "helloWorld"
restified.stringUtil('pascalCase', 'hello world');         // "HelloWorld"
restified.stringUtil('kebabCase', 'HelloWorld');           // "hello-world"
restified.stringUtil('snakeCase', 'HelloWorld');           // "hello_world"

// String manipulation
restified.stringUtil('trim', '  hello world  ');           // "hello world"
restified.stringUtil('reverse', 'hello');                  // "olleh"
restified.stringUtil('substring', 'hello world', 0, 5);    // "hello"
restified.stringUtil('replace', 'hello world', 'world', 'universe'); // "hello universe"

// String operations
restified.stringUtil('split', 'a,b,c', ',');              // ["a", "b", "c"]
restified.stringUtil('join', ['a', 'b', 'c'], '-');       // "a-b-c"
restified.stringUtil('padStart', '42', 5, '0');           // "00042"
restified.stringUtil('padEnd', '42', 5, '0');             // "42000"
```

### **📅 Date Utilities (`dateUtil`)** - *User-Defined Formatting*

Complete date manipulation with flexible output formats:

```typescript
// Current date/time with format options
restified.dateUtil('now');                                 // ISO (default)
restified.dateUtil('now', 'timestamp');                   // 1718462445123
restified.dateUtil('now', 'YYYY-MM-DD HH:mm:ss');        // "2024-06-15 14:30:45"
restified.dateUtil('today', 'DD/MM/YYYY');               // "15/06/2024"

// Add operations with custom formats
restified.dateUtil('addMinutes', date, 30);               // ISO format
restified.dateUtil('addMinutes', date, 30, 'HH:mm:ss');  // "15:00:45"
restified.dateUtil('addHours', date, 5, 'timestamp');     // 1718480445123
restified.dateUtil('addDays', date, 7, 'YYYY-MM-DD');    // "2024-06-22"
restified.dateUtil('addWeeks', date, 2, 'DD/MM/YYYY');   // "29/06/2024"
restified.dateUtil('addMonths', date, 3, 'YYYY-MM');     // "2024-09"
restified.dateUtil('addYears', date, 1, 'unix');         // 1749998445

// Subtract operations
restified.dateUtil('subtractMinutes', date, 15, 'time-only'); // "14:15:45"
restified.dateUtil('subtractHours', date, 2, 'ISO');     // "2024-06-15T12:30:45.123Z"
restified.dateUtil('subtractDays', date, 10, 'date-only'); // "2024-06-05"
restified.dateUtil('subtractWeeks', date, 1, 'local');   // "6/8/2024, 2:30:45 PM"
restified.dateUtil('subtractMonths', date, 6, 'utc');    // "Sat, 15 Dec 2023 14:30:45 GMT"
restified.dateUtil('subtractYears', date, 2, 'YYYY');    // "2022"

// Period boundaries
restified.dateUtil('startOfDay', date, 'YYYY-MM-DD HH:mm:ss');    // "2024-06-15 00:00:00"
restified.dateUtil('endOfDay', date, 'timestamp');                // 1718497199999
restified.dateUtil('startOfWeek', date, 'DD/MM/YYYY');           // "10/06/2024"
restified.dateUtil('endOfWeek', date, 'ISO');                    // "2024-06-16T23:59:59.999Z"
restified.dateUtil('startOfMonth', date, 'YYYY-MM-DD');          // "2024-06-01"
restified.dateUtil('endOfMonth', date, 'DD/MM/YYYY');            // "30/06/2024"
restified.dateUtil('startOfYear', date, 'YYYY-MM-DD');           // "2024-01-01"
restified.dateUtil('endOfYear', date, 'unix');                   // 1735689599

// Date information
restified.dateUtil('getDayOfWeek', date);                // 6 (Saturday)
restified.dateUtil('getDayOfWeekName', date);            // "Saturday"
restified.dateUtil('getMonthName', date);                // "June"
restified.dateUtil('getWeekNumber', date);               // 24
restified.dateUtil('getDaysInMonth', date);              // 30

// Date checks
restified.dateUtil('isWeekend', date);                   // true
restified.dateUtil('isWeekday', date);                   // false
restified.dateUtil('isLeapYear', 2024);                  // true
restified.dateUtil('getAge', '1990-01-01', date);        // 34

// Calculations
restified.dateUtil('daysBetween', '2024-01-01', date);   // 166
```

**Available Format Options:**
- **Built-in**: `ISO`, `timestamp`, `unix`, `date-only`, `time-only`, `local`, `utc`
- **Custom**: `YYYY-MM-DD`, `DD/MM/YYYY`, `MM-DD-YY`, `HH:mm:ss`, `YYYY-MM-DD HH:mm:ss.SSS`

### **🔢 Math Utilities (`mathUtil`)**

Mathematical operations and calculations:

```typescript
// Basic operations
restified.mathUtil('round', 3.14159, 2);                 // 3.14
restified.mathUtil('abs', -42);                          // 42
restified.mathUtil('floor', 3.8);                        // 3
restified.mathUtil('ceil', 3.2);                         // 4

// Random numbers
restified.mathUtil('random', 0, 1);                      // 0.742...
restified.mathUtil('randomInt', 1, 100);                 // 42

// Array operations
const numbers = [1, 2, 3, 4, 5];
restified.mathUtil('sum', numbers);                      // 15
restified.mathUtil('average', numbers);                  // 3
restified.mathUtil('max', numbers);                      // 5
restified.mathUtil('min', numbers);                      // 1
```

### **🎲 Random Utilities (`randomUtil`)**

Generate random data for testing:

```typescript
// Identifiers
restified.randomUtil('uuid');                            // "123e4567-e89b-12d3-a456-426614174000"
restified.randomUtil('string', 10);                     // "aBc3DeF7Gh"
restified.randomUtil('alphanumeric', 8);                 // "A3b7C9d2"
restified.randomUtil('numeric', 6);                     // "123456"

// Contact data
restified.randomUtil('email', 'company.com');           // "user123@company.com"
restified.randomUtil('phoneNumber', '+1-XXX-XXX-XXXX'); // "+1-555-123-4567"

// Misc
restified.randomUtil('boolean');                         // true/false
restified.randomUtil('arrayElement', ['a', 'b', 'c']);  // "b"
```

### **✅ Validation Utilities (`validationUtil`)**

Data validation and checks:

```typescript
// Format validation
restified.validationUtil('isEmail', 'test@example.com'); // true
restified.validationUtil('isUrl', 'https://example.com'); // true
restified.validationUtil('isUUID', uuid);                // true
restified.validationUtil('isPhoneNumber', '+1234567890'); // true
restified.validationUtil('isJSON', '{"key": "value"}');  // true
restified.validationUtil('isNumeric', '123.45');         // true
restified.validationUtil('isAlphaNumeric', 'abc123');    // true

// Length validation
restified.validationUtil('isLength', 'password', 8, 20); // true (8-20 chars)

// Pattern matching
restified.validationUtil('matches', 'abc123', '^[a-z]+[0-9]+$'); // true
```

### **🗃️ Data Utilities (`dataUtil`)**

Data transformation and manipulation:

```typescript
// JSON operations
const obj = { name: 'John', age: 30 };
restified.dataUtil('jsonStringify', obj, true);          // Pretty JSON
restified.dataUtil('jsonParse', '{"name":"John"}');      // Object

// CSV operations
const data = [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }];
restified.dataUtil('csvStringify', data);                // CSV string
restified.dataUtil('csvParse', csvString, ',', true);    // Array of objects

// XML operations (basic)
restified.dataUtil('xmlStringify', obj, 'root', true);   // XML string
restified.dataUtil('xmlParse', xmlString);               // Object

// Object manipulation
restified.dataUtil('objectPath', user, 'profile.name'); // "John Doe"
restified.dataUtil('objectSetPath', obj, 'profile.age', 30); // Sets nested value
restified.dataUtil('deepClone', obj);                   // Deep copy
restified.dataUtil('merge', obj1, obj2, obj3);          // Deep merge
restified.dataUtil('flatten', nestedObj);               // Flatten to dot notation
restified.dataUtil('unflatten', flatObj);               // Restore nested structure
```

### **🔒 Crypto Utilities (`cryptoUtil`)**

Cryptographic operations and hashing:

```typescript
// Hashing
restified.cryptoUtil('md5', 'hello world');             // MD5 hash
restified.cryptoUtil('sha1', 'hello world');            // SHA1 hash
restified.cryptoUtil('sha256', 'hello world');          // SHA256 hash
restified.cryptoUtil('sha512', 'hello world');          // SHA512 hash

// HMAC signatures
restified.cryptoUtil('hmacSha256', 'data', 'secret');   // HMAC-SHA256
restified.cryptoUtil('hmacSha512', 'data', 'secret', 'base64'); // Base64 output

// Password hashing
const hashed = restified.cryptoUtil('pbkdf2', 'password123'); // Secure hash
restified.cryptoUtil('verifyPbkdf2', 'password123', hashed.hash, hashed.salt); // true

// Encryption (AES-256-GCM)
const encrypted = restified.cryptoUtil('encrypt', 'secret data', 'password');
restified.cryptoUtil('decrypt', encrypted, 'password'); // "secret data"

// Key generation
restified.cryptoUtil('randomBytes', 32, 'hex');         // Random bytes
const keys = restified.cryptoUtil('generateKeyPair', 2048); // RSA key pair

// Digital signatures
const signature = restified.cryptoUtil('signRSA', 'data', keys.privateKey);
restified.cryptoUtil('verifyRSA', 'data', signature, keys.publicKey); // true
```

### **🛡️ Security Utilities (`securityUtil`)**

Security and authentication utilities:

```typescript
// JWT operations (basic implementation)
const token = restified.securityUtil('generateJWT', 
  { userId: 123, role: 'admin' }, 'secret', 3600);
const decoded = restified.securityUtil('verifyJWT', token, 'secret');

// API key generation
restified.securityUtil('generateApiKey', 32, 'api');    // "api_a1b2c3d4..."
restified.securityUtil('generateSecurePassword', 16);   // Strong password

// Data protection
restified.securityUtil('maskSensitiveData', 'credit-card-1234567890'); // "******7890"
restified.securityUtil('sanitizeInput', '<script>alert("xss")</script>'); // Escaped

// Tokens
restified.securityUtil('generateCSRFToken');            // CSRF token
```

### **📁 File Utilities (`fileUtil`)** - *Async Operations*

File system operations:

```typescript
// File operations
await restified.fileUtil('writeFile', 'output.txt', 'Hello World');
const content = await restified.fileUtil('readFile', 'input.txt');
await restified.fileUtil('appendFile', 'log.txt', 'New entry\n');

// File management
await restified.fileUtil('copyFile', 'source.txt', 'backup.txt');
await restified.fileUtil('moveFile', 'old.txt', 'new.txt');
await restified.fileUtil('deleteFile', 'temp.txt');

// File information
const exists = restified.fileUtil('fileExists', 'myfile.txt');
const stats = await restified.fileUtil('getFileStats', 'myfile.txt');

// Directory operations
await restified.fileUtil('createDirectory', 'new-folder');
await restified.fileUtil('deleteDirectory', 'old-folder', true);
const files = await restified.fileUtil('listDirectory', './');

// File search
const results = await restified.fileUtil('searchFiles', './', '*.js', true);
```

### **🔗 Encoding Utilities (`encodingUtil`)**

Encoding and decoding operations:

```typescript
// Base64
restified.encodingUtil('base64Encode', 'hello world');  // "aGVsbG8gd29ybGQ="
restified.encodingUtil('base64Decode', encoded);        // "hello world"

// URL encoding
restified.encodingUtil('urlEncode', 'hello world');     // "hello%20world"
restified.encodingUtil('urlDecode', encoded);           // "hello world"

// Hexadecimal
restified.encodingUtil('hexEncode', 'hello');           // "68656c6c6f"
restified.encodingUtil('hexDecode', hex);               // "hello"

// HTML encoding
restified.encodingUtil('htmlEncode', '<script>alert()</script>');
restified.encodingUtil('htmlDecode', encoded);

// Base32
restified.encodingUtil('base32Encode', 'hello');        // Base32 encoding
restified.encodingUtil('base32Decode', encoded);        // "hello"
```

### **🌐 Network Utilities (`networkUtil`)**

Network and URL operations:

```typescript
// URL parsing
const parsed = restified.networkUtil('parseUrl', 'https://api.example.com/users?page=1');
// { protocol: 'https:', hostname: 'api.example.com', pathname: '/users', ... }

// URL building
const url = restified.networkUtil('buildUrl', 'https://api.example.com/search', {
  q: 'restified',
  limit: 20,
  sort: 'name'
}); // "https://api.example.com/search?q=restified&limit=20&sort=name"

// Domain extraction
restified.networkUtil('extractDomain', 'https://api.example.com/users'); // "api.example.com"

// IP validation
restified.networkUtil('isValidIP', '192.168.1.1', 4);  // true (IPv4)
restified.networkUtil('isValidIP', '::1', 6);          // true (IPv6)
restified.networkUtil('isValidIP', '192.168.1.1');     // true (any version)
```

---

## 🚀 **Advanced Usage**

### **📦 Batch Execution**

Execute multiple utilities in a single call:

```typescript
const operations = [
  { function: 'string.toUpperCase', args: ['hello'] },
  { function: 'math.randomInt', args: [1, 10] },
  { function: 'date.timestamp', args: [] },
  { function: 'random.uuid', args: [] }
];

const results = restified.executeUtilityBatch(operations);
console.log(results.map(r => r.value)); // ["HELLO", 7, 1718462445123, "uuid..."]

// Async batch execution
const asyncResults = await restified.executeUtilityBatchAsync(operations);
```

### **🔄 Pipeline Processing**

Chain utilities together for complex transformations:

```typescript
// Text processing pipeline
const result = restified.executeUtilityPipeline('  Hello, World!  ', [
  { function: 'string.trim' },
  { function: 'string.toLowerCase' },
  { function: 'string.replace', args: ['world', 'universe'] },
  { function: 'string.toUpperCase' }
]);
console.log(result.value); // "HELLO, UNIVERSE!"

// Async pipeline
const asyncResult = await restified.executeUtilityPipelineAsync(input, operations);
```

### **🎯 Conditional Execution**

Execute utilities based on conditions:

```typescript
const shouldExecute = true;
const result = restified.executeUtilityIf(shouldExecute, 'string.toUpperCase', 'hello');
console.log(result?.value); // "HELLO"

// Safe execution with fallback
const safeResult = restified.executeUtilitySafe('invalid.function', 'fallback', 'arg1');
console.log(safeResult); // "fallback"
```

### **📊 Performance Monitoring**

Monitor utility performance and health:

```typescript
// Get performance metrics
const metrics = restified.getUtilityPerformanceMetrics();
console.log(metrics);
// {
//   totalExecutions: 150,
//   functionCounts: { 'string.toUpperCase': 25, 'date.now': 30, ... },
//   averageExecutionTimes: { 'string.toUpperCase': 0.1, ... }
// }

// Health check
const health = restified.utilityHealthCheck();
console.log(health.status); // 'healthy', 'degraded', or 'unhealthy'
console.log(health.issues);  // Array of issues if any

// Clear cache and logs
restified.clearUtilityCache();
restified.clearUtilityExecutionLog();
```

---

## 🔌 **Custom Utility Plugins**

### **Simple Custom Function**

```typescript
// Register a simple custom utility
restified.registerCustomUtility('business', 'calculateTax', 
  (amount: number, rate: number) => amount * rate, {
    description: 'Calculates tax amount',
    parameters: [
      { name: 'amount', type: 'number', required: true, description: 'Base amount' },
      { name: 'rate', type: 'number', required: true, description: 'Tax rate (0.08 = 8%)' }
    ]
  }
);

// Use the custom utility
const tax = restified.utility('business.calculateTax', 100, 0.08);
console.log(tax.value); // 8
```

### **Complete Custom Plugin**

```typescript
import { CustomUtilityPlugin } from 'restifiedts';

const businessPlugin: CustomUtilityPlugin = {
  name: 'business-utilities',
  version: '1.0.0',
  description: 'Business logic utilities',
  author: 'Your Company',
  categories: [
    {
      name: 'business',
      description: 'Business calculation utilities',
      functions: new Map([
        ['calculateTax', {
          name: 'calculateTax',
          description: 'Calculates tax amount',
          category: 'business',
          execute: (amount: number, rate: number) => amount * rate,
          parameters: [
            { name: 'amount', type: 'number', required: true, description: 'Base amount' },
            { name: 'rate', type: 'number', required: true, description: 'Tax rate' }
          ]
        }],
        ['formatCurrency', {
          name: 'formatCurrency',
          description: 'Formats number as currency',
          category: 'business',
          execute: (amount: number, currency: string = 'USD', locale: string = 'en-US') => {
            return new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: currency
            }).format(amount);
          },
          parameters: [
            { name: 'amount', type: 'number', required: true, description: 'Amount to format' },
            { name: 'currency', type: 'string', required: false, defaultValue: 'USD', description: 'Currency code' },
            { name: 'locale', type: 'string', required: false, defaultValue: 'en-US', description: 'Locale' }
          ]
        }],
        ['calculateDiscount', {
          name: 'calculateDiscount',
          description: 'Calculates discounted price',
          category: 'business',
          execute: (price: number, discountPercent: number) => {
            return price * (1 - discountPercent / 100);
          },
          parameters: [
            { name: 'price', type: 'number', required: true, description: 'Original price' },
            { name: 'discountPercent', type: 'number', required: true, description: 'Discount percentage' }
          ]
        }]
      ])
    }
  ],
  initialize: () => {
    console.log('Business utilities plugin initialized');
  },
  cleanup: () => {
    console.log('Business utilities plugin cleaned up');
  }
};

// Register the plugin
restified.registerUtilityPlugin(businessPlugin);

// Use plugin utilities
const tax = restified.utility('business.calculateTax', 100, 0.08);
const formatted = restified.utility('business.formatCurrency', 108, 'EUR', 'de-DE');
const discounted = restified.utility('business.calculateDiscount', 100, 20); // 80
```

### **Async Custom Utilities**

```typescript
restified.registerCustomUtility('api', 'fetchData', 
  async (url: string) => {
    const response = await fetch(url);
    return response.json();
  }, {
    description: 'Fetches data from URL',
    isAsync: true,
    parameters: [
      { name: 'url', type: 'string', required: true, description: 'URL to fetch' }
    ]
  }
);

// Use async utility
const data = await restified.utilityAsync('api.fetchData', 'https://api.example.com/data');
```

---

## 🔗 **Variable Integration**

### **Simple Variable Usage**

```typescript
// Use utilities in variable templates
const template = {
  id: '{{$util.random.uuid}}',
  timestamp: '{{$util.date.now("timestamp")}}',
  hash: '{{$util.crypto.sha256("data")}}',
  formatted: '{{$util.string.toUpperCase("hello")}}'
};

const resolved = restified.resolveVariables(template);
```

### **Complex Variable Chains**

```typescript
// Set base variables
restified.setGlobalVariable('userName', 'john doe');
restified.setGlobalVariable('baseAmount', 100);
restified.setLocalVariable('taxRate', 0.08);

// Complex template with utility chains
const template = {
  user: {
    id: '{{$util.random.uuid}}',
    name: '{{$util.string.toUpperCase({{userName}})}}',
    email: '{{$util.string.toLowerCase({{userName}})}}@{{$util.random.string(8)}}.com',
    nameHash: '{{$util.crypto.sha256({{$util.string.trim({{userName}})}})}}',
    isValid: '{{$util.validation.isEmail({{email}})}}'
  },
  order: {
    id: 'ORD_{{$util.date.now("timestamp")}}',
    amount: '{{baseAmount}}',
    tax: '{{$util.business.calculateTax({{baseAmount}}, {{taxRate}})}}',
    total: '{{$util.math.sum([{{baseAmount}}, {{tax}}])}}',
    currency: '{{$util.business.formatCurrency({{total}}, "USD")}}',
    createdAt: '{{$util.date.now("ISO")}}',
    expiresAt: '{{$util.date.addDays({{$util.date.now}}, 30, "YYYY-MM-DD")}}',
    formattedDate: '{{$util.date.format({{createdAt}}, "DD/MM/YYYY HH:mm:ss")}}'
  },
  audit: {
    requestId: '{{$util.random.uuid}}',
    checksum: '{{$util.crypto.md5({{$util.data.jsonStringify({{order}})}})}}',
    timestamp: '{{$util.date.now("unix")}}',
    userAgent: 'RestifiedTS/{{$util.string.substring("1.0.0-enterprise", 0, 5)}}'
  }
};

const resolved = restified.resolveVariables(template);
```

---

## 📖 **Best Practices**

### **1. Format Selection**

Choose appropriate formats for your use case:

```typescript
// API testing - use ISO for consistency
const isoDate = restified.dateUtil('addDays', date, 7); // ISO format

// Database operations - use timestamps for precision
const timestamp = restified.dateUtil('now', 'timestamp');

// User interfaces - use localized formats
const userDate = restified.dateUtil('now', 'DD/MM/YYYY HH:mm');

// File names - use safe formats
const filename = `report_${restified.dateUtil('now', 'YYYY-MM-DD_HH-mm-ss')}.csv`;
```

### **2. Performance Optimization**

```typescript
// Use batch execution for multiple operations
const results = restified.executeUtilityBatch([
  { function: 'string.toUpperCase', args: ['hello'] },
  { function: 'date.now', args: ['timestamp'] },
  { function: 'random.uuid', args: [] }
]);

// Use pipelines for transformations
const processed = restified.executeUtilityPipeline(input, [
  { function: 'string.trim' },
  { function: 'string.toLowerCase' },
  { function: 'string.camelCase' }
]);

// Monitor performance
const metrics = restified.getUtilityPerformanceMetrics();
if (metrics.averageExecutionTimes['myFunction'] > 100) {
  console.warn('Function performance degraded');
}
```

### **3. Error Handling**

```typescript
// Safe execution with fallbacks
const result = restified.executeUtilitySafe('risky.function', 'default', arg);

// Check results
const utilityResult = restified.utility('string.toUpperCase', 'hello');
if (utilityResult.success) {
  console.log(utilityResult.value);
} else {
  console.error(utilityResult.error);
}
```

### **4. Custom Utilities**

```typescript
// Document your utilities well
restified.registerCustomUtility('validation', 'isBusinessEmail', 
  (email: string) => {
    return email.endsWith('@company.com') && 
           restified.validationUtil('isEmail', email).value;
  }, {
    description: 'Validates company email addresses',
    parameters: [
      { 
        name: 'email', 
        type: 'string', 
        required: true, 
        description: 'Email address to validate (must end with @company.com)' 
      }
    ]
  }
);
```

---

## 🛡️ **Security Considerations**

### **Sensitive Data Handling**

```typescript
// Always mask sensitive data in logs
const maskedCard = restified.securityUtil('maskSensitiveData', creditCard);

// Sanitize user inputs
const safeInput = restified.securityUtil('sanitizeInput', userInput);

// Use secure random generation
const apiKey = restified.securityUtil('generateApiKey', 32, 'secure');

// Hash passwords properly
const hashed = restified.cryptoUtil('pbkdf2', password, salt, 10000);
```

### **Validation Best Practices**

```typescript
// Always validate inputs
if (!restified.validationUtil('isEmail', email).value) {
  throw new Error('Invalid email format');
}

if (!restified.validationUtil('isUUID', userId).value) {
  throw new Error('Invalid user ID format');
}

// Use length validation
if (!restified.validationUtil('isLength', password, 8, 128).value) {
  throw new Error('Password must be 8-128 characters');
}
```

---

## 📊 **Integration Examples**

### **API Testing Workflow**

```typescript
describe('User API Tests', function() {
  it('should create user with generated data', async function() {
    // Generate test data using utilities
    const userData = {
      id: restified.randomUtil('uuid').value,
      email: restified.randomUtil('email', 'testdomain.com').value,
      name: restified.stringUtil('toUpperCase', 'test user').value,
      password: restified.securityUtil('generateSecurePassword', 12).value,
      createdAt: restified.dateUtil('now', 'ISO').value,
      expiresAt: restified.dateUtil('addYears', new Date(), 1, 'ISO').value
    };

    // Create user
    const response = await restified
      .given()
        .baseURL('https://api.example.com')
      .when()
        .post('/users', userData)
        .execute();

    // Validate response
    await response
      .statusCode(201)
      .jsonPath('$.id', userData.id)
      .extract('$.id', 'createdUserId')
      .execute();

    // Verify with utilities
    const isValidEmail = restified.validationUtil('isEmail', userData.email).value;
    const isValidId = restified.validationUtil('isUUID', userData.id).value;
    
    expect(isValidEmail).to.be.true;
    expect(isValidId).to.be.true;
  });
});
```

### **Report Generation**

```typescript
// Generate comprehensive test report
const reportData = {
  metadata: {
    generated: restified.dateUtil('now', 'DD/MM/YYYY HH:mm:ss').value,
    reportId: restified.randomUtil('uuid').value,
    hash: restified.cryptoUtil('sha256', 'report-data').value
  },
  period: {
    start: restified.dateUtil('startOfMonth', new Date(), 'YYYY-MM-DD').value,
    end: restified.dateUtil('endOfMonth', new Date(), 'YYYY-MM-DD').value,
    days: restified.dateUtil('getDaysInMonth', new Date()).value
  },
  summary: {
    totalTests: 150,
    passRate: restified.mathUtil('round', 142/150 * 100, 2).value,
    avgResponseTime: restified.mathUtil('average', responseTimes).value
  }
};

// Convert to different formats
const csvReport = restified.dataUtil('csvStringify', [reportData]).value;
const jsonReport = restified.dataUtil('jsonStringify', reportData, true).value;

// Save reports
await restified.fileUtil('writeFile', 
  `report_${restified.dateUtil('now', 'YYYY-MM-DD')}.json`, 
  jsonReport
);
```

---

The Enterprise Utility System provides a comprehensive toolkit for all API testing and automation scenarios, with the flexibility to extend functionality through custom plugins while maintaining enterprise-grade security and performance standards.