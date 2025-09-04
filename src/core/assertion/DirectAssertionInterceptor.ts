/**
 * Direct Assertion Interceptor for RestifiedTS
 * 
 * This provides simple, direct support for popular assertion libraries:
 * - Chai (expect, should)
 * - Playwright (expect)
 * - Jest/Vitest (expect)
 * - Node.js assert
 * - Custom assertions
 */

export interface CapturedAssertion {
  type: 'chai' | 'playwright' | 'jest' | 'should' | 'assert' | 'custom';
  passed: boolean;
  message: string;
  expected?: any;
  actual?: any;
  stack?: string;
  timestamp: number;
}

export class DirectAssertionInterceptor {
  private static instance: DirectAssertionInterceptor;
  private capturedAssertions: CapturedAssertion[] = [];
  private isCapturing: boolean = false;

  private constructor() {}

  static getInstance(): DirectAssertionInterceptor {
    if (!DirectAssertionInterceptor.instance) {
      DirectAssertionInterceptor.instance = new DirectAssertionInterceptor();
    }
    return DirectAssertionInterceptor.instance;
  }

  /**
   * Start capturing assertions
   */
  startCapturing(): void {
    this.isCapturing = true;
    this.capturedAssertions = [];
    console.log('🎯 Direct assertion capture started');
  }

  /**
   * Stop capturing and return results
   */
  stopCapturing(): CapturedAssertion[] {
    this.isCapturing = false;
    const captured = [...this.capturedAssertions];
    console.log(`🏁 Direct assertion capture stopped. Captured ${captured.length} assertions`);
    return captured;
  }

  /**
   * Manually add an assertion (this is the main method for integration)
   */
  addAssertion(assertion: Omit<CapturedAssertion, 'timestamp'>): void {
    if (!this.isCapturing) return;

    const capturedAssertion: CapturedAssertion = {
      ...assertion,
      timestamp: Date.now()
    };

    this.capturedAssertions.push(capturedAssertion);
    
    const status = assertion.passed ? '✅' : '❌';
    console.log(`➕ Captured [${assertion.type}] ${status} ${assertion.message}`);
  }

  /**
   * Get all captured assertions
   */
  getCapturedAssertions(): CapturedAssertion[] {
    return [...this.capturedAssertions];
  }

  /**
   * Clear all captured assertions
   */
  clear(): void {
    this.capturedAssertions = [];
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    passed: number;
    failed: number;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.capturedAssertions.length,
      passed: this.capturedAssertions.filter(a => a.passed).length,
      failed: this.capturedAssertions.filter(a => !a.passed).length,
      byType: {} as Record<string, number>
    };

    this.capturedAssertions.forEach(assertion => {
      stats.byType[assertion.type] = (stats.byType[assertion.type] || 0) + 1;
    });

    return stats;
  }
}

// ==============================================
// CHAI INTEGRATION HELPERS
// ==============================================

/**
 * Chai expect() wrapper that captures assertions
 */
export function expectWithCapture(actual: any, type: 'chai' = 'chai') {
  const chai = require('chai');
  const expectResult = chai.expect(actual);
  const interceptor = DirectAssertionInterceptor.getInstance();
  
  // Create a deep proxy that wraps all chained methods
  function createChainProxy(obj: any, chainPath: string[] = []): any {
    return new Proxy(obj, {
      get(target, prop: string) {
        const originalMethod = target[prop];
        
        // Handle function calls (assertions)
        if (typeof originalMethod === 'function') {
          const newChainPath = [...chainPath, prop];
          
          return function(...args: any[]) {
            try {
              const result = originalMethod.apply(target, args);
              
              // Check if this is an assertion method
              if (isAssertionMethod(prop) || isChainTerminator(prop)) {
                // Capture successful assertion
                const fullChain = newChainPath.join('.');
                interceptor.addAssertion({
                  type,
                  passed: true,
                  message: `expect(${formatValue(actual)}).${fullChain}(${formatArgs(args)})`,
                  expected: args[0],
                  actual: actual
                });
              }
              
              // If result is an object, wrap it in proxy too (for method chaining)
              if (result && typeof result === 'object' && result !== result.constructor.prototype) {
                return createChainProxy(result, newChainPath);
              }
              
              return result;
            } catch (error: any) {
              // Check if this is an assertion method
              if (isAssertionMethod(prop) || isChainTerminator(prop)) {
                // Capture failed assertion
                const fullChain = newChainPath.join('.');
                interceptor.addAssertion({
                  type,
                  passed: false,
                  message: `expect(${formatValue(actual)}).${fullChain}(${formatArgs(args)}) - ${error.message}`,
                  expected: args[0],
                  actual: actual,
                  stack: error.stack
                });
              }
              
              throw error;
            }
          };
        }
        
        // Handle getters and properties (like 'to', 'be', 'have')
        if (originalMethod && typeof originalMethod === 'object') {
          const newChainPath = [...chainPath, prop];
          return createChainProxy(originalMethod, newChainPath);
        }
        
        return originalMethod;
      }
    });
  }
  
  return createChainProxy(expectResult);
}

/**
 * Playwright expect() wrapper that captures assertions
 */
export function playwrightExpectWithCapture(actual: any) {
  try {
    const playwright = require('@playwright/test');
    const expectResult = playwright.expect(actual);
    
    const interceptor = DirectAssertionInterceptor.getInstance();
    
    return new Proxy(expectResult, {
      get(target, prop: string) {
        const originalMethod = target[prop];
        
        if (typeof originalMethod === 'function' && isAssertionMethod(prop)) {
          return function(...args: any[]) {
            try {
              const result = originalMethod.apply(target, args);
              
              // Capture successful assertion
              interceptor.addAssertion({
                type: 'playwright',
                passed: true,
                message: `expect(${formatValue(actual)}).${prop}(${formatArgs(args)})`,
                expected: args[0],
                actual: actual
              });
              
              return result;
            } catch (error: any) {
              // Capture failed assertion
              interceptor.addAssertion({
                type: 'playwright',
                passed: false,
                message: `expect(${formatValue(actual)}).${prop}(${formatArgs(args)}) - ${error.message}`,
                expected: args[0],
                actual: actual,
                stack: error.stack
              });
              
              throw error;
            }
          };
        }
        
        return originalMethod;
      }
    });
  } catch (error) {
    // Fallback to chai if Playwright not available
    return expectWithCapture(actual, 'chai');
  }
}

/**
 * Should syntax wrapper that captures assertions
 */
export function shouldWithCapture(actual: any) {
  const chai = require('chai');
  chai.should();
  
  const shouldResult = actual.should;
  const interceptor = DirectAssertionInterceptor.getInstance();
  
  return new Proxy(shouldResult, {
    get(target, prop: string) {
      const originalMethod = target[prop];
      
      if (typeof originalMethod === 'function' && isAssertionMethod(prop)) {
        return function(...args: any[]) {
          try {
            const result = originalMethod.apply(target, args);
            
            interceptor.addAssertion({
              type: 'should',
              passed: true,
              message: `${formatValue(actual)}.should.${prop}(${formatArgs(args)})`,
              expected: args[0],
              actual: actual
            });
            
            return result;
          } catch (error: any) {
            interceptor.addAssertion({
              type: 'should',
              passed: false,
              message: `${formatValue(actual)}.should.${prop}(${formatArgs(args)}) - ${error.message}`,
              expected: args[0],
              actual: actual,
              stack: error.stack
            });
            
            throw error;
          }
        };
      }
      
      return originalMethod;
    }
  });
}

/**
 * Node.js assert wrapper that captures assertions
 */
export const assertWithCapture = {
  equal(actual: any, expected: any, message?: string) {
    const assert = require('assert');
    const interceptor = DirectAssertionInterceptor.getInstance();
    
    try {
      assert.equal(actual, expected, message);
      
      interceptor.addAssertion({
        type: 'assert',
        passed: true,
        message: `assert.equal(${formatValue(actual)}, ${formatValue(expected)})${message ? ` - ${message}` : ''}`,
        expected,
        actual
      });
    } catch (error: any) {
      interceptor.addAssertion({
        type: 'assert',
        passed: false,
        message: `assert.equal(${formatValue(actual)}, ${formatValue(expected)}) - ${error.message}`,
        expected,
        actual,
        stack: error.stack
      });
      
      throw error;
    }
  },

  strictEqual(actual: any, expected: any, message?: string) {
    const assert = require('assert');
    const interceptor = DirectAssertionInterceptor.getInstance();
    
    try {
      assert.strictEqual(actual, expected, message);
      
      interceptor.addAssertion({
        type: 'assert',
        passed: true,
        message: `assert.strictEqual(${formatValue(actual)}, ${formatValue(expected)})${message ? ` - ${message}` : ''}`,
        expected,
        actual
      });
    } catch (error: any) {
      interceptor.addAssertion({
        type: 'assert',
        passed: false,
        message: `assert.strictEqual(${formatValue(actual)}, ${formatValue(expected)}) - ${error.message}`,
        expected,
        actual,
        stack: error.stack
      });
      
      throw error;
    }
  },

  ok(value: any, message?: string) {
    const assert = require('assert');
    const interceptor = DirectAssertionInterceptor.getInstance();
    
    try {
      assert.ok(value, message);
      
      interceptor.addAssertion({
        type: 'assert',
        passed: true,
        message: `assert.ok(${formatValue(value)})${message ? ` - ${message}` : ''}`,
        expected: 'truthy',
        actual: value
      });
    } catch (error: any) {
      interceptor.addAssertion({
        type: 'assert',
        passed: false,
        message: `assert.ok(${formatValue(value)}) - ${error.message}`,
        expected: 'truthy',
        actual: value,
        stack: error.stack
      });
      
      throw error;
    }
  }
};

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function isAssertionMethod(methodName: string): boolean {
  const assertionMethods = [
    // Common expect methods
    'toBe', 'toEqual', 'toMatch', 'toBeDefined', 'toBeUndefined',
    'toBeNull', 'toBeTruthy', 'toBeFalsy', 'toContain', 'toHaveLength',
    'toBeGreaterThan', 'toBeLessThan', 'toBeCloseTo', 'toThrow',
    'toHaveProperty', 'toBeInstanceOf', 'toMatchObject',
    
    // Chai methods
    'equal', 'eql', 'above', 'below', 'within', 'instanceof',
    'property', 'ownProperty', 'length', 'match', 'string',
    'keys', 'throw', 'respondTo', 'satisfy', 'closeTo',
    'members', 'oneOf', 'change', 'increase', 'decrease',
    
    // Playwright specific
    'toBeVisible', 'toBeHidden', 'toBeEnabled', 'toBeDisabled',
    'toHaveText', 'toHaveValue', 'toHaveAttribute', 'toHaveClass',
    'toHaveCount', 'toBeAttached', 'toBeChecked',
    
    // Should syntax
    'be', 'have', 'include', 'contain', 'exist', 'not'
  ];
  
  return assertionMethods.includes(methodName) || 
         methodName.startsWith('to') || 
         methodName.startsWith('be') ||
         methodName.startsWith('have');
}

function isChainTerminator(methodName: string): boolean {
  // These are the actual assertion methods that should be captured
  const terminators = [
    'equal', 'eql', 'above', 'below', 'within', 'instanceof',
    'property', 'ownProperty', 'length', 'match', 'string',
    'keys', 'throw', 'respondTo', 'satisfy', 'closeTo',
    'members', 'oneOf', 'change', 'increase', 'decrease',
    'contain', 'include', 'ok', 'true', 'false', 'null', 'undefined',
    'exist', 'empty', 'arguments', 'extensible', 'sealed', 'frozen',
    'a', 'an', // Chai type checking methods
    'greaterThan', 'lessThan', 'at', 'most', 'least' // Additional Chai methods
  ];
  
  return terminators.includes(methodName);
}

function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

function formatArgs(args: any[]): string {
  return args.map(arg => formatValue(arg)).join(', ');
}

// Export singleton instance
export const directAssertionInterceptor = DirectAssertionInterceptor.getInstance();