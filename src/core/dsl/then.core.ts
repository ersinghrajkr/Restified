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
    this.context.setAssertions(this.assertions);
    
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

  private async addToMochawesomeContext(): Promise<void> {
    try {
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
    // Access current Mocha test context
    try {
      // Method 1: Use our global context capture from the plugin
      if ((global as any).__RESTIFIED_TEST_CONTEXT__) {
        return (global as any).__RESTIFIED_TEST_CONTEXT__;
      }
      
      // Method 2: Try to get from the current context plugin
      const contextPlugin = require('../../reporting/mocha-context-plugin');
      if (contextPlugin && contextPlugin.getCurrentTestContext) {
        const context = contextPlugin.getCurrentTestContext();
        if (context) return context;
      }
      
      // Method 3: Fallback to mocha internal access
      const mocha = require('mocha');
      if (mocha.Suite && mocha.Suite.current) {
        const suite = mocha.Suite.current;
        if (suite.ctx && suite.ctx.currentTest) {
          return suite.ctx.currentTest;
        }
        // Try the suite's context itself
        return suite.ctx;
      }
      
      return null;
    } catch (error) {
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
      currentTest.requestData = {
        method: requestDetails.method,
        url: this.buildFullUrl(requestDetails),
        headers: this.context.getRequestHeaders?.() || {},
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

  getResponse(): HttpResponse {
    return this.response;
  }

  getAssertions(): AssertionResult[] {
    return this.assertions;
  }
}