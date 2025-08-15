import { Restified } from '../Restified';
import { CustomUtilityPlugin } from './UtilityTypes';

// Example custom utility plugin
export const ExampleCustomPlugin: CustomUtilityPlugin = {
  name: 'example-plugin',
  version: '1.0.0',
  description: 'Example custom utility plugin for demonstration',
  author: 'Restified Team',
  categories: [
    {
      name: 'custom',
      description: 'Custom utility functions',
      functions: new Map([
        ['greet', {
          name: 'greet',
          description: 'Generates a greeting message',
          category: 'custom',
          execute: (name: string, timeOfDay: string = 'day') => {
            const greetings = {
              morning: 'Good morning',
              afternoon: 'Good afternoon',
              evening: 'Good evening',
              day: 'Hello'
            };
            return `${greetings[timeOfDay as keyof typeof greetings] || 'Hello'}, ${name}!`;
          },
          parameters: [
            { name: 'name', type: 'string', required: true, description: 'Name to greet' },
            { name: 'timeOfDay', type: 'string', required: false, defaultValue: 'day', description: 'Time of day (morning, afternoon, evening)' }
          ]
        }],
        ['fibonacci', {
          name: 'fibonacci',
          description: 'Calculates fibonacci number at given position',
          category: 'custom',
          execute: (n: number): number => {
            if (n <= 1) return n;
            let a = 0, b = 1;
            for (let i = 2; i <= n; i++) {
              [a, b] = [b, a + b];
            }
            return b;
          },
          parameters: [
            { name: 'n', type: 'number', required: true, description: 'Position in fibonacci sequence' }
          ]
        }],
        ['formatCurrency', {
          name: 'formatCurrency',
          description: 'Formats number as currency',
          category: 'custom',
          execute: (amount: number, currency: string = 'USD', locale: string = 'en-US') => {
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
        }]
      ])
    }
  ],
  initialize: () => {
    console.log('Example plugin initialized');
  },
  cleanup: () => {
    console.log('Example plugin cleaned up');
  }
};

// Comprehensive usage examples
export class UtilityUsageExamples {
  private restified: Restified;

  constructor(restified: Restified) {
    this.restified = restified;
  }

  // String utility examples
  demonstrateStringUtilities(): void {
    console.log('=== String Utilities Examples ===');
    
    // Basic string operations
    console.log('toUpperCase:', this.restified.stringUtil('toUpperCase', 'hello world').value);
    console.log('camelCase:', this.restified.stringUtil('camelCase', 'hello world example').value);
    console.log('kebabCase:', this.restified.stringUtil('kebabCase', 'HelloWorldExample').value);
    console.log('padStart:', this.restified.stringUtil('padStart', '42', 5, '0').value);
    
    // String manipulation pipeline
    const pipeline = this.restified.executeUtilityPipeline('  hello world  ', [
      { function: 'string.trim' },
      { function: 'string.toUpperCase' },
      { function: 'string.replace', args: ['WORLD', 'UNIVERSE'] }
    ]);
    console.log('Pipeline result:', pipeline.value);
  }

  // Date utility examples
  demonstrateDateUtilities(): void {
    console.log('\\n=== Date Utilities Examples ===');
    
    const baseDate = '2024-06-15T10:30:00Z';
    
    // Basic date info with different formats
    console.log('Current timestamp:', this.restified.dateUtil('timestamp').value);
    console.log('Today (default):', this.restified.dateUtil('today').value);
    console.log('Today (custom):', this.restified.dateUtil('today', 'DD/MM/YYYY').value);
    console.log('Now (ISO):', this.restified.dateUtil('now').value);
    console.log('Now (timestamp):', this.restified.dateUtil('now', 'timestamp').value);
    
    // Flexible formatting examples
    console.log('\\nFlexible Formatting:');
    console.log('ISO format:', this.restified.dateUtil('format', baseDate, 'ISO').value);
    console.log('Date only:', this.restified.dateUtil('format', baseDate, 'date-only').value);
    console.log('Custom format:', this.restified.dateUtil('format', baseDate, 'DD/MM/YYYY HH:mm').value);
    console.log('Timestamp:', this.restified.dateUtil('format', baseDate, 'timestamp').value);
    
    // Add/subtract operations with custom formats
    console.log('\\nAdd/Subtract with Custom Formats:');
    console.log('Add 30 min (ISO):', this.restified.dateUtil('addMinutes', baseDate, 30).value);
    console.log('Add 5 hours (time):', this.restified.dateUtil('addHours', baseDate, 5, 'HH:mm:ss').value);
    console.log('Add 7 days (date):', this.restified.dateUtil('addDays', baseDate, 7, 'YYYY-MM-DD').value);
    console.log('Add 2 weeks (custom):', this.restified.dateUtil('addWeeks', baseDate, 2, 'DD/MM/YYYY').value);
    console.log('Add 3 months (timestamp):', this.restified.dateUtil('addMonths', baseDate, 3, 'timestamp').value);
    console.log('Add 1 year (unix):', this.restified.dateUtil('addYears', baseDate, 1, 'unix').value);
    
    console.log('\\nSubtract with formats:');
    console.log('Subtract 2 hours (ISO):', this.restified.dateUtil('subtractHours', baseDate, 2).value);
    console.log('Subtract 10 days (date):', this.restified.dateUtil('subtractDays', baseDate, 10, 'YYYY-MM-DD').value);
    console.log('Subtract 1 month (custom):', this.restified.dateUtil('subtractMonths', baseDate, 1, 'MM/YYYY').value);
    
    // Period boundaries with formats
    console.log('\\nPeriod Boundaries with Formats:');
    console.log('Start of day (ISO):', this.restified.dateUtil('startOfDay', baseDate).value);
    console.log('Start of day (date):', this.restified.dateUtil('startOfDay', baseDate, 'YYYY-MM-DD').value);
    console.log('End of day (timestamp):', this.restified.dateUtil('endOfDay', baseDate, 'timestamp').value);
    console.log('Start of week (custom):', this.restified.dateUtil('startOfWeek', baseDate, 'DD/MM/YYYY').value);
    console.log('End of month (date):', this.restified.dateUtil('endOfMonth', baseDate, 'YYYY-MM-DD').value);
    console.log('Start of year (year only):', this.restified.dateUtil('startOfYear', baseDate, 'YYYY').value);
    
    // Date information
    console.log('\\nDate Information:');
    console.log('Day of week:', this.restified.dateUtil('getDayOfWeek', baseDate).value);
    console.log('Day name:', this.restified.dateUtil('getDayOfWeekName', baseDate).value);
    console.log('Month name:', this.restified.dateUtil('getMonthName', baseDate).value);
    console.log('Week number:', this.restified.dateUtil('getWeekNumber', baseDate).value);
    console.log('Days in month:', this.restified.dateUtil('getDaysInMonth', baseDate).value);
    
    // Date checks
    console.log('\\nDate Checks:');
    console.log('Is weekend:', this.restified.dateUtil('isWeekend', baseDate).value);
    console.log('Is weekday:', this.restified.dateUtil('isWeekday', baseDate).value);
    console.log('Is leap year (2024):', this.restified.dateUtil('isLeapYear', 2024).value);
    console.log('Age calculation:', this.restified.dateUtil('getAge', '1990-01-01', baseDate).value, 'years');
    
    // Days between calculation
    console.log('Days between dates:', this.restified.dateUtil('daysBetween', '2024-01-01', baseDate).value);
    
    // Real-world API scenarios
    console.log('\\nReal-world API scenarios:');
    console.log('Date range start:', this.restified.dateUtil('subtractDays', baseDate, 30, 'YYYY-MM-DD').value);
    console.log('Date range end:', this.restified.dateUtil('addDays', baseDate, 30, 'YYYY-MM-DD').value);
    console.log('Unique timestamp ID:', this.restified.dateUtil('now', 'timestamp').value);
    console.log('Report date:', this.restified.dateUtil('now', 'DD/MM/YYYY HH:mm').value);
  }

  // Mathematical utility examples
  demonstrateMathUtilities(): void {
    console.log('\\n=== Math Utilities Examples ===');
    
    const numbers = [1, 2, 3, 4, 5];
    console.log('Sum:', this.restified.mathUtil('sum', numbers).value);
    console.log('Average:', this.restified.mathUtil('average', numbers).value);
    console.log('Random int (1-100):', this.restified.mathUtil('randomInt', 1, 100).value);
    console.log('Round to 2 decimals:', this.restified.mathUtil('round', 3.14159, 2).value);
  }

  // Random generation examples
  demonstrateRandomUtilities(): void {
    console.log('\\n=== Random Utilities Examples ===');
    
    console.log('UUID:', this.restified.randomUtil('uuid').value);
    console.log('Random string:', this.restified.randomUtil('string', 10).value);
    console.log('Random email:', this.restified.randomUtil('email', 'testdomain.com').value);
    console.log('Random phone:', this.restified.randomUtil('phoneNumber', '+1-XXX-XXX-XXXX').value);
  }

  // Validation utility examples
  demonstrateValidationUtilities(): void {
    console.log('\\n=== Validation Utilities Examples ===');
    
    console.log('Valid email:', this.restified.validationUtil('isEmail', 'test@example.com').value);
    console.log('Valid UUID:', this.restified.validationUtil('isUUID', '123e4567-e89b-12d3-a456-426614174000').value);
    console.log('Is numeric:', this.restified.validationUtil('isNumeric', '123.45').value);
    console.log('Length check:', this.restified.validationUtil('isLength', 'password', 8, 20).value);
  }

  // Data transformation examples
  demonstrateDataUtilities(): void {
    console.log('\\n=== Data Utilities Examples ===');
    
    const data = { user: { name: 'John', age: 30 }, active: true };
    
    console.log('JSON stringify:', this.restified.dataUtil('jsonStringify', data, true).value);
    console.log('Object path:', this.restified.dataUtil('objectPath', data, 'user.name').value);
    console.log('Deep clone:', this.restified.dataUtil('deepClone', data).value);
    
    // CSV example
    const csvData = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'Los Angeles' }
    ];
    console.log('CSV stringify:', this.restified.dataUtil('csvStringify', csvData).value);
  }

  // Cryptographic utility examples
  demonstrateCryptoUtilities(): void {
    console.log('\\n=== Crypto Utilities Examples ===');
    
    const data = 'Hello, World!';
    console.log('SHA256:', this.restified.cryptoUtil('sha256', data).value);
    console.log('MD5:', this.restified.cryptoUtil('md5', data).value);
    console.log('HMAC-SHA256:', this.restified.cryptoUtil('hmacSha256', data, 'secret-key').value);
    
    // Password hashing
    const password = 'mySecurePassword';
    const hashed = this.restified.cryptoUtil('pbkdf2', password).value;
    console.log('PBKDF2 hash:', hashed);
    
    // Verify password
    const verified = this.restified.cryptoUtil('verifyPbkdf2', password, hashed.hash, hashed.salt, hashed.iterations).value;
    console.log('Password verified:', verified);
  }

  // Security utility examples
  demonstrateSecurityUtilities(): void {
    console.log('\\n=== Security Utilities Examples ===');
    
    console.log('Generate API key:', this.restified.securityUtil('generateApiKey', 16, 'api').value);
    console.log('Secure password:', this.restified.securityUtil('generateSecurePassword', 12).value);
    console.log('Mask data:', this.restified.securityUtil('maskSensitiveData', 'credit-card-1234567890').value);
    console.log('Sanitize input:', this.restified.securityUtil('sanitizeInput', '<script>alert("xss")</script>').value);
  }

  // File utility examples (async)
  async demonstrateFileUtilities(): Promise<void> {
    console.log('\\n=== File Utilities Examples ===');
    
    try {
      // Write a test file
      const writeResult = await this.restified.fileUtil('writeFile', './test-output.txt', 'Hello from Restified utilities!');
      console.log('File written:', writeResult.value);
      
      // Read the file back
      const readResult = await this.restified.fileUtil('readFile', './test-output.txt');
      console.log('File content:', readResult.value);
      
      // Get file stats
      const statsResult = await this.restified.fileUtil('getFileStats', './test-output.txt');
      console.log('File stats:', statsResult.value);
      
      // Clean up
      await this.restified.fileUtil('deleteFile', './test-output.txt');
      console.log('File deleted');
    } catch (error) {
      console.log('File operations completed with demonstration');
    }
  }

  // Encoding utility examples
  demonstrateEncodingUtilities(): void {
    console.log('\\n=== Encoding Utilities Examples ===');
    
    const text = 'Hello, World! 🌍';
    console.log('Original:', text);
    
    const base64 = this.restified.encodingUtil('base64Encode', text).value;
    console.log('Base64 encoded:', base64);
    console.log('Base64 decoded:', this.restified.encodingUtil('base64Decode', base64).value);
    
    const urlEncoded = this.restified.encodingUtil('urlEncode', 'hello world & special chars!').value;
    console.log('URL encoded:', urlEncoded);
    console.log('URL decoded:', this.restified.encodingUtil('urlDecode', urlEncoded).value);
    
    const hex = this.restified.encodingUtil('hexEncode', text).value;
    console.log('Hex encoded:', hex);
    console.log('Hex decoded:', this.restified.encodingUtil('hexDecode', hex).value);
  }

  // Network utility examples
  demonstrateNetworkUtilities(): void {
    console.log('\\n=== Network Utilities Examples ===');
    
    const url = 'https://api.example.com/users?page=1&limit=10';
    console.log('Parse URL:', this.restified.networkUtil('parseUrl', url).value);
    console.log('Extract domain:', this.restified.networkUtil('extractDomain', url).value);
    
    const buildUrl = this.restified.networkUtil('buildUrl', 'https://api.example.com/search', {
      q: 'restified',
      limit: 20,
      sort: 'name'
    }).value;
    console.log('Build URL:', buildUrl);
    
    console.log('Valid IPv4:', this.restified.networkUtil('isValidIP', '192.168.1.1', 4).value);
    console.log('Valid IPv6:', this.restified.networkUtil('isValidIP', '::1', 6).value);
  }

  // Custom plugin demonstration
  demonstrateCustomPlugin(): void {
    console.log('\\n=== Custom Plugin Examples ===');
    
    // Register the custom plugin
    this.restified.registerUtilityPlugin(ExampleCustomPlugin);
    
    console.log('Greeting:', this.restified.utility('custom.greet', 'Alice', 'morning').value);
    console.log('Fibonacci(10):', this.restified.utility('custom.fibonacci', 10).value);
    console.log('Format currency:', this.restified.utility('custom.formatCurrency', 1234.56, 'EUR', 'de-DE').value);
  }

  // Batch execution example
  demonstrateBatchExecution(): void {
    console.log('\\n=== Batch Execution Examples ===');
    
    const operations = [
      { function: 'string.toUpperCase', args: ['hello'] },
      { function: 'math.randomInt', args: [1, 10] },
      { function: 'date.timestamp', args: [] },
      { function: 'random.uuid', args: [] }
    ];
    
    const results = this.restified.executeUtilityBatch(operations);
    console.log('Batch results:', results.map(r => r.value));
  }

  // Pipeline execution example
  demonstratePipelineExecution(): void {
    console.log('\\n=== Pipeline Execution Examples ===');
    
    // Text processing pipeline
    const textPipeline = this.restified.executeUtilityPipeline('  Hello, World!  ', [
      { function: 'string.trim' },
      { function: 'string.toLowerCase' },
      { function: 'string.replace', args: ['world', 'universe'] },
      { function: 'string.toUpperCase' }
    ]);
    console.log('Text pipeline result:', textPipeline.value);
    
    // Number processing pipeline
    const numberPipeline = this.restified.executeUtilityPipeline(3.14159, [
      { function: 'math.round', args: [2] }
    ]);
    console.log('Number pipeline result:', numberPipeline.value);
  }

  // Conditional execution example
  demonstrateConditionalExecution(): void {
    console.log('\\n=== Conditional Execution Examples ===');
    
    const shouldExecute = true;
    const result = this.restified.executeUtilityIf(shouldExecute, 'string.toUpperCase', 'conditional execution');
    console.log('Conditional result:', result?.value);
    
    const safeResult = this.restified.executeUtilitySafe('invalid.function', 'fallback value', 'arg1');
    console.log('Safe execution result:', safeResult);
  }

  // Variable integration example
  demonstrateVariableIntegration(): void {
    console.log('\\n=== Variable Integration Examples ===');
    
    // Set variables
    this.restified.setGlobalVariable('userName', 'Alice');
    this.restified.setLocalVariable('timeOfDay', 'morning');
    
    // Use utility functions with variable resolution in templates
    const template = 'User: {{userName}}, Time: {{timeOfDay}}, UUID: {{$util.uuid}}';
    const resolved = this.restified.resolveVariables(template);
    console.log('Resolved template:', resolved);
  }

  // Performance monitoring example
  demonstratePerformanceMonitoring(): void {
    console.log('\\n=== Performance Monitoring Examples ===');
    
    // Execute some operations
    for (let i = 0; i < 5; i++) {
      this.restified.stringUtil('toUpperCase', `test ${i}`);
      this.restified.mathUtil('randomInt', 1, 100);
    }
    
    const metrics = this.restified.getUtilityPerformanceMetrics();
    console.log('Performance metrics:', {
      totalExecutions: metrics.totalExecutions,
      functionCounts: metrics.functionCounts,
      avgTimes: Object.keys(metrics.averageExecutionTimes).slice(0, 3) // Show first 3
    });
    
    const health = this.restified.utilityHealthCheck();
    console.log('Health status:', health.status);
  }

  // Complete demonstration
  async runAllExamples(): Promise<void> {
    console.log('🚀 Restified Utility System Comprehensive Examples');
    console.log('================================================\\n');
    
    this.demonstrateStringUtilities();
    this.demonstrateDateUtilities();
    this.demonstrateMathUtilities();
    this.demonstrateRandomUtilities();
    this.demonstrateValidationUtilities();
    this.demonstrateDataUtilities();
    this.demonstrateCryptoUtilities();
    this.demonstrateSecurityUtilities();
    await this.demonstrateFileUtilities();
    this.demonstrateEncodingUtilities();
    this.demonstrateNetworkUtilities();
    this.demonstrateCustomPlugin();
    this.demonstrateBatchExecution();
    this.demonstratePipelineExecution();
    this.demonstrateConditionalExecution();
    this.demonstrateVariableIntegration();
    this.demonstratePerformanceMonitoring();
    
    console.log('\\n✅ All utility examples completed successfully!');
    
    // Show available categories and functions
    console.log('\\n📋 Available Utility Categories:');
    const categories = this.restified.listUtilityCategories();
    categories.forEach(category => {
      const functions = this.restified.listUtilityFunctions(category) as string[];
      console.log(`  ${category}: ${functions.length} functions`);
    });
    
    // Export configuration for reference
    const config = this.restified.exportUtilityConfiguration();
    console.log(`\\n📊 Total utility functions available: ${Object.values(config.functions).flat().length}`);
  }
}

// Quick start example
export function quickStartExample(): void {
  const restified = new Restified();
  
  console.log('=== Quick Start Example ===');
  
  // String manipulation
  console.log('1. String manipulation:');
  console.log('   toUpperCase:', restified.stringUtil('toUpperCase', 'hello').value);
  
  // Generate random data
  console.log('2. Random generation:');
  console.log('   UUID:', restified.randomUtil('uuid').value);
  
  // Data validation
  console.log('3. Validation:');
  console.log('   Email valid:', restified.validationUtil('isEmail', 'test@example.com').value);
  
  // Cryptographic operations
  console.log('4. Cryptography:');
  console.log('   SHA256:', restified.cryptoUtil('sha256', 'Hello World').value);
  
  // Date operations
  console.log('5. Date utilities:');
  console.log('   Current timestamp:', restified.dateUtil('timestamp').value);
  
  console.log('\\n✨ Restified utilities are ready to use!');
}