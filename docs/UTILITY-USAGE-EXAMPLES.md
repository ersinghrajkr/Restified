# 📖 Utility Usage Examples & Best Practices

Complete usage examples and best practices for RestifiedTS Enterprise Utility System with real-world scenarios.

---

## 🚀 **Quick Start Examples**

### **Basic Utility Usage**

```typescript
import { restified } from 'restifiedts';

// String operations
const upperCase = restified.stringUtil('toUpperCase', 'hello world');
console.log(upperCase.value); // "HELLO WORLD"

// Date operations with custom formatting
const futureDate = restified.dateUtil('addDays', '2024-01-01', 30, 'YYYY-MM-DD');
console.log(futureDate.value); // "2024-01-31"

// Random data generation
const uuid = restified.randomUtil('uuid');
const email = restified.randomUtil('email', 'company.com');

// Cryptographic operations
const hash = restified.cryptoUtil('sha256', 'sensitive data');
const apiKey = restified.securityUtil('generateApiKey', 32, 'api');
```

### **Variable Integration**

```typescript
// Set variables for templates
restified.setGlobalVariable('baseUrl', 'https://api.example.com');
restified.setLocalVariable('userId', '12345');

// Use utilities in variable templates
const template = {
  user: {
    id: '{{userId}}',
    email: '{{$util.string.toLowerCase({{userName}})}}@company.com',
    apiKey: '{{$util.security.generateApiKey(32, "user")}}',
    createdAt: '{{$util.date.now("ISO")}}',
    expiresAt: '{{$util.date.addYears({{$util.date.now}}, 1, "timestamp")}}'
  }
};

const resolved = restified.resolveVariables(template);
```

---

## 🏢 **Enterprise Use Cases**

### **1. User Management API Testing**

```typescript
describe('User Management API', function() {
  beforeEach(async function() {
    // Generate test data using utilities
    restified.setLocalVariable('testEmail', 
      restified.randomUtil('email', 'testdomain.com').value);
    restified.setLocalVariable('testPassword', 
      restified.securityUtil('generateSecurePassword', 12).value);
    restified.setLocalVariable('userId', 
      restified.randomUtil('uuid').value);
  });

  it('should create user with generated data', async function() {
    const userData = {
      id: '{{userId}}',
      email: '{{testEmail}}',
      name: restified.stringUtil('toTitleCase', 'john doe').value,
      passwordHash: restified.cryptoUtil('sha256', '{{testPassword}}').value,
      createdAt: restified.dateUtil('now', 'ISO').value,
      expiresAt: restified.dateUtil('addYears', new Date(), 1, 'ISO').value,
      apiKey: restified.securityUtil('generateApiKey', 32, 'user').value
    };

    const response = await restified
      .given()
        .baseURL('https://api.example.com')
        .resolveVariables(userData)
      .when()
        .post('/users', userData)
        .execute();

    await response
      .statusCode(201)
      .jsonPath('$.id', userData.id)
      .extract('$.apiKey', 'userApiKey')
      .execute();

    // Validate response data using utilities
    const responseData = response.getResponseData();
    const isValidEmail = restified.validationUtil('isEmail', responseData.email).value;
    const isValidUUID = restified.validationUtil('isUUID', responseData.id).value;
    
    expect(isValidEmail).to.be.true;
    expect(isValidUUID).to.be.true;
  });
});
```

### **2. Financial API Testing with Calculations**

```typescript
// Register custom business utilities
restified.registerCustomUtility('finance', 'calculateTax', 
  (amount: number, rate: number) => amount * rate, {
    description: 'Calculate tax amount',
    parameters: [
      { name: 'amount', type: 'number', required: true },
      { name: 'rate', type: 'number', required: true }
    ]
  });

restified.registerCustomUtility('finance', 'formatCurrency', 
  (amount: number, currency = 'USD', locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  });

describe('Financial API', function() {
  it('should process order with calculations', async function() {
    const baseAmount = 100.00;
    const taxRate = 0.08;
    
    const orderData = {
      orderId: restified.randomUtil('uuid').value,
      customerId: restified.randomUtil('uuid').value,
      amount: baseAmount,
      tax: restified.utility('finance.calculateTax', baseAmount, taxRate).value,
      total: baseAmount + restified.utility('finance.calculateTax', baseAmount, taxRate).value,
      currency: 'USD',
      createdAt: restified.dateUtil('now', 'ISO').value,
      checksum: restified.cryptoUtil('sha256', 
        restified.dataUtil('jsonStringify', { amount: baseAmount, tax: taxRate }).value
      ).value
    };

    const response = await restified
      .given()
        .baseURL('https://api.financial.com')
      .when()
        .post('/orders', orderData)
        .execute();

    await response
      .statusCode(201)
      .jsonPath('$.total', orderData.total)
      .execute();

    // Format for reporting
    const formattedAmount = restified.utility('finance.formatCurrency', orderData.total).value;
    console.log(`Order total: ${formattedAmount}`);
  });
});
```

### **3. Multi-Service Authentication Testing**

```typescript
describe('Multi-Service Authentication', function() {
  let authToken: string;
  let refreshToken: string;

  before(async function() {
    // Authenticate and extract tokens
    const authResponse = await restified
      .given()
        .useClient('authService')
      .when()
        .post('/oauth/token', {
          grant_type: 'client_credentials',
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET
        })
        .execute();

    await authResponse
      .statusCode(200)
      .extract('$.access_token', 'authToken')
      .extract('$.refresh_token', 'refreshToken')
      .execute();

    authToken = restified.getGlobalVariable('authToken');
    refreshToken = restified.getGlobalVariable('refreshToken');
  });

  it('should access protected resources across services', async function() {
    const serviceTests = [
      { client: 'userService', endpoint: '/users/profile' },
      { client: 'orderService', endpoint: '/orders' },
      { client: 'paymentService', endpoint: '/payments/methods' }
    ];

    for (const test of serviceTests) {
      const response = await restified
        .given()
          .useClient(test.client)
          .header('Authorization', `Bearer ${authToken}`)
          .header('X-Request-ID', restified.randomUtil('uuid').value)
          .header('X-Timestamp', restified.dateUtil('now', 'timestamp').value)
        .when()
          .get(test.endpoint)
          .execute();

      await response
        .statusCode(200)
        .header('Content-Type', /application\/json/)
        .execute();
    }
  });
});
```

### **4. Data Processing and Transformation**

```typescript
describe('Data Processing API', function() {
  it('should process CSV data upload', async function() {
    // Generate test data
    const testData = [
      { 
        name: restified.stringUtil('toTitleCase', 'john doe').value,
        email: restified.randomUtil('email', 'company.com').value,
        phone: restified.randomUtil('phoneNumber', '+1-XXX-XXX-XXXX').value,
        joinDate: restified.dateUtil('now', 'YYYY-MM-DD').value
      },
      { 
        name: restified.stringUtil('toTitleCase', 'jane smith').value,
        email: restified.randomUtil('email', 'company.com').value,
        phone: restified.randomUtil('phoneNumber', '+1-XXX-XXX-XXXX').value,
        joinDate: restified.dateUtil('subtractDays', new Date(), 30, 'YYYY-MM-DD').value
      }
    ];

    // Convert to CSV
    const csvData = restified.dataUtil('csvStringify', testData).value;
    
    // Create file for upload
    await restified.fileUtil('writeFile', './test-upload.csv', csvData);

    const response = await restified
      .given()
        .baseURL('https://api.dataprocessing.com')
        .multipart()
      .when()
        .post('/data/upload')
        .attach('file', './test-upload.csv')
        .execute();

    await response
      .statusCode(200)
      .jsonPath('$.processedRows', testData.length)
      .execute();

    // Cleanup
    await restified.fileUtil('deleteFile', './test-upload.csv');
  });

  it('should validate processed data integrity', async function() {
    const originalData = {
      id: restified.randomUtil('uuid').value,
      content: 'sensitive business data',
      timestamp: restified.dateUtil('now', 'timestamp').value
    };

    // Create checksum for integrity verification
    const originalHash = restified.cryptoUtil('sha256', 
      restified.dataUtil('jsonStringify', originalData).value
    ).value;

    const response = await restified
      .given()
        .baseURL('https://api.dataprocessing.com')
      .when()
        .post('/data/process', {
          ...originalData,
          checksum: originalHash
        })
        .execute();

    const processedData = response.getResponseData();
    
    // Verify data integrity
    const processedHash = restified.cryptoUtil('sha256', 
      restified.dataUtil('jsonStringify', {
        id: processedData.id,
        content: processedData.content,
        timestamp: processedData.timestamp
      }).value
    ).value;

    expect(processedHash).to.equal(originalHash);
  });
});
```

---

## 🔄 **Advanced Batch and Pipeline Operations**

### **Batch Processing for Performance**

```typescript
// Process multiple operations in parallel
const batchOperations = [
  { function: 'string.toUpperCase', args: ['hello'] },
  { function: 'random.uuid', args: [] },
  { function: 'date.now', args: ['timestamp'] },
  { function: 'crypto.sha256', args: ['batch data'] },
  { function: 'validation.isEmail', args: ['test@example.com'] }
];

const results = restified.executeUtilityBatch(batchOperations);
const values = results.map(r => r.value);

console.log('Batch results:', values);
// ["HELLO", "uuid-string", 1234567890, "hash-string", true]
```

### **Data Transformation Pipelines**

```typescript
// Text processing pipeline
const textPipeline = restified.executeUtilityPipeline('  Hello, World!  ', [
  { function: 'string.trim' },
  { function: 'string.toLowerCase' },
  { function: 'string.replace', args: ['world', 'universe'] },
  { function: 'string.toUpperCase' },
  { function: 'string.padEnd', args: [20, '!'] }
]);

console.log(textPipeline.value); // "HELLO, UNIVERSE!!!!"

// Data validation pipeline
const validateUserData = (userData: any) => {
  return restified.executeUtilityPipeline(userData, [
    { function: 'validation.isEmail', args: [userData.email] },
    { function: 'validation.isLength', args: [userData.password, 8, 128] },
    { function: 'validation.isUUID', args: [userData.id] }
  ]);
};
```

### **Conditional and Safe Execution**

```typescript
// Conditional execution based on environment
const shouldMaskData = process.env.NODE_ENV === 'production';

const processedData = restified.executeUtilityIf(
  shouldMaskData,
  'security.maskSensitiveData',
  'credit-card-1234567890'
);

// Safe execution with fallback
const safeResult = restified.executeUtilitySafe(
  'unreliable.function',
  'fallback-value',
  'argument'
);

console.log(safeResult); // "fallback-value" if function fails
```

---

## 📊 **Reporting and Analytics Integration**

### **Generate Comprehensive Reports**

```typescript
// Generate test execution report
function generateTestReport() {
  const reportData = {
    metadata: {
      generated: restified.dateUtil('now', 'DD/MM/YYYY HH:mm:ss').value,
      reportId: restified.randomUtil('uuid').value,
      environment: process.env.NODE_ENV || 'development',
      hash: restified.cryptoUtil('md5', `report-${Date.now()}`).value
    },
    period: {
      start: restified.dateUtil('startOfMonth', new Date(), 'YYYY-MM-DD').value,
      end: restified.dateUtil('endOfMonth', new Date(), 'YYYY-MM-DD').value,
      days: restified.dateUtil('getDaysInMonth', new Date()).value
    },
    performance: {
      avgResponseTime: restified.mathUtil('average', [120, 95, 180, 67]).value,
      maxResponseTime: restified.mathUtil('max', [120, 95, 180, 67]).value,
      minResponseTime: restified.mathUtil('min', [120, 95, 180, 67]).value
    },
    security: {
      apiKeysGenerated: 15,
      dataEncrypted: restified.cryptoUtil('encrypt', 'sensitive data', 'key').value.length,
      checksumVerified: true
    }
  };

  // Convert to different formats
  const jsonReport = restified.dataUtil('jsonStringify', reportData, true).value;
  const csvReport = restified.dataUtil('csvStringify', [reportData]).value;

  return { json: jsonReport, csv: csvReport, data: reportData };
}

// Save reports with timestamps
async function saveReports() {
  const reports = generateTestReport();
  const timestamp = restified.dateUtil('now', 'YYYY-MM-DD_HH-mm-ss').value;

  await restified.fileUtil('writeFile', `./reports/test-report-${timestamp}.json`, reports.json);
  await restified.fileUtil('writeFile', `./reports/test-report-${timestamp}.csv`, reports.csv);

  console.log(`Reports saved with timestamp: ${timestamp}`);
}
```

### **Performance Monitoring**

```typescript
// Monitor utility performance
function monitorUtilityPerformance() {
  // Execute various utilities
  for (let i = 0; i < 100; i++) {
    restified.stringUtil('toUpperCase', `test ${i}`);
    restified.dateUtil('now', 'timestamp');
    restified.randomUtil('uuid');
    restified.mathUtil('randomInt', 1, 1000);
  }

  const metrics = restified.getUtilityPerformanceMetrics();
  const health = restified.utilityHealthCheck();

  const performanceReport = {
    timestamp: restified.dateUtil('now', 'ISO').value,
    totalExecutions: metrics.totalExecutions,
    functionCounts: metrics.functionCounts,
    averageExecutionTimes: metrics.averageExecutionTimes,
    healthStatus: health.status,
    issues: health.issues,
    cacheSize: Object.keys(metrics.functionCounts).length
  };

  console.log('Performance Report:', JSON.stringify(performanceReport, null, 2));

  // Alert if performance degrades
  Object.entries(metrics.averageExecutionTimes).forEach(([func, time]) => {
    if (time > 100) { // 100ms threshold
      console.warn(`⚠️ Performance warning: ${func} took ${time}ms`);
    }
  });

  return performanceReport;
}
```

---

## 🔌 **Custom Plugin Development**

### **Simple Custom Utilities**

```typescript
// Register domain-specific utilities
restified.registerCustomUtility('business', 'calculateDiscount', 
  (price: number, discountPercent: number) => {
    return price * (1 - discountPercent / 100);
  }, {
    description: 'Calculate discounted price',
    parameters: [
      { name: 'price', type: 'number', required: true, description: 'Original price' },
      { name: 'discountPercent', type: 'number', required: true, description: 'Discount percentage' }
    ]
  });

// Use custom utility
const discountedPrice = restified.utility('business.calculateDiscount', 100, 20);
console.log(discountedPrice.value); // 80
```

### **Complete Plugin Example**

```typescript
import { CustomUtilityPlugin } from 'restifiedts';

const ECommercePlugin: CustomUtilityPlugin = {
  name: 'ecommerce-utilities',
  version: '1.0.0',
  description: 'E-commerce specific utility functions',
  author: 'Your Company',
  categories: [
    {
      name: 'ecommerce',
      description: 'E-commerce business logic utilities',
      functions: new Map([
        ['calculateShipping', {
          name: 'calculateShipping',
          description: 'Calculate shipping cost based on weight and distance',
          category: 'ecommerce',
          execute: (weight: number, distance: number, shippingRate = 0.1) => {
            const baseCost = weight * distance * shippingRate;
            return Math.max(baseCost, 5.00); // Minimum $5 shipping
          },
          parameters: [
            { name: 'weight', type: 'number', required: true, description: 'Package weight in kg' },
            { name: 'distance', type: 'number', required: true, description: 'Shipping distance in km' },
            { name: 'shippingRate', type: 'number', required: false, defaultValue: 0.1, description: 'Rate per kg/km' }
          ]
        }],
        ['generateSKU', {
          name: 'generateSKU',
          description: 'Generate product SKU',
          category: 'ecommerce',
          execute: (category: string, subcategory: string) => {
            const timestamp = Date.now().toString().slice(-6);
            return `${category.toUpperCase()}-${subcategory.toUpperCase()}-${timestamp}`;
          },
          parameters: [
            { name: 'category', type: 'string', required: true, description: 'Product category' },
            { name: 'subcategory', type: 'string', required: true, description: 'Product subcategory' }
          ]
        }],
        ['validateCreditCard', {
          name: 'validateCreditCard',
          description: 'Validate credit card number using Luhn algorithm',
          category: 'ecommerce',
          execute: (cardNumber: string) => {
            const digits = cardNumber.replace(/\D/g, '');
            let sum = 0;
            let isEven = false;
            
            for (let i = digits.length - 1; i >= 0; i--) {
              let digit = parseInt(digits[i]);
              
              if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
              }
              
              sum += digit;
              isEven = !isEven;
            }
            
            return sum % 10 === 0;
          },
          parameters: [
            { name: 'cardNumber', type: 'string', required: true, description: 'Credit card number' }
          ]
        }]
      ])
    }
  ],
  initialize: () => {
    console.log('E-commerce utilities plugin initialized');
  },
  cleanup: () => {
    console.log('E-commerce utilities plugin cleaned up');
  }
};

// Register and use the plugin
restified.registerUtilityPlugin(ECommercePlugin);

// Use plugin utilities in tests
describe('E-commerce API Tests', function() {
  it('should calculate order totals correctly', async function() {
    const orderData = {
      productPrice: 99.99,
      weight: 2.5,
      shippingDistance: 150,
      sku: restified.utility('ecommerce.generateSKU', 'electronics', 'laptop').value,
      shipping: restified.utility('ecommerce.calculateShipping', 2.5, 150).value,
      creditCardValid: restified.utility('ecommerce.validateCreditCard', '4532015112830366').value
    };

    expect(orderData.creditCardValid).to.be.true;
    expect(orderData.shipping).to.be.greaterThan(5.00);
    expect(orderData.sku).to.match(/^ELECTRONICS-LAPTOP-\d{6}$/);
  });
});
```

---

## 🛡️ **Security Best Practices**

### **Secure Data Handling**

```typescript
// Always mask sensitive data in logs and reports
function processSensitiveData(userData: any) {
  const processedData = {
    ...userData,
    creditCard: restified.securityUtil('maskSensitiveData', userData.creditCard).value,
    ssn: restified.securityUtil('maskSensitiveData', userData.ssn).value,
    password: '[REDACTED]'
  };

  // Generate secure hash for integrity
  const dataHash = restified.cryptoUtil('sha256', 
    restified.dataUtil('jsonStringify', processedData).value
  ).value;

  return { data: processedData, hash: dataHash };
}

// Sanitize all user inputs
function sanitizeApiInput(input: any) {
  if (typeof input === 'string') {
    return restified.securityUtil('sanitizeInput', input).value;
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeApiInput(value);
    }
    return sanitized;
  }
  
  return input;
}
```

### **Authentication Security**

```typescript
// Generate secure tokens and API keys
function generateSecureCredentials() {
  return {
    apiKey: restified.securityUtil('generateApiKey', 32, 'secure').value,
    clientSecret: restified.securityUtil('generateSecurePassword', 64).value,
    sessionToken: restified.randomUtil('string', 32).value,
    csrfToken: restified.securityUtil('generateCSRFToken').value,
    requestId: restified.randomUtil('uuid').value
  };
}

// Verify data integrity with HMAC
function createSecurePayload(data: any, secret: string) {
  const jsonData = restified.dataUtil('jsonStringify', data).value;
  const signature = restified.cryptoUtil('hmacSha256', jsonData, secret).value;
  
  return {
    data: data,
    signature: signature,
    timestamp: restified.dateUtil('now', 'timestamp').value
  };
}

function verifySecurePayload(payload: any, secret: string): boolean {
  const jsonData = restified.dataUtil('jsonStringify', payload.data).value;
  const expectedSignature = restified.cryptoUtil('hmacSha256', jsonData, secret).value;
  
  return payload.signature === expectedSignature;
}
```

---

## 📈 **Performance Optimization**

### **Efficient Utility Usage**

```typescript
// Use batch operations for multiple utilities
const efficientProcessing = () => {
  // Instead of individual calls
  const operations = [
    { function: 'string.toUpperCase', args: ['text1'] },
    { function: 'string.toUpperCase', args: ['text2'] },
    { function: 'date.now', args: ['timestamp'] },
    { function: 'random.uuid', args: [] }
  ];

  return restified.executeUtilityBatch(operations);
};

// Use pipelines for transformations
const efficientTransformation = (input: string) => {
  return restified.executeUtilityPipeline(input, [
    { function: 'string.trim' },
    { function: 'string.toLowerCase' },
    { function: 'string.camelCase' }
  ]);
};

// Monitor and optimize performance
const optimizePerformance = () => {
  const metrics = restified.getUtilityPerformanceMetrics();
  
  // Identify slow functions
  const slowFunctions = Object.entries(metrics.averageExecutionTimes)
    .filter(([, time]) => time > 50)
    .sort(([, a], [, b]) => b - a);

  if (slowFunctions.length > 0) {
    console.warn('Slow utility functions detected:', slowFunctions);
  }

  // Clear cache if it gets too large
  if (Object.keys(metrics.functionCounts).length > 1000) {
    restified.clearUtilityCache();
    console.log('Utility cache cleared for performance');
  }
};
```

---

## 🎯 **Testing Patterns and Strategies**

### **Data-Driven Testing**

```typescript
// Generate test data sets using utilities
function generateUserTestData(count: number) {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    users.push({
      id: restified.randomUtil('uuid').value,
      email: restified.randomUtil('email', 'testdomain.com').value,
      name: restified.stringUtil('toTitleCase', `test user ${i + 1}`).value,
      age: restified.mathUtil('randomInt', 18, 80).value,
      joinDate: restified.dateUtil('subtractDays', new Date(), 
        restified.mathUtil('randomInt', 1, 365).value, 'YYYY-MM-DD').value,
      apiKey: restified.securityUtil('generateApiKey', 16, 'user').value
    });
  }
  
  return users;
}

// Use generated data in parameterized tests
describe('User API - Data Driven Tests', function() {
  const testUsers = generateUserTestData(5);
  
  testUsers.forEach((user, index) => {
    it(`should handle user ${index + 1}: ${user.name}`, async function() {
      const response = await restified
        .given()
          .baseURL('https://api.example.com')
        .when()
          .post('/users', user)
          .execute();

      await response
        .statusCode(201)
        .jsonPath('$.id', user.id)
        .jsonPath('$.email', user.email)
        .execute();

      // Validate generated data
      expect(restified.validationUtil('isEmail', user.email).value).to.be.true;
      expect(restified.validationUtil('isUUID', user.id).value).to.be.true;
    });
  });
});
```

### **Environment-Specific Testing**

```typescript
// Configure utilities based on environment
const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    development: {
      baseUrl: 'http://localhost:3000',
      apiKeyLength: 16,
      dataFormat: 'YYYY-MM-DD',
      enableDebug: true
    },
    staging: {
      baseUrl: 'https://staging-api.example.com',
      apiKeyLength: 32,
      dataFormat: 'ISO',
      enableDebug: false
    },
    production: {
      baseUrl: 'https://api.example.com',
      apiKeyLength: 64,
      dataFormat: 'timestamp',
      enableDebug: false
    }
  }[env];
};

// Use environment-specific utilities
describe('Environment-Specific Tests', function() {
  const config = getEnvironmentConfig();
  
  it('should use environment-appropriate settings', async function() {
    const testData = {
      id: restified.randomUtil('uuid').value,
      apiKey: restified.securityUtil('generateApiKey', config.apiKeyLength, 'env').value,
      timestamp: restified.dateUtil('now', config.dataFormat).value,
      environment: process.env.NODE_ENV
    };

    if (config.enableDebug) {
      console.log('Test data:', testData);
    }

    const response = await restified
      .given()
        .baseURL(config.baseUrl)
      .when()
        .post('/test-env', testData)
        .execute();

    await response.statusCode(200).execute();
  });
});
```

---

The Enterprise Utility System provides comprehensive tools for all testing scenarios while maintaining security, performance, and enterprise-grade reliability. These examples demonstrate how to leverage the full power of the utility system in real-world API testing scenarios.