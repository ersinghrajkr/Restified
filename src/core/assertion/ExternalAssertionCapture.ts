/**
 * External Assertion Capture System for RestifiedTS
 * 
 * This module captures assertions from external testing frameworks like:
 * - Playwright's expect()
 * - Cypress cy.should() 
 * - Jest/Vitest expect()
 * - Chai expect()
 * - Node.js assert
 * 
 * And includes them in RestifiedTS HTML reports.
 */

import { AssertionResult } from '../../RestifiedTypes';

export interface ExternalAssertionResult {
  type: 'expect' | 'assert' | 'should' | 'custom';
  framework: 'playwright' | 'cypress' | 'jest' | 'chai' | 'node' | 'custom';
  passed: boolean;
  message: string;
  expected?: any;
  actual?: any;
  matcher?: string;
  stack?: string;
  timestamp: number;
  testContext?: string;
}

export class ExternalAssertionCapture {
  private static instance: ExternalAssertionCapture;
  private capturedAssertions: ExternalAssertionResult[] = [];
  private isCapturing: boolean = false;
  private currentTestId: string | null = null;
  private originalExpect: any = null;
  private originalAssert: any = null;
  private hooks: Map<string, Function[]> = new Map();

  private constructor() {}

  static getInstance(): ExternalAssertionCapture {
    if (!ExternalAssertionCapture.instance) {
      ExternalAssertionCapture.instance = new ExternalAssertionCapture();
    }
    return ExternalAssertionCapture.instance;
  }

  /**
   * Start capturing external assertions for a test
   */
  startCapturing(testId?: string): void {
    this.isCapturing = true;
    this.currentTestId = testId || `test-${Date.now()}`;
    this.capturedAssertions = [];
    
    if (process.env.DEBUG_RESTIFIED_ASSERTIONS === 'true') {
      console.log(`🎯 Started capturing external assertions for test: ${this.currentTestId}`);
    }

    this.hookIntoAssertionLibraries();
  }

  /**
   * Stop capturing and return captured assertions
   */
  stopCapturing(): ExternalAssertionResult[] {
    this.isCapturing = false;
    const captured = [...this.capturedAssertions];
    this.restoreOriginalAssertionLibraries();
    
    if (process.env.DEBUG_RESTIFIED_ASSERTIONS === 'true') {
      console.log(`🏁 Stopped capturing. Found ${captured.length} external assertions`);
    }
    
    return captured;
  }

  /**
   * Add a manually captured assertion
   */
  addAssertion(assertion: Partial<ExternalAssertionResult>): void {
    if (!this.isCapturing) return;

    const fullAssertion: ExternalAssertionResult = {
      type: assertion.type || 'custom',
      framework: assertion.framework || 'custom',
      passed: assertion.passed !== undefined ? assertion.passed : true,
      message: assertion.message || 'Custom assertion',
      expected: assertion.expected,
      actual: assertion.actual,
      matcher: assertion.matcher,
      stack: assertion.stack || new Error().stack,
      timestamp: Date.now(),
      testContext: this.currentTestId || 'unknown'
    };

    this.capturedAssertions.push(fullAssertion);
    
    if (process.env.DEBUG_RESTIFIED_ASSERTIONS === 'true') {
      console.log(`➕ Captured external assertion: ${fullAssertion.message}`);
    }
  }

  /**
   * Get all captured assertions for current test
   */
  getCapturedAssertions(): ExternalAssertionResult[] {
    return [...this.capturedAssertions];
  }

  /**
   * Convert external assertions to RestifiedTS format
   */
  toRestifiedAssertions(): AssertionResult[] {
    return this.capturedAssertions.map(ext => ({
      passed: ext.passed,
      message: `[${ext.framework}] ${ext.message}`,
      expected: ext.expected,
      actual: ext.actual,
      errorDetails: ext.stack ? {
        name: ext.type,
        message: ext.message,
        stack: ext.stack
      } : undefined
    }));
  }

  /**
   * Hook into common assertion libraries
   */
  private hookIntoAssertionLibraries(): void {
    this.hookIntoPlaywrightExpect();
    this.hookIntoCypressShould();
    this.hookIntoJestExpect();
    this.hookIntoChaiExpect();
    this.hookIntoNodeAssert();
  }

  /**
   * Hook into Playwright's expect
   */
  private hookIntoPlaywrightExpect(): void {
    try {
      // Try to access Playwright's expect
      const playwright = require('@playwright/test');
      if (playwright && playwright.expect && !this.originalExpect) {
        this.originalExpect = playwright.expect;
        
        playwright.expect = new Proxy(this.originalExpect, {
          apply: (target, thisArg, args) => {
            const result = target.apply(thisArg, args);
            
            // Wrap the result to capture assertion calls
            return new Proxy(result, {
              get: (resultTarget, prop) => {
                const originalMethod = resultTarget[prop];
                
                if (typeof originalMethod === 'function' && this.isAssertionMethod(prop as string)) {
                  return new Proxy(originalMethod, {
                    apply: (methodTarget, methodThisArg, methodArgs) => {
                      try {
                        const assertionResult = methodTarget.apply(methodThisArg, methodArgs);
                        
                        // Capture successful assertion
                        this.addAssertion({
                          type: 'expect',
                          framework: 'playwright',
                          passed: true,
                          message: `expect(${this.formatValue(args[0])}).${prop as string}(${this.formatArgs(methodArgs)})`,
                          expected: methodArgs[0],
                          actual: args[0],
                          matcher: prop as string
                        });
                        
                        return assertionResult;
                      } catch (error: any) {
                        // Capture failed assertion
                        this.addAssertion({
                          type: 'expect',
                          framework: 'playwright',
                          passed: false,
                          message: `expect(${this.formatValue(args[0])}).${prop as string}(${this.formatArgs(methodArgs)}) - ${error.message}`,
                          expected: methodArgs[0],
                          actual: args[0],
                          matcher: prop as string,
                          stack: error.stack
                        });
                        
                        throw error;
                      }
                    }
                  });
                }
                
                return originalMethod;
              }
            });
          }
        });
        
        if (process.env.DEBUG_RESTIFIED_ASSERTIONS === 'true') {
          console.log('✅ Hooked into Playwright expect()');
        }
      }
    } catch (error) {
      // Playwright not available
    }
  }

  /**
   * Hook into Cypress cy.should
   */
  private hookIntoCypressShould(): void {
    try {
      if (typeof window !== 'undefined' && (window as any).cy) {
        const cy = (window as any).cy;
        const originalShould = cy.should;
        
        cy.should = (...args: any[]) => {
          try {
            const result = originalShould.apply(cy, args);
            
            this.addAssertion({
              type: 'should',
              framework: 'cypress',
              passed: true,
              message: `cy.should('${args[0]}', ${this.formatArgs(args.slice(1))})`,
              matcher: args[0]
            });
            
            return result;
          } catch (error: any) {
            this.addAssertion({
              type: 'should',
              framework: 'cypress',
              passed: false,
              message: `cy.should('${args[0]}', ${this.formatArgs(args.slice(1))}) - ${error.message}`,
              matcher: args[0],
              stack: error.stack
            });
            
            throw error;
          }
        };
        
        if (process.env.DEBUG_RESTIFIED_ASSERTIONS === 'true') {
          console.log('✅ Hooked into Cypress cy.should()');
        }
      }
    } catch (error) {
      // Cypress not available
    }
  }

  /**
   * Hook into Jest/Vitest expect (simplified approach)
   */
  private hookIntoJestExpect(): void {
    try {
      if (typeof global !== 'undefined' && (global as any).expect && !this.originalExpect) {
        this.originalExpect = (global as any).expect;
        
        const self = this;
        
        // Override the global expect function
        (global as any).expect = function(actual: any) {
          const expectObject = self.originalExpect(actual);
          
          // Wrap all assertion methods
          return new Proxy(expectObject, {
            get(target, prop) {
              const originalMethod = target[prop];
              
              if (typeof originalMethod === 'function' && self.isAssertionMethod(prop as string)) {
                return function(...args: any[]) {
                  try {
                    // Call original method
                    const result = originalMethod.apply(target, args);
                    
                    // Capture successful assertion
                    if (self.isCapturing) {
                      self.addAssertion({
                        type: 'expect',
                        framework: 'jest',
                        passed: true,
                        message: `expect(${self.formatValue(actual)}).${prop as string}(${self.formatArgs(args)})`,
                        expected: args[0],
                        actual: actual,
                        matcher: prop as string
                      });
                    }
                    
                    return result;
                  } catch (error: any) {
                    // Capture failed assertion
                    if (self.isCapturing) {
                      self.addAssertion({
                        type: 'expect',
                        framework: 'jest',
                        passed: false,
                        message: `expect(${self.formatValue(actual)}).${prop as string}(${self.formatArgs(args)}) - ${error.message}`,
                        expected: args[0],
                        actual: actual,
                        matcher: prop as string,
                        stack: error.stack
                      });
                    }
                    
                    throw error;
                  }
                };
              }
              
              return originalMethod;
            }
          });
        };
        
        if (process.env.DEBUG_RESTIFIED_ASSERTIONS === 'true') {
          console.log('✅ Hooked into Jest/Vitest expect()');
        }
      }
    } catch (error) {
      // Jest not available
      if (process.env.DEBUG_RESTIFIED_ASSERTIONS === 'true') {
        console.log('❌ Failed to hook into Jest expect:', error);
      }
    }
  }

  /**
   * Hook into Chai expect
   */
  private hookIntoChaiExpect(): void {
    try {
      const chai = require('chai');
      if (chai && chai.expect) {
        const originalExpect = chai.expect;
        
        chai.expect = new Proxy(originalExpect, {
          apply: (target, thisArg, args) => {
            const result = target.apply(thisArg, args);
            return this.wrapChaiAssertion(result, args[0]);
          }
        });
        
        if (process.env.DEBUG_RESTIFIED_ASSERTIONS === 'true') {
          console.log('✅ Hooked into Chai expect()');
        }
      }
    } catch (error) {
      // Chai not available
    }
  }

  /**
   * Hook into Node.js assert
   */
  private hookIntoNodeAssert(): void {
    try {
      const assert = require('assert');
      this.originalAssert = { ...assert };
      
      Object.keys(assert).forEach(key => {
        if (typeof assert[key] === 'function') {
          const originalMethod = assert[key];
          
          assert[key] = (...args: any[]) => {
            try {
              const result = originalMethod.apply(assert, args);
              
              this.addAssertion({
                type: 'assert',
                framework: 'node',
                passed: true,
                message: `assert.${key}(${this.formatArgs(args)})`,
                matcher: key
              });
              
              return result;
            } catch (error: any) {
              this.addAssertion({
                type: 'assert',
                framework: 'node',
                passed: false,
                message: `assert.${key}(${this.formatArgs(args)}) - ${error.message}`,
                matcher: key,
                stack: error.stack
              });
              
              throw error;
            }
          };
        }
      });
      
      if (process.env.DEBUG_RESTIFIED_ASSERTIONS === 'true') {
        console.log('✅ Hooked into Node.js assert()');
      }
    } catch (error) {
      // Node assert not available
    }
  }

  /**
   * Wrap Chai assertion to capture calls
   */
  private wrapChaiAssertion(assertion: any, actualValue: any): any {
    return new Proxy(assertion, {
      get: (target, prop) => {
        const originalMethod = target[prop];
        
        if (typeof originalMethod === 'function' && this.isAssertionMethod(prop as string)) {
          return (...args: any[]) => {
            try {
              const result = originalMethod.apply(target, args);
              
              this.addAssertion({
                type: 'expect',
                framework: 'chai',
                passed: true,
                message: `expect(${this.formatValue(actualValue)}).${prop as string}(${this.formatArgs(args)})`,
                expected: args[0],
                actual: actualValue,
                matcher: prop as string
              });
              
              return result;
            } catch (error: any) {
              this.addAssertion({
                type: 'expect',
                framework: 'chai',
                passed: false,
                message: `expect(${this.formatValue(actualValue)}).${prop as string}(${this.formatArgs(args)}) - ${error.message}`,
                expected: args[0],
                actual: actualValue,
                matcher: prop as string,
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
   * Restore original assertion libraries
   */
  private restoreOriginalAssertionLibraries(): void {
    if (this.originalExpect) {
      try {
        const playwright = require('@playwright/test');
        if (playwright) {
          playwright.expect = this.originalExpect;
        }
      } catch (error) {
        // Ignore
      }
      
      try {
        if (typeof global !== 'undefined' && (global as any).expect) {
          (global as any).expect = this.originalExpect;
        }
      } catch (error) {
        // Ignore
      }
      
      this.originalExpect = null;
    }
    
    if (this.originalAssert) {
      try {
        const assert = require('assert');
        Object.keys(this.originalAssert).forEach(key => {
          assert[key] = this.originalAssert[key];
        });
      } catch (error) {
        // Ignore
      }
      
      this.originalAssert = null;
    }
  }

  /**
   * Check if a method name is an assertion method
   */
  private isAssertionMethod(methodName: string): boolean {
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
      'toHaveCount', 'toBeAttached', 'toBeChecked'
    ];
    
    return assertionMethods.includes(methodName) || 
           methodName.startsWith('to') || 
           methodName.startsWith('be') ||
           methodName.startsWith('have');
  }

  /**
   * Format a value for display
   */
  private formatValue(value: any): string {
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

  /**
   * Format arguments for display
   */
  private formatArgs(args: any[]): string {
    return args.map(arg => this.formatValue(arg)).join(', ');
  }

  /**
   * Clear all captured assertions
   */
  clear(): void {
    this.capturedAssertions = [];
    this.currentTestId = null;
  }

  /**
   * Get statistics about captured assertions
   */
  getStats(): {
    total: number;
    passed: number;
    failed: number;
    byFramework: Record<string, number>;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.capturedAssertions.length,
      passed: this.capturedAssertions.filter(a => a.passed).length,
      failed: this.capturedAssertions.filter(a => !a.passed).length,
      byFramework: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };
    
    this.capturedAssertions.forEach(assertion => {
      stats.byFramework[assertion.framework] = (stats.byFramework[assertion.framework] || 0) + 1;
      stats.byType[assertion.type] = (stats.byType[assertion.type] || 0) + 1;
    });
    
    return stats;
  }
}

export const externalAssertionCapture = ExternalAssertionCapture.getInstance();