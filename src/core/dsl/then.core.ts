const jp = require('jsonpath');
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { HttpResponse, AssertionResult } from '../../RestifiedTypes';

// Import mochawesome addContext utility for proper context capture
let addContext: any = null;
try {
  addContext = require('mochawesome/addContext');
} catch (error) {
  // mochawesome not available, context capture will be disabled
}

export class ThenStep {
  private assertions: AssertionResult[] = [];
  private ajv: Ajv;

  constructor(
    private context: any,
    private response: HttpResponse
  ) {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  /**
   * Validates the HTTP response status code
   * @param {number} expectedStatus - Expected HTTP status code (200, 201, 404, etc.)
   * @returns {this} ThenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .baseURL('https://api.example.com')
   * .when()
   *   .get('/users')
   *   .execute()
   * .then(response => response
   *   .statusCode(200)           // Success
   *   .statusCode(201)           // Created
   *   .statusCode(404)           // Not Found
   *   .execute()
   * );
   * ```
   */
  statusCode(expectedStatus: number): this {
    const assertion: AssertionResult = {
      passed: this.response.status === expectedStatus,
      message: `Expected status code ${expectedStatus}, got ${this.response.status}`,
      actual: this.response.status,
      expected: expectedStatus
    };
    
    this.assertions.push(assertion);
    return this;
  }

  /**
   * Validates the HTTP response status code is one of the provided values
   * @param {number[]} statusCodes - Array of acceptable HTTP status codes
   * @returns {this} ThenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .baseURL('https://api.example.com')
   * .when()
   *   .get('/users')
   *   .execute()
   * .then(response => response
   *   .statusCodeIn([200, 201, 202])  // Accept any of these success codes
   *   .statusCodeIn([400, 422])       // Accept validation error codes
   *   .execute()
   * );
   * ```
   */
  statusCodeIn(statusCodes: number[]): this {
    const assertion: AssertionResult = {
      passed: statusCodes.includes(this.response.status),
      message: `Expected status code to be one of [${statusCodes.join(', ')}], got ${this.response.status}`,
      actual: this.response.status,
      expected: statusCodes
    };
    
    this.assertions.push(assertion);
    return this;
  }

  header(name: string, expectedValue?: string): this {
    const actualValue = this.response.headers[name] || this.response.headers[name.toLowerCase()];
    
    if (expectedValue === undefined) {
      const assertion: AssertionResult = {
        passed: actualValue !== undefined,
        message: `Expected header '${name}' to be present`,
        actual: actualValue,
        expected: 'present'
      };
      this.assertions.push(assertion);
    } else {
      const assertion: AssertionResult = {
        passed: actualValue === expectedValue,
        message: `Expected header '${name}' to be '${expectedValue}', got '${actualValue}'`,
        actual: actualValue,
        expected: expectedValue
      };
      this.assertions.push(assertion);
    }
    
    return this;
  }

  contentType(expectedType: string): this {
    return this.header('Content-Type', expectedType);
  }

  body(expectedBody: any): this {
    const assertion: AssertionResult = {
      passed: JSON.stringify(this.response.data) === JSON.stringify(expectedBody),
      message: `Response body does not match expected`,
      actual: this.response.data,
      expected: expectedBody
    };
    
    this.assertions.push(assertion);
    return this;
  }

  /**
   * Validates JSON response data using JSONPath expressions
   * @param {string} path - JSONPath expression (e.g., '$.data[0].id', '$.users[*].name')
   * @param {any} [expectedValue] - Expected value at the JSONPath (if omitted, just checks existence)
   * @returns {this} ThenStep instance for method chaining
   * @example
   * ```typescript
   * restified.given()
   *   .baseURL('https://api.example.com')
   * .when()
   *   .get('/users/123')
   *   .execute()
   * .then(response => response
   *   .jsonPath('$.id', 123)                    // Check specific value
   *   .jsonPath('$.name')                       // Check field exists
   *   .jsonPath('$.email', 'user@example.com')  // Check email value
   *   .jsonPath('$.users[*].id')                // Check all users have id
   *   .jsonPath('$.data.length', 10)            // Check array length
   *   .execute()
   * );
   * ```
   */
  jsonPath(path: string, expectedValue?: any): this {
    try {
      const actualValues = jp.query(this.response.data, path);
      
      if (expectedValue === undefined) {
        const assertion: AssertionResult = {
          passed: actualValues.length > 0,
          message: `JSONPath '${path}' should match at least one element`,
          actual: actualValues.length,
          expected: '>0'
        };
        this.assertions.push(assertion);
      } else {
        const actualValue = actualValues[0];
        const assertion: AssertionResult = {
          passed: actualValue === expectedValue,
          message: `JSONPath '${path}' expected '${expectedValue}', got '${actualValue}'`,
          actual: actualValue,
          expected: expectedValue
        };
        this.assertions.push(assertion);
      }
    } catch (error) {
      const assertion: AssertionResult = {
        passed: false,
        message: `JSONPath '${path}' evaluation failed: ${error}`,
        actual: error,
        expected: 'valid JSONPath'
      };
      this.assertions.push(assertion);
    }
    
    return this;
  }

  jsonSchema(schema: object): this {
    try {
      const validate = this.ajv.compile(schema);
      const isValid = validate(this.response.data);
      
      const assertion: AssertionResult = {
        passed: isValid,
        message: isValid ? 'Response matches JSON schema' : `Schema validation failed: ${this.ajv.errorsText(validate.errors)}`,
        actual: this.response.data,
        expected: 'valid against schema'
      };
      
      this.assertions.push(assertion);
    } catch (error) {
      const assertion: AssertionResult = {
        passed: false,
        message: `Schema validation error: ${error}`,
        actual: error,
        expected: 'valid schema'
      };
      this.assertions.push(assertion);
    }
    
    return this;
  }

  responseTime(maxMs: number): this {
    const assertion: AssertionResult = {
      passed: this.response.responseTime <= maxMs,
      message: `Expected response time to be <= ${maxMs}ms, got ${this.response.responseTime}ms`,
      actual: this.response.responseTime,
      expected: `<= ${maxMs}ms`
    };
    
    this.assertions.push(assertion);
    return this;
  }

  extract(path: string, variableName: string): this {
    try {
      const values = jp.query(this.response.data, path);
      if (values.length > 0) {
        this.context.setVariable(variableName, values[0]);
      }
    } catch (error) {
      console.warn(`Failed to extract value from path '${path}': ${error}`);
    }
    
    return this;
  }

  extractHeader(headerName: string, variableName: string): this {
    const headerValue = this.response.headers[headerName] || this.response.headers[headerName.toLowerCase()];
    if (headerValue) {
      this.context.setVariable(variableName, headerValue);
    }
    
    return this;
  }

  custom(assertionFn: (response: HttpResponse) => boolean, message?: string): this {
    try {
      const passed = assertionFn(this.response);
      const assertion: AssertionResult = {
        passed,
        message: message || (passed ? 'Custom assertion passed' : 'Custom assertion failed'),
        actual: this.response,
        expected: 'custom condition'
      };
      this.assertions.push(assertion);
    } catch (error) {
      const assertion: AssertionResult = {
        passed: false,
        message: `Custom assertion error: ${error}`,
        actual: error,
        expected: 'no error'
      };
      this.assertions.push(assertion);
    }
    
    return this;
  }

  async execute(): Promise<void> {
    if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
      console.log('🎯 ThenStep.execute() called - starting data capture...');
    }
    
    this.context.setAssertions(this.assertions);
    
    // 🎯 CRITICAL: Always add data to RestifiedTS HTML reporter context FIRST
    await this.addToRestifiedReporterContext();
    
    // 📊 Add request/response data to Mochawesome context for enterprise reporting
    await this.addToMochawesomeContext();
    
    // 🎯 Add data to custom reporter context
    await this.addToCustomReporterContext();
    
    const failedAssertions = this.assertions.filter(a => !a.passed);
    if (failedAssertions.length > 0) {
      const errorMessages = failedAssertions.map(a => a.message).join('\n');
      throw new Error(`Assertions failed:\n${errorMessages}`);
    }
  }

  private async addToRestifiedReporterContext(): Promise<void> {
    try {
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('🎯 ThenStep: addToRestifiedReporterContext() called');
      }
      
      // Get current Mocha test context
      const currentTest = this.getCurrentMochaTest();
      if (!currentTest) {
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
          console.log('❌ ThenStep: No current test context found for RestifiedTS reporter');
        }
        return;
      }
      
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('✅ ThenStep: Found test context:', currentTest.title || 'unknown');
      }

      const requestDetails = this.context.getRequestDetails();
      
      // 🚀 IMMEDIATE DATA ATTACHMENT - Critical for RestifiedTS HTML reporter
      // This ensures data is available synchronously when test completes
      const requestData = {
        method: requestDetails.method,
        url: this.buildFullUrl(requestDetails),
        headers: this.response.config?.headers || this.context.getRequestHeaders?.() || {},
        body: requestDetails.body,
        timestamp: new Date().toISOString()
      };

      const responseData = {
        status: this.response.status,
        statusText: this.response.statusText,
        headers: this.response.headers,
        body: this.response.data,
        responseTime: this.response.responseTime,
        timestamp: new Date().toISOString()
      };

      const assertionData = this.assertions.map(a => ({
        passed: a.passed,
        message: a.message,
        expected: a.expected,
        actual: a.actual
      }));

      // 🎯 DIRECT ATTACHMENT to test object - ensures immediate availability
      currentTest.restifiedData = {
        request: requestData,
        response: responseData,
        assertions: assertionData,
        framework: {
          name: 'Restified',
          version: '2.0.0',
          captureTime: Date.now()
        }
      };

      // 🔄 ALSO store globally as backup with immediate flush
      (global as any).__RESTIFIED_TEST_DATA__ = {
        testId: currentTest.title || 'unknown',
        data: currentTest.restifiedData,
        timestamp: Date.now()
      };
      
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('🎯 ThenStep: Data attached successfully!');
        console.log('📊 Request method:', requestData.method);
        console.log('📊 Request URL:', requestData.url);
        console.log('📊 Request headers:', JSON.stringify(requestData.headers, null, 2));
        console.log('📊 Request body:', JSON.stringify(requestData.body, null, 2));
        console.log('📊 Response status:', responseData.status);
        console.log('📊 Response headers:', JSON.stringify(responseData.headers, null, 2));
        console.log('📊 Response body:', JSON.stringify(responseData.body, null, 2));
        console.log('📊 Assertions count:', assertionData.length);
      }

      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('🎯 ThenStep: Successfully attached data to RestifiedTS reporter context');
        console.log('📊 Request data:', JSON.stringify(requestData, null, 2));
        console.log('📊 Response status:', responseData.status);
        console.log('📊 Assertions:', assertionData.length);
      }
      
    } catch (error) {
      // Don't fail the test if context addition fails
      console.warn('⚠️ Could not add test data to RestifiedTS reporter context:', error.message);
    }
  }

  private async addToMochawesomeContext(): Promise<void> {
    try {
      // Skip if using RestifiedTS HTML reporter (to avoid conflicts)
      if (process.env.MOCHA_REPORTER === './dist/reporting/restified-html-reporter.js' || 
          process.argv.some(arg => arg.includes('restified-html-reporter'))) {
        return;
      }
      
      // Skip if mochawesome addContext is not available
      if (!addContext) return;

      // Get current Mocha test context
      const currentTest = this.getCurrentMochaTest();
      if (!currentTest) return;

      const requestDetails = this.context.getRequestDetails();
      
      // 🚀 Create comprehensive request/response data for enterprise reporting
      const testData = {
        title: '📊 Restified Request/Response Details',
        value: {
          request: {
            method: requestDetails.method,
            url: this.buildFullUrl(requestDetails),
            headers: this.context.getRequestHeaders?.() || {},
            body: requestDetails.body,
            timestamp: new Date().toISOString()
          },
          response: {
            status: this.response.status,
            statusText: this.response.statusText,
            headers: this.response.headers,
            body: this.response.data,
            responseTime: `${this.response.responseTime}ms`,
            timestamp: new Date().toISOString()
          },
          assertions: this.assertions.map(a => ({
            type: a.message.includes('status') ? 'statusCode' : 
                 a.message.includes('JSONPath') ? 'jsonPath' :
                 a.message.includes('header') ? 'header' : 'custom',
            passed: a.passed,
            message: a.message,
            expected: a.expected,
            actual: a.actual
          })),
          framework: {
            name: 'Restified',
            version: '1.0.0',
            nodeVersion: process.version,
            platform: process.platform,
            testSuite: this.context.getGlobalVariable?.('testSuite') || 'API Tests'
          }
        }
      };

      // Use mochawesome/addContext for proper context capture
      addContext(currentTest, testData);
      
      // Store data for RestifiedHtmlReporter
      if (currentTest) {
        currentTest.responseData = testData.value;
        // Also store globally for the HTML reporter to access
        (global as any).__RESTIFIED_TEST_RESPONSE_DATA__ = testData.value;
      }
      
      // Add assertions summary if there are any
      if (this.assertions.length > 0) {
        const passedAssertions = this.assertions.filter(a => a.passed).length;
        const failedAssertions = this.assertions.filter(a => !a.passed).length;
        
        const assertionSummary = {
          title: '✅ Assertion Summary',
          value: {
            total: this.assertions.length,
            passed: passedAssertions,
            failed: failedAssertions,
            details: failedAssertions > 0 ? 
              this.assertions.filter(a => !a.passed).map(a => a.message) : 
              ['All assertions passed']
          }
        };
        
        addContext(currentTest, assertionSummary);
      }
    } catch (error) {
      // Don't fail the test if context addition fails
      console.warn('⚠️ Could not add test data to Mochawesome context:', error.message);
    }
  }

  private getCurrentMochaTest(): any {
    // Access current Mocha test context using multiple strategies
    try {
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('🔍 ThenStep: Attempting to find current Mocha test context...');
      }
      
      // Method 1: Use global context if set by reporter
      if ((global as any).__RESTIFIED_CURRENT_TEST_CONTEXT__) {
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
          console.log('✅ Found test context via global __RESTIFIED_CURRENT_TEST_CONTEXT__');
        }
        return (global as any).__RESTIFIED_CURRENT_TEST_CONTEXT__;
      }
      
      // Method 2: Try to access Mocha's current runnable
      if (typeof global !== 'undefined' && (global as any).test) {
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
          console.log('✅ Found test context via global.test');
        }
        return (global as any).test;
      }
      
      // Method 3: Try accessing through process domain (Node.js specific)
      try {
        const processDomain = (process as any).domain;
        if (processDomain && processDomain.members) {
          const mochaTest = processDomain.members.find((member: any) => 
            member && typeof member === 'object' && member.title && member.fullTitle
          );
          if (mochaTest) {
            if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
              console.log('✅ Found test context via process domain');
            }
            return mochaTest;
          }
        }
      } catch (domainError) {
        // Process domain not available
      }
      
      // Method 4: Try Mocha internals (last resort)
      try {
        const Mocha = require('mocha');
        const Runner = Mocha.Runner;
        
        // Check if we can access the current runner instance
        if (Runner && Runner._currentRunner && Runner._currentRunner.currentRunnable) {
          if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
            console.log('✅ Found test context via Mocha Runner internals');
          }
          return Runner._currentRunner.currentRunnable;
        }
      } catch (mochaError) {
        // Mocha internals not available
      }
      
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('❌ Could not find current test context - trying fallback approach');
      }
      
      // 🆕 FALLBACK: Try to create a minimal test context for data capture
      // This ensures data is still captured even if test context is not found
      const fallbackContext = this.createFallbackTestContext();
      if (fallbackContext) {
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
          console.log('✅ Created fallback test context for data capture');
        }
        return fallbackContext;
      }
      
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('❌ All methods failed - data capture may be limited');
      }
      
      return null;
    } catch (error) {
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('❌ Error accessing test context:', error.message);
      }
      return null;
    }
  }
  
  /**
   * Creates a fallback test context when the standard Mocha context cannot be found.
   * This ensures data capture still works even in complex configuration scenarios.
   */
  private createFallbackTestContext(): any {
    try {
      // Create a minimal test context that the reporter can use
      const fallbackContext = {
        title: 'RestifiedTS Test',
        fullTitle: () => 'RestifiedTS API Test',
        state: 'passed',
        duration: 0,
        _isFallbackContext: true,
        restifiedData: null,
        requestData: null,
        responseData: null,
        assertions: null
      };
      
      // Store this context globally so the reporter can find it
      (global as any).__RESTIFIED_FALLBACK_TEST_CONTEXT__ = fallbackContext;
      
      return fallbackContext;
    } catch (error) {
      console.log('❌ Failed to create fallback test context:', error);
      return null;
    }
  }

  private async addToCustomReporterContext(): Promise<void> {
    try {
      // Get current Mocha test context for custom reporter
      const currentTest = this.getCurrentMochaTest();
      if (!currentTest) return;

      const requestDetails = this.context.getRequestDetails();
      
      // Add request/response data directly to test context
      // Get actual headers from response config if available, otherwise try context
      const requestHeaders = this.response.config?.headers || this.context.getRequestHeaders?.() || {};
      
      currentTest.requestData = {
        method: requestDetails.method,
        url: this.buildFullUrl(requestDetails),
        headers: requestHeaders,
        body: requestDetails.body,
        timestamp: new Date().toISOString()
      };

      currentTest.responseData = {
        status: this.response.status,
        statusText: this.response.statusText,
        headers: this.response.headers,
        body: this.response.data,
        responseTime: this.response.responseTime,
        timestamp: new Date().toISOString()
      };

      currentTest.assertions = this.assertions.map(a => ({
        passed: a.passed,
        message: a.message,
        expected: a.expected,
        actual: a.actual
      }));

    } catch (error) {
      // Don't fail the test if context addition fails
      console.warn('⚠️ Could not add test data to custom reporter context:', error.message);
    }
  }

  private buildFullUrl(requestDetails: any): string {
    const baseURL = this.context.getBaseURL?.() || requestDetails.config?.baseURL || '';
    return `${baseURL}${requestDetails.path}`;
  }

  /**
   * Sleep/wait after assertions
   * @param {number} ms - Milliseconds to sleep (e.g., 1000 = 1 second)
   * @returns {Promise<this>} Promise resolving to ThenStep for method chaining
   * @example
   * ```typescript
   * const response = await restified.given()
   *   .baseURL('https://api.example.com')
   * .when()
   *   .get('/users')
   *   .execute();
   * 
   * await response.then()
   *   .statusCode(200)
   *   .sleep(2000)  // Wait 2 seconds after assertion
   *   .jsonPath('$.data.length', 5);
   * ```
   */
  async sleep(ms: number): Promise<this> {
    await new Promise(resolve => setTimeout(resolve, ms));
    return this;
  }

  /**
   * Alias for sleep() method
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<this>} Promise resolving to ThenStep for method chaining
   */
  async wait(ms: number): Promise<this> {
    return this.sleep(ms);
  }

  getResponse(): HttpResponse {
    return this.response;
  }

  getAssertions(): AssertionResult[] {
    return this.assertions;
  }
}