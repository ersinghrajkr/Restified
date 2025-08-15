# 🔌 Custom Plugin Development Guide

Complete guide for developing custom utility plugins for RestifiedTS Enterprise Utility System.

---

## 📋 **Overview**

The RestifiedTS utility system supports custom plugins to extend functionality with domain-specific utilities. Plugins can add new utility categories, functions, and integrate seamlessly with the existing system.

### **Plugin Architecture**

```
┌─────────────────────────────────────────┐
│            Your Plugin                  │
│  (Custom utilities & functions)        │
├─────────────────────────────────────────┤
│          Plugin Interface               │
│    (Standardized integration)          │
├─────────────────────────────────────────┤
│         Utility Registry                │
│  (Registration & management)           │
├─────────────────────────────────────────┤
│         Core Utility System            │
│    (Execution & caching)               │
└─────────────────────────────────────────┘
```

---

## 🚀 **Quick Start**

### **Simple Custom Function**

```typescript
import { restified } from 'restifiedts';

// Register a single utility function
restified.registerCustomUtility('math', 'fibonacci', 
  (n: number): number => {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }, {
    description: 'Calculate fibonacci number at position n',
    parameters: [
      { name: 'n', type: 'number', required: true, description: 'Position in sequence' }
    ]
  }
);

// Use the custom utility
const result = restified.utility('math.fibonacci', 10);
console.log(result.value); // 55
```

### **Custom Utility Category**

```typescript
// Register multiple utilities in a new category
restified.registerCustomUtility('text', 'removeHtml', 
  (html: string) => html.replace(/<[^>]*>/g, ''));

restified.registerCustomUtility('text', 'extractUrls', 
  (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  });

restified.registerCustomUtility('text', 'wordCount', 
  (text: string) => text.trim().split(/\s+/).length);

// Use the utilities
const cleanText = restified.textUtil('removeHtml', '<p>Hello <b>World</b></p>');
const urls = restified.textUtil('extractUrls', 'Visit https://example.com for more info');
const words = restified.textUtil('wordCount', 'The quick brown fox jumps');
```

---

## 🏗️ **Plugin Interface Specification**

### **CustomUtilityPlugin Interface**

```typescript
interface CustomUtilityPlugin {
  // Plugin metadata
  name: string;                    // Unique plugin identifier
  version: string;                 // Semantic version (e.g., "1.0.0")
  description: string;             // Plugin description
  author: string;                  // Author or organization
  license?: string;                // License type (optional)
  homepage?: string;               // Plugin homepage URL (optional)
  repository?: string;             // Source repository URL (optional)
  
  // Plugin categories and functions
  categories: UtilityCategory[];   // Array of utility categories
  
  // Lifecycle hooks
  initialize?: () => void | Promise<void>;  // Called when plugin is registered
  cleanup?: () => void | Promise<void>;     // Called during cleanup
  
  // Plugin configuration (optional)
  config?: Record<string, any>;    // Plugin-specific configuration
  dependencies?: string[];         // Required dependencies
}
```

### **UtilityCategory Interface**

```typescript
interface UtilityCategory {
  name: string;                           // Category name (e.g., 'business')
  description: string;                    // Category description
  functions: Map<string, UtilityFunction>; // Map of function name to function
}
```

### **UtilityFunction Interface**

```typescript
interface UtilityFunction {
  name: string;                    // Function name
  description: string;             // Function description
  category: string;                // Category this function belongs to
  execute: (...args: any[]) => any; // Function implementation
  isAsync?: boolean;               // Whether function is async
  parameters?: UtilityParameter[]; // Parameter definitions
  examples?: string[];             // Usage examples
  tags?: string[];                 // Function tags for categorization
}
```

### **UtilityParameter Interface**

```typescript
interface UtilityParameter {
  name: string;                    // Parameter name
  type: string;                    // Parameter type ('string', 'number', etc.)
  required: boolean;               // Whether parameter is required
  description: string;             // Parameter description
  defaultValue?: any;              // Default value if not required
  validation?: (value: any) => boolean; // Optional validation function
  examples?: any[];                // Example values
}
```

---

## 🔧 **Development Patterns**

### **1. Business Logic Plugin**

```typescript
import { CustomUtilityPlugin, UtilityFunction } from 'restifiedts';

const BusinessPlugin: CustomUtilityPlugin = {
  name: 'business-logic',
  version: '1.2.0',
  description: 'Business calculation and validation utilities',
  author: 'Your Company',
  license: 'MIT',
  
  categories: [
    {
      name: 'finance',
      description: 'Financial calculation utilities',
      functions: new Map<string, UtilityFunction>([
        ['calculateTax', {
          name: 'calculateTax',
          description: 'Calculate tax amount based on rate and jurisdiction',
          category: 'finance',
          execute: (amount: number, rate: number, jurisdiction = 'US') => {
            const baseRate = rate / 100;
            const jurisdictionMultiplier = {
              'US': 1.0,
              'EU': 1.2,
              'UK': 1.1,
              'CA': 1.05
            }[jurisdiction] || 1.0;
            
            return amount * baseRate * jurisdictionMultiplier;
          },
          parameters: [
            { 
              name: 'amount', 
              type: 'number', 
              required: true, 
              description: 'Base amount to calculate tax on',
              examples: [100, 1000, 50.50]
            },
            { 
              name: 'rate', 
              type: 'number', 
              required: true, 
              description: 'Tax rate as percentage (e.g., 8.5 for 8.5%)',
              examples: [8.5, 10, 15.5]
            },
            { 
              name: 'jurisdiction', 
              type: 'string', 
              required: false, 
              defaultValue: 'US',
              description: 'Tax jurisdiction code',
              examples: ['US', 'EU', 'UK', 'CA']
            }
          ],
          examples: [
            'calculateTax(100, 8.5) // 8.5',
            'calculateTax(100, 10, "EU") // 12.0'
          ],
          tags: ['finance', 'tax', 'calculation']
        }],
        
        ['formatCurrency', {
          name: 'formatCurrency',
          description: 'Format number as currency with locale support',
          category: 'finance',
          execute: (amount: number, currency = 'USD', locale = 'en-US') => {
            return new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: currency
            }).format(amount);
          },
          parameters: [
            { name: 'amount', type: 'number', required: true, description: 'Amount to format' },
            { name: 'currency', type: 'string', required: false, defaultValue: 'USD', description: 'Currency code' },
            { name: 'locale', type: 'string', required: false, defaultValue: 'en-US', description: 'Locale for formatting' }
          ]
        }],
        
        ['calculateCompoundInterest', {
          name: 'calculateCompoundInterest',
          description: 'Calculate compound interest',
          category: 'finance',
          execute: (principal: number, rate: number, time: number, frequency = 1) => {
            const r = rate / 100;
            return principal * Math.pow((1 + r / frequency), frequency * time);
          },
          parameters: [
            { name: 'principal', type: 'number', required: true, description: 'Initial amount' },
            { name: 'rate', type: 'number', required: true, description: 'Annual interest rate (%)' },
            { name: 'time', type: 'number', required: true, description: 'Time in years' },
            { name: 'frequency', type: 'number', required: false, defaultValue: 1, description: 'Compounding frequency per year' }
          ]
        }]
      ])
    },
    
    {
      name: 'inventory',
      description: 'Inventory management utilities',
      functions: new Map<string, UtilityFunction>([
        ['generateSKU', {
          name: 'generateSKU',
          description: 'Generate product SKU with category and timestamp',
          category: 'inventory',
          execute: (category: string, subcategory?: string, prefix?: string) => {
            const timestamp = Date.now().toString().slice(-6);
            const parts = [
              prefix || 'PRD',
              category.toUpperCase(),
              subcategory?.toUpperCase(),
              timestamp
            ].filter(Boolean);
            
            return parts.join('-');
          },
          parameters: [
            { name: 'category', type: 'string', required: true, description: 'Product category' },
            { name: 'subcategory', type: 'string', required: false, description: 'Product subcategory' },
            { name: 'prefix', type: 'string', required: false, defaultValue: 'PRD', description: 'SKU prefix' }
          ]
        }],
        
        ['calculateReorderPoint', {
          name: 'calculateReorderPoint',
          description: 'Calculate inventory reorder point',
          category: 'inventory',
          execute: (dailyUsage: number, leadTimeDays: number, safetyStock = 0) => {
            return (dailyUsage * leadTimeDays) + safetyStock;
          },
          parameters: [
            { name: 'dailyUsage', type: 'number', required: true, description: 'Average daily usage' },
            { name: 'leadTimeDays', type: 'number', required: true, description: 'Lead time in days' },
            { name: 'safetyStock', type: 'number', required: false, defaultValue: 0, description: 'Safety stock quantity' }
          ]
        }]
      ])
    }
  ],
  
  initialize: () => {
    console.log('Business Logic Plugin v1.2.0 initialized');
  },
  
  cleanup: () => {
    console.log('Business Logic Plugin cleaned up');
  },
  
  config: {
    defaultCurrency: 'USD',
    defaultLocale: 'en-US',
    taxJurisdictions: ['US', 'EU', 'UK', 'CA']
  }
};

export default BusinessPlugin;
```

### **2. Data Processing Plugin**

```typescript
const DataProcessingPlugin: CustomUtilityPlugin = {
  name: 'data-processing',
  version: '1.0.0',
  description: 'Advanced data processing and transformation utilities',
  author: 'Data Team',
  
  categories: [
    {
      name: 'transform',
      description: 'Data transformation utilities',
      functions: new Map([
        ['flattenObject', {
          name: 'flattenObject',
          description: 'Flatten nested object to dot notation',
          category: 'transform',
          execute: (obj: Record<string, any>, prefix = ''): Record<string, any> => {
            const flattened: Record<string, any> = {};
            
            for (const [key, value] of Object.entries(obj)) {
              const newKey = prefix ? `${prefix}.${key}` : key;
              
              if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.execute(value, newKey));
              } else {
                flattened[newKey] = value;
              }
            }
            
            return flattened;
          },
          parameters: [
            { name: 'obj', type: 'object', required: true, description: 'Object to flatten' },
            { name: 'prefix', type: 'string', required: false, defaultValue: '', description: 'Key prefix' }
          ]
        }],
        
        ['arrayToCSV', {
          name: 'arrayToCSV',
          description: 'Convert array of objects to CSV string',
          category: 'transform',
          execute: (data: Record<string, any>[], delimiter = ',') => {
            if (!data.length) return '';
            
            const headers = Object.keys(data[0]);
            const csvHeaders = headers.join(delimiter);
            
            const csvRows = data.map(row => 
              headers.map(header => {
                const value = row[header];
                const stringValue = value === null || value === undefined ? '' : String(value);
                return stringValue.includes(delimiter) ? `"${stringValue}"` : stringValue;
              }).join(delimiter)
            );
            
            return [csvHeaders, ...csvRows].join('\\n');
          },
          parameters: [
            { name: 'data', type: 'array', required: true, description: 'Array of objects to convert' },
            { name: 'delimiter', type: 'string', required: false, defaultValue: ',', description: 'CSV delimiter' }
          ]
        }],
        
        ['groupBy', {
          name: 'groupBy',
          description: 'Group array elements by a key',
          category: 'transform',
          execute: (array: any[], key: string) => {
            return array.reduce((groups, item) => {
              const groupKey = item[key];
              if (!groups[groupKey]) {
                groups[groupKey] = [];
              }
              groups[groupKey].push(item);
              return groups;
            }, {} as Record<string, any[]>);
          },
          parameters: [
            { name: 'array', type: 'array', required: true, description: 'Array to group' },
            { name: 'key', type: 'string', required: true, description: 'Key to group by' }
          ]
        }]
      ])
    }
  ],
  
  initialize: () => {
    console.log('Data Processing Plugin initialized');
  }
};
```

### **3. Async Plugin with External Dependencies**

```typescript
const AsyncAPIPlugin: CustomUtilityPlugin = {
  name: 'async-api-utilities',
  version: '1.0.0',
  description: 'Asynchronous API testing utilities',
  author: 'API Team',
  dependencies: ['axios'], // External dependencies
  
  categories: [
    {
      name: 'api',
      description: 'API testing utilities',
      functions: new Map([
        ['fetchData', {
          name: 'fetchData',
          description: 'Fetch data from URL with timeout',
          category: 'api',
          isAsync: true,
          execute: async (url: string, timeout = 5000) => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);
              
              const response = await fetch(url, { 
                signal: controller.signal 
              });
              
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              return await response.json();
            } catch (error) {
              if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
              }
              throw error;
            }
          },
          parameters: [
            { name: 'url', type: 'string', required: true, description: 'URL to fetch data from' },
            { name: 'timeout', type: 'number', required: false, defaultValue: 5000, description: 'Timeout in milliseconds' }
          ]
        }],
        
        ['validateApiResponse', {
          name: 'validateApiResponse',
          description: 'Validate API response structure',
          category: 'api',
          execute: (response: any, schema: Record<string, string>) => {
            const errors: string[] = [];
            
            for (const [key, expectedType] of Object.entries(schema)) {
              if (!(key in response)) {
                errors.push(`Missing required field: ${key}`);
                continue;
              }
              
              const actualType = typeof response[key];
              if (actualType !== expectedType) {
                errors.push(`Field ${key}: expected ${expectedType}, got ${actualType}`);
              }
            }
            
            return {
              valid: errors.length === 0,
              errors: errors
            };
          },
          parameters: [
            { name: 'response', type: 'object', required: true, description: 'API response to validate' },
            { name: 'schema', type: 'object', required: true, description: 'Expected schema definition' }
          ]
        }]
      ])
    }
  ]
};
```

---

## 🎯 **Advanced Plugin Features**

### **Plugin Configuration**

```typescript
const ConfigurablePlugin: CustomUtilityPlugin = {
  name: 'configurable-plugin',
  version: '1.0.0',
  description: 'Plugin with configurable behavior',
  author: 'Config Team',
  
  config: {
    apiEndpoint: 'https://api.example.com',
    retryAttempts: 3,
    defaultTimeout: 5000,
    enableLogging: true
  },
  
  categories: [
    {
      name: 'configurable',
      description: 'Configurable utilities',
      functions: new Map([
        ['apiCall', {
          name: 'apiCall',
          description: 'Make API call with plugin configuration',
          category: 'configurable',
          isAsync: true,
          execute: async function(endpoint: string, data?: any) {
            // Access plugin config through this context
            const config = this.config;
            const url = `${config.apiEndpoint}${endpoint}`;
            
            for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
              try {
                if (config.enableLogging) {
                  console.log(`API call attempt ${attempt}: ${url}`);
                }
                
                const response = await fetch(url, {
                  method: data ? 'POST' : 'GET',
                  headers: { 'Content-Type': 'application/json' },
                  body: data ? JSON.stringify(data) : undefined,
                  signal: AbortSignal.timeout(config.defaultTimeout)
                });
                
                return await response.json();
              } catch (error) {
                if (attempt === config.retryAttempts) {
                  throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              }
            }
          },
          parameters: [
            { name: 'endpoint', type: 'string', required: true, description: 'API endpoint path' },
            { name: 'data', type: 'object', required: false, description: 'Data to send (POST)' }
          ]
        }]
      ])
    }
  ],
  
  initialize: function() {
    console.log(`Plugin initialized with endpoint: ${this.config.apiEndpoint}`);
  }
};
```

### **Plugin with Validation**

```typescript
const ValidatedPlugin: CustomUtilityPlugin = {
  name: 'validated-plugin',
  version: '1.0.0',
  description: 'Plugin with parameter validation',
  author: 'Validation Team',
  
  categories: [
    {
      name: 'validated',
      description: 'Utilities with parameter validation',
      functions: new Map([
        ['validateEmail', {
          name: 'validateEmail',
          description: 'Validate email with custom rules',
          category: 'validated',
          execute: (email: string, domain?: string) => {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            
            if (!emailRegex.test(email)) {
              return { valid: false, error: 'Invalid email format' };
            }
            
            if (domain && !email.endsWith(`@${domain}`)) {
              return { valid: false, error: `Email must be from domain: ${domain}` };
            }
            
            return { valid: true };
          },
          parameters: [
            { 
              name: 'email', 
              type: 'string', 
              required: true, 
              description: 'Email to validate',
              validation: (value: any) => typeof value === 'string' && value.length > 0
            },
            { 
              name: 'domain', 
              type: 'string', 
              required: false, 
              description: 'Required domain',
              validation: (value: any) => !value || (typeof value === 'string' && value.length > 0)
            }
          ]
        }]
      ])
    }
  ]
};
```

---

## 🧪 **Testing Your Plugin**

### **Plugin Test Suite**

```typescript
// test/plugin.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'mocha';
import { Restified } from 'restifiedts';
import BusinessPlugin from '../src/business-plugin';

describe('Business Plugin Tests', function() {
  let restified: Restified;
  
  beforeEach(function() {
    restified = new Restified();
    restified.registerUtilityPlugin(BusinessPlugin);
  });
  
  afterEach(async function() {
    await restified.cleanup();
  });

  describe('Finance Utilities', function() {
    it('should calculate tax correctly', function() {
      const result = restified.utility('finance.calculateTax', 100, 8.5);
      expect(result.success).to.be.true;
      expect(result.value).to.equal(8.5);
    });
    
    it('should calculate tax with jurisdiction', function() {
      const result = restified.utility('finance.calculateTax', 100, 10, 'EU');
      expect(result.success).to.be.true;
      expect(result.value).to.equal(12); // 100 * 0.10 * 1.2
    });
    
    it('should format currency correctly', function() {
      const result = restified.utility('finance.formatCurrency', 1234.56, 'USD', 'en-US');
      expect(result.success).to.be.true;
      expect(result.value).to.equal('$1,234.56');
    });
  });

  describe('Inventory Utilities', function() {
    it('should generate SKU with timestamp', function() {
      const result = restified.utility('inventory.generateSKU', 'electronics', 'laptop');
      expect(result.success).to.be.true;
      expect(result.value).to.match(/^PRD-ELECTRONICS-LAPTOP-\\d{6}$/);
    });
    
    it('should calculate reorder point', function() {
      const result = restified.utility('inventory.calculateReorderPoint', 10, 5, 20);
      expect(result.success).to.be.true;
      expect(result.value).to.equal(70); // (10 * 5) + 20
    });
  });

  describe('Plugin Integration', function() {
    it('should list plugin categories', function() {
      const categories = restified.listUtilityCategories();
      expect(categories).to.include('finance');
      expect(categories).to.include('inventory');
    });
    
    it('should list plugin functions', function() {
      const financeFunctions = restified.listUtilityFunctions('finance');
      expect(financeFunctions).to.include('calculateTax');
      expect(financeFunctions).to.include('formatCurrency');
    });
    
    it('should get function documentation', function() {
      const docs = restified.getUtilityDocumentation('finance', 'calculateTax');
      expect(docs.description).to.include('tax amount');
      expect(docs.parameters).to.have.length(3);
    });
  });

  describe('Async Plugin Tests', function() {
    it('should handle async utilities', async function() {
      this.timeout(10000);
      
      // Assuming we have an async utility
      if (restified.hasUtility('api.fetchData')) {
        const result = await restified.utilityAsync('api.fetchData', 'https://httpbin.org/json');
        expect(result.success).to.be.true;
        expect(result.value).to.be.an('object');
      }
    });
  });
});
```

### **Integration Testing**

```typescript
// test/integration.test.ts
describe('Plugin Integration Tests', function() {
  it('should work with variable resolution', function() {
    restified.setGlobalVariable('amount', 100);
    restified.setGlobalVariable('rate', 8.5);
    
    const template = {
      order: {
        subtotal: '{{amount}}',
        tax: '{{$util.finance.calculateTax({{amount}}, {{rate}})}}',
        total: '{{$util.math.sum([{{amount}}, {{$util.finance.calculateTax({{amount}}, {{rate}})}}])}}'
      }
    };
    
    const resolved = restified.resolveVariables(template);
    
    expect(resolved.order.subtotal).to.equal(100);
    expect(resolved.order.tax).to.equal(8.5);
    expect(resolved.order.total).to.equal(108.5);
  });
  
  it('should work in batch operations', function() {
    const operations = [
      { function: 'finance.calculateTax', args: [100, 8.5] },
      { function: 'inventory.generateSKU', args: ['books', 'fiction'] },
      { function: 'finance.formatCurrency', args: [108.5] }
    ];
    
    const results = restified.executeUtilityBatch(operations);
    
    expect(results).to.have.length(3);
    expect(results[0].value).to.equal(8.5);
    expect(results[1].value).to.match(/^PRD-BOOKS-FICTION-\\d{6}$/);
    expect(results[2].value).to.include('$108.50');
  });
});
```

---

## 📦 **Plugin Distribution**

### **Package Structure**

```
my-restified-plugin/
├── package.json
├── README.md
├── LICENSE
├── src/
│   ├── index.ts              # Main plugin export
│   ├── finance.ts            # Finance utilities
│   ├── inventory.ts          # Inventory utilities
│   └── types.ts              # TypeScript types
├── test/
│   ├── plugin.test.ts        # Plugin tests
│   └── integration.test.ts   # Integration tests
├── docs/
│   ├── api.md               # API documentation
│   └── examples.md          # Usage examples
└── dist/                    # Compiled output
```

### **Package.json Configuration**

```json
{
  "name": "restified-business-plugin",
  "version": "1.0.0",
  "description": "Business logic utilities for RestifiedTS",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["restified", "plugin", "business", "testing", "api"],
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/restified-business-plugin.git"
  },
  "peerDependencies": {
    "restifiedts": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "mocha": "^10.0.0",
    "chai": "^4.3.0",
    "@types/mocha": "^10.0.0",
    "@types/chai": "^4.3.0",
    "restifiedts": "^1.0.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "mocha test/**/*.test.ts --require ts-node/register",
    "lint": "eslint src/**/*.ts",
    "prepare": "npm run build"
  },
  "files": [
    "dist/**/*",
    "README.md",
    "LICENSE"
  ]
}
```

### **Plugin Index File**

```typescript
// src/index.ts
import { CustomUtilityPlugin } from 'restifiedts';
import { FinanceUtilities } from './finance';
import { InventoryUtilities } from './inventory';

const BusinessPlugin: CustomUtilityPlugin = {
  name: 'restified-business-plugin',
  version: '1.0.0',
  description: 'Business logic utilities for RestifiedTS',
  author: 'Your Company',
  license: 'MIT',
  homepage: 'https://github.com/yourorg/restified-business-plugin',
  
  categories: [
    FinanceUtilities,
    InventoryUtilities
  ],
  
  initialize: () => {
    console.log('Business Plugin v1.0.0 loaded');
  },
  
  cleanup: () => {
    console.log('Business Plugin cleaned up');
  }
};

export default BusinessPlugin;
export { BusinessPlugin };

// Re-export utility categories for advanced usage
export { FinanceUtilities, InventoryUtilities };
```

### **Usage Documentation**

```markdown
# Restified Business Plugin

Business logic utilities for RestifiedTS testing framework.

## Installation

\`\`\`bash
npm install restified-business-plugin
\`\`\`

## Usage

\`\`\`typescript
import { restified } from 'restifiedts';
import BusinessPlugin from 'restified-business-plugin';

// Register the plugin
restified.registerUtilityPlugin(BusinessPlugin);

// Use finance utilities
const tax = restified.utility('finance.calculateTax', 100, 8.5);
const formatted = restified.utility('finance.formatCurrency', 108.5);

// Use inventory utilities
const sku = restified.utility('inventory.generateSKU', 'electronics', 'laptop');
\`\`\`

## API Reference

### Finance Utilities

- \`calculateTax(amount, rate, jurisdiction?)\` - Calculate tax amount
- \`formatCurrency(amount, currency?, locale?)\` - Format currency
- \`calculateCompoundInterest(principal, rate, time, frequency?)\` - Calculate compound interest

### Inventory Utilities

- \`generateSKU(category, subcategory?, prefix?)\` - Generate product SKU
- \`calculateReorderPoint(dailyUsage, leadTimeDays, safetyStock?)\` - Calculate reorder point
```

---

## 🚀 **Publishing Your Plugin**

### **NPM Publishing**

```bash
# Build the plugin
npm run build

# Run tests
npm test

# Publish to NPM
npm publish

# Or publish with specific tag
npm publish --tag beta
```

### **Plugin Registry (Future)**

RestifiedTS will maintain a plugin registry for easy discovery:

```bash
# Future command to discover plugins
restifiedts plugin search business
restifiedts plugin install restified-business-plugin
restifiedts plugin list
```

---

## 🎯 **Best Practices**

### **1. Plugin Design Principles**

- **Single Responsibility**: Each plugin should focus on one domain
- **Composability**: Utilities should work well together
- **Documentation**: Provide comprehensive documentation and examples
- **Testing**: Include thorough test coverage
- **Versioning**: Use semantic versioning and maintain backward compatibility

### **2. Performance Considerations**

- **Lazy Loading**: Load heavy dependencies only when needed
- **Caching**: Cache expensive computations
- **Async Operations**: Use async/await for I/O operations
- **Memory Management**: Clean up resources in cleanup hook

### **3. Error Handling**

- **Graceful Failures**: Return meaningful error messages
- **Validation**: Validate parameters before execution
- **Logging**: Provide helpful debug information
- **Recovery**: Allow operations to continue after non-critical failures

### **4. Security**

- **Input Validation**: Validate all inputs
- **Sanitization**: Sanitize user-provided data
- **Secrets**: Never log or expose sensitive information
- **Dependencies**: Keep dependencies up to date

---

The plugin system provides unlimited extensibility for RestifiedTS while maintaining consistency and reliability. Use these patterns and examples to create powerful domain-specific utilities for your testing needs.