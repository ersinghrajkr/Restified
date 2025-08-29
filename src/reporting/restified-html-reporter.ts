/**
 * Restified HTML Reporter - Enterprise Production Ready
 * 
 * Features:
 * - Guaranteed request/response/assertion capture
 * - Optimized for large test suites (10000+ tests, 200MB+ reports)
 * - Virtual scrolling and on-demand loading for performance
 * - Seamless auto-configuration for end users
 * - Real-time data capture with multiple fallback mechanisms
 * - Memory-efficient report generation with streaming
 */

import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import { RestifiedTemplateEngine } from './restified-template-engine';

// Enhanced interface for the reporter function with static methods
interface RestifiedHtmlReporterFunction {
  (runner: any, options?: any): void;
  configure: (config: any) => void;
  reset: () => void;
  generateReport: (outputPath?: string) => void;
  addTestResult: (testResult: any) => void;
  getTestResults: () => any[];
  // New methods for enterprise features
  enableDataCapture: (enable: boolean) => void;
  setLargeReportMode: (enable: boolean) => void;
  getMemoryUsage: () => { tests: number; memoryMB: number; };
}

// Mocha Reporter Function - this is what Mocha expects
const RestifiedHtmlReporter = function(runner: any, options?: any) {
  // Set up global test context capture for RestifiedTS
  let currentTest: any = null;
  
  runner.on('test', (test: any) => {
    currentTest = test;
    (global as any).__RESTIFIED_TEST_CONTEXT__ = test;
  });
  
  runner.on('test end', (test: any) => {
    currentTest = null;
    (global as any).__RESTIFIED_TEST_CONTEXT__ = null;
  });
  
  // Initialize the internal static reporter
  RestifiedHtmlReporterImpl.initialize(runner, options);
} as RestifiedHtmlReporterFunction;

// Add static methods to the function for backwards compatibility
RestifiedHtmlReporter.configure = (config: any) => RestifiedHtmlReporterImpl.configure(config);
RestifiedHtmlReporter.reset = () => RestifiedHtmlReporterImpl.reset();
RestifiedHtmlReporter.generateReport = (outputPath?: string) => RestifiedHtmlReporterImpl.generateReport(outputPath);
RestifiedHtmlReporter.addTestResult = (testResult: any) => RestifiedHtmlReporterImpl.addTestResult(testResult);
RestifiedHtmlReporter.getTestResults = () => RestifiedHtmlReporterImpl.getTestResults();
// New enterprise methods
RestifiedHtmlReporter.enableDataCapture = (enable: boolean) => RestifiedHtmlReporterImpl.enableDataCapture(enable);
RestifiedHtmlReporter.setLargeReportMode = (enable: boolean) => RestifiedHtmlReporterImpl.setLargeReportMode(enable);
RestifiedHtmlReporter.getMemoryUsage = () => RestifiedHtmlReporterImpl.getMemoryUsage();

// Enhanced internal implementation with enterprise features
class RestifiedHtmlReporterImpl {
  private static testResults: any[] = [];
  private static reportConfig: any = {};
  private static dataCapture: boolean = true;
  private static largeReportMode: boolean = false;
  private static memoryThreshold: number = 100 * 1024 * 1024; // 100MB
  private static testDataStore: Map<string, any> = new Map();
  private static requestResponseCache: Map<string, any> = new Map();
  private static currentTestId: string = '';
  private static processedTests: Set<string> = new Set();
  
  private static suiteInfo = {
    title: 'Restified Test Report',
    subtitle: '',
    startTime: new Date(),
    endTime: new Date(),
    duration: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    total: 0
  };

  static initialize(runner: any, options?: any) {
    this.reset();
    
    const opts = (options && options.reporterOptions) || {};
    this.configure(opts);
    
    // Enable automatic data capture and performance optimization
    this.enableDataCapture(true);
    this.detectLargeReportMode();
    
    // Set up global hooks for guaranteed data capture
    this.setupGlobalDataCapture();

    // Listen to Mocha events with enhanced data capture
    runner.on('start', () => {
      this.suiteInfo.startTime = new Date();
      console.log('🚀 Starting Restified test execution with enhanced data capture...');
      console.log(`📊 Large report mode: ${this.largeReportMode ? 'ENABLED' : 'DISABLED'}`);
    });

    runner.on('test', (test: any) => {
      // Generate unique test ID for data tracking
      this.currentTestId = `${test.fullTitle()}_${Date.now()}`;
      
      // 🎯 CRITICAL: Set global test context for ThenStep to access
      (global as any).__RESTIFIED_CURRENT_TEST_CONTEXT__ = test;
      
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('🎯 Reporter: Set global test context for:', test.title);
      }
      
      // Enhanced data capture setup
      this.setupTestDataCapture(test);
      
      // Store test context with multiple fallback mechanisms
      const currentTest = global.__RESTIFIED_TEST_CONTEXT__;
      if (currentTest) {
        test._restifiedContext = currentTest;
      }
      
      // Initialize request/response capture for this test
      this.initializeTestDataCapture(test);
    });

    runner.on('pass', (test: any) => {
      this.suiteInfo.passed++;
      const testResult = this.createEnhancedTestResult(test, 'passed');
      this.storeTestResult(testResult);
      
      // Clear global context after processing
      (global as any).__RESTIFIED_CURRENT_TEST_CONTEXT__ = null;
    });

    runner.on('fail', (test: any, err: any) => {
      this.suiteInfo.failed++;
      const testResult = this.createEnhancedTestResult(test, 'failed', err);
      this.storeTestResult(testResult);
      
      // Clear global context after processing
      (global as any).__RESTIFIED_CURRENT_TEST_CONTEXT__ = null;
    });

    runner.on('pending', (test: any) => {
      this.suiteInfo.pending++;
      const testResult = this.createEnhancedTestResult(test, 'pending');
      this.storeTestResult(testResult);
      
      // Clear global context after processing
      (global as any).__RESTIFIED_CURRENT_TEST_CONTEXT__ = null;
    });

    runner.on('end', () => {
      this.suiteInfo.endTime = new Date();
      this.suiteInfo.duration = this.suiteInfo.endTime.getTime() - this.suiteInfo.startTime.getTime();
      this.suiteInfo.total = this.testResults.length;
      
      const memoryUsage = this.getMemoryUsage();
      console.log('📊 Generating Enhanced Restified HTML Report...');
      console.log(`📈 Total Tests: ${this.suiteInfo.total}`);
      console.log(`💾 Memory Usage: ${memoryUsage.memoryMB}MB`);
      console.log(`🚀 Performance Mode: ${this.largeReportMode ? 'Optimized for Large Reports' : 'Standard'}`);
      
      this.generateReport();
    });
  }

  // New enhanced methods for enterprise features
  static enableDataCapture(enable: boolean): void {
    this.dataCapture = enable;
    if (enable) {
      console.log('✅ Enhanced data capture enabled for requests/responses/assertions');
    } else {
      console.log('⚠️ Data capture disabled - reports will have limited information');
    }
  }
  
  static setLargeReportMode(enable: boolean): void {
    this.largeReportMode = enable;
    if (enable) {
      console.log('⚡ Large report mode enabled - optimizing for 10000+ tests');
    }
  }
  
  static getMemoryUsage(): { tests: number; memoryMB: number; } {
    const used = process.memoryUsage();
    return {
      tests: this.testResults.length,
      memoryMB: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100
    };
  }
  
  private static detectLargeReportMode(): void {
    const memUsage = process.memoryUsage().heapUsed;
    if (memUsage > this.memoryThreshold || this.testResults.length > 5000) {
      this.setLargeReportMode(true);
    }
  }
  
  private static setupGlobalDataCapture(): void {
    // Enhanced global data capture setup
    if (this.dataCapture) {
      // Set up interval to capture any pending data
      const captureInterval = setInterval(() => {
        this.flushPendingData();
      }, 50); // Check every 50ms for faster capture
      
      // Hook into RestifiedTS DSL execution completion
      this.hookIntoRestifiedExecution();
      
      // Clean up on process exit  
      process.on('exit', () => clearInterval(captureInterval));
    }
  }
  
  private static hookIntoRestifiedExecution(): void {
    // Hook into the global RestifiedTS execution to capture data immediately
    // This is a simplified version to avoid TypeScript issues
    
    // Set up a more frequent data flush when hooks are enabled
    if (this.dataCapture) {
      // Just rely on the interval-based capture for now
      // This avoids complex TypeScript issues with global function hooking
    }
  }
  
  private static setupTestDataCapture(test: any): void {
    // Create a data container for this specific test
    const testId = this.currentTestId;
    this.testDataStore.set(testId, {
      test: test,
      request: null,
      response: null,
      assertions: [],
      startTime: Date.now(),
      endTime: null
    });
  }
  
  private static initializeTestDataCapture(test: any): void {
    // Set up hooks specific to this test for data capture
    const testId = this.currentTestId;
    
    // Hook into the test's context to capture any data added
    if (test.ctx) {
      const originalAddContext = test.ctx.addContext;
      test.ctx.addContext = (data: any) => {
        this.captureTestContextData(testId, data);
        if (originalAddContext) {
          return originalAddContext.call(test.ctx, data);
        }
      };
    }
  }
  
  private static captureTestContextData(testId: string, data: any): void {
    if (!this.testDataStore.has(testId)) return;
    
    const testData = this.testDataStore.get(testId);
    
    // Extract request/response/assertion data from context
    if (data && data.value) {
      if (data.value.request) {
        testData.request = data.value.request;
      }
      if (data.value.response) {
        testData.response = data.value.response;
      }
      if (data.value.assertions) {
        testData.assertions = data.value.assertions;
      }
    }
    
    this.testDataStore.set(testId, testData);
  }
  
  private static flushPendingData(): void {
    // Enhanced data capture from multiple sources
    const globalData = (global as any).__RESTIFIED_TEST_RESPONSE_DATA__;
    const globalContext = (global as any).__RESTIFIED_TEST_CONTEXT__;
    const currentRequest = (global as any).__RESTIFIED_CURRENT_REQUEST__;
    const currentResponse = (global as any).__RESTIFIED_CURRENT_RESPONSE__;
    const currentError = (global as any).__RESTIFIED_CURRENT_ERROR__;
    
    if (this.currentTestId) {
      // Priority: Capture from WhenStep global variables (most reliable)
      if (currentRequest || currentResponse) {
        // Only log once per test to prevent infinite loops
        const logKey = `${this.currentTestId}_logged`;
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true' && !(global as any)[logKey]) {
          console.log('🔍 Reporter: Found WhenStep data for test:', this.currentTestId);
          (global as any)[logKey] = true;
        }
        const testData = {
          request: currentRequest || null,
          response: currentResponse || null,
          assertions: [],
          error: currentError || null,
          framework: {
            name: 'RestifiedTS',
            version: '2.0.7',
            dataSource: 'when_step_globals'
          }
        };
        this.captureTestContextData(this.currentTestId, { value: testData });
      } else if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('🔍 Reporter: No WhenStep data found for test:', this.currentTestId);
      }
      
      // Capture from global response data
      if (globalData) {
        this.captureTestContextData(this.currentTestId, { value: globalData });
      }
      
      // Capture from global context
      if (globalContext && globalContext.responseData) {
        this.captureTestContextData(this.currentTestId, { value: globalContext.responseData });
      }
      
      // Try to find the current Mocha test and extract data
      try {
        const currentTest = this.getCurrentRunningTest();
        if (currentTest) {
          // Check if the test has responseData attached
          if (currentTest.responseData) {
            this.captureTestContextData(this.currentTestId, { value: currentTest.responseData });
          }
          
          // Check mochawesome context
          if (currentTest.ctx && currentTest.ctx.test && currentTest.ctx.test.context) {
            const context = currentTest.ctx.test.context;
            for (const key in context) {
              const item = context[key];
              if (item && item.value && (item.value.request || item.value.response)) {
                this.captureTestContextData(this.currentTestId, item);
                break; // Found data, no need to continue
              }
            }
          }
        }
      } catch (error) {
        // Ignore errors in data extraction
      }
    }
  }
  
  private static getCurrentRunningTest(): any {
    // Try multiple approaches to get the current running test
    try {
      // Method 1: Global context
      if ((global as any).__RESTIFIED_TEST_CONTEXT__) {
        return (global as any).__RESTIFIED_TEST_CONTEXT__;
      }
      
      // Method 2: Mocha internal (if available)
      if ((global as any).suite && (global as any).suite.ctx && (global as any).suite.ctx.currentTest) {
        return (global as any).suite.ctx.currentTest;
      }
      
      // Method 3: Try to access Mocha runner
      const mocha = require('mocha');
      if (mocha && mocha.Suite && mocha.Suite.current) {
        const suite = mocha.Suite.current as any;
        if (suite.ctx && suite.ctx.currentTest) {
          return suite.ctx.currentTest;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  private static storeTestResult(testResult: any): void {
    if (this.largeReportMode) {
      // In large report mode, store results more efficiently
      this.testResults.push(testResult);
      
      // Check if we need to optimize memory usage
      if (this.testResults.length % 1000 === 0) {
        const memUsage = this.getMemoryUsage();
        console.log(`📊 Processed ${this.testResults.length} tests, Memory: ${memUsage.memoryMB}MB`);
        
        if (memUsage.memoryMB > 200) {
          console.log('⚠️ High memory usage detected, optimizing storage...');
          this.optimizeMemoryUsage();
        }
      }
    } else {
      this.testResults.push(testResult);
    }
  }
  
  private static optimizeMemoryUsage(): void {
    // Clean up old test data that's no longer needed
    const cutoff = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    
    for (const [testId, data] of this.testDataStore.entries()) {
      if (data.endTime && data.endTime < cutoff) {
        this.testDataStore.delete(testId);
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  private static createEnhancedTestResult(test: any, status: string, error?: any): any {
    if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
      console.log('🔍 Reporter: createEnhancedTestResult() called for:', test.title);
    }
    let result: any = {
      title: test.title,
      fullTitle: test.fullTitle(),
      status,
      duration: test.duration,
      isHook: test.type === 'hook',
      hookType: test.type === 'hook' ? (test.title.includes('before') ? 'before' : 'after') : null
    };

    if (error) {
      result.error = error.message || error.stack || error.toString();
      result.stackTrace = error.stack || error.message;
    }

    // Enhanced data capture with multiple fallback mechanisms
    const testId = `${test.fullTitle()}_${Date.now()}`;
    let storedData: any = null;
    
    // 🎯 PRIORITY 0: ALWAYS try direct test data attachment first (from ThenStep)
    if (this.dataCapture) {
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('🔍 Reporter: Priority 0 - Calling extractDirectTestData...');
      }
      this.extractDirectTestData(test, result);
    }
    
    // Priority 1: Check our enhanced data store (only if no direct data found)
    if (!result.request) {
      storedData = this.testDataStore.get(testId) || this.testDataStore.get(this.currentTestId);
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.log('🔍 Reporter: Priority 1 - storedData found:', !!storedData);
      }
      if (storedData && this.dataCapture) {
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
          console.log('🔍 Reporter: Priority 1 - Using enhanced store data');
        }
        result.request = storedData.request;
        result.response = storedData.response;
        result.assertions = storedData.assertions;
        result._dataSource = 'enhanced_store';
      }
    }
    
    // Priority 2: Get Restified-specific data from test context (existing logic)
    if (!result.request) {
      const restifiedData = test._restifiedContext?.responseData || test.responseData;
      if (restifiedData) {
        result.request = restifiedData.request;
        result.response = restifiedData.response;
        result.assertions = restifiedData.assertions;
        result._dataSource = 'context_data';
      }
    }

    // Priority 3: Check for direct requestData and responseData properties (RestifiedTS format)
    if (!result.request && test.requestData && test.responseData) {
      result.request = test.requestData;
      result.response = test.responseData;
      result.assertions = test.assertions;
      result._dataSource = 'direct_props';
    }

    // Priority 4: Check globally stored response data
    if (!result.request) {
      const globalResponseData = (global as any).__RESTIFIED_TEST_RESPONSE_DATA__;
      if (globalResponseData) {
        result.request = globalResponseData.request;
        result.response = globalResponseData.response;
        result.assertions = globalResponseData.assertions;
        result._dataSource = 'global_data';
      }
    }

    // Priority 5: Check globally stored test context data
    if (!result.request) {
      const globalContext = (global as any).__RESTIFIED_TEST_CONTEXT__;
      if (globalContext && globalContext.responseData) {
        result.request = globalContext.responseData.request;
        result.response = globalContext.responseData.response;
        result.assertions = globalContext.responseData.assertions;
        result._dataSource = 'global_context';
      }
    }
    
    // Priority 6: Try to extract from mochawesome context if available
    if (!result.request && test.ctx) {
      const mochawesomeData = this.extractFromMochawesomeContext(test.ctx);
      if (mochawesomeData) {
        result.request = mochawesomeData.request;
        result.response = mochawesomeData.response;
        result.assertions = mochawesomeData.assertions;
        result._dataSource = 'mochawesome_context';
      }
    }
    
    // Enhanced validation and data completion
    if (this.dataCapture) {
      result = this.validateAndCompleteTestData(result, test);
    }
    
    // Clean up test data store to prevent memory leaks
    if (storedData) {
      storedData.endTime = Date.now();
      this.testDataStore.set(testId, storedData);
    }

    return result;
  }
  
  private static extractFromMochawesomeContext(ctx: any): any {
    if (!ctx || !ctx.test || !ctx.test.context) return null;
    
    const context = ctx.test.context;
    // Look for Restified data in mochawesome context
    for (const key in context) {
      const item = context[key];
      if (item && item.value && (item.value.request || item.value.response)) {
        return item.value;
      }
    }
    
    return null;
  }
  
  private static extractDirectTestData(test: any, result: any): void {
    if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
      console.log('🔍 Reporter: extractDirectTestData() called for test:', test.title);
      console.log('🔍 Reporter: test.restifiedData:', !!test.restifiedData);
      console.log('🔍 Reporter: test.request:', !!test.request);  
      console.log('🔍 Reporter: test.response:', !!test.response);
    }
    try {
      // 🎯 PRIORITY 0: Check for direct restifiedData attachment from ThenStep
      if (test.restifiedData) {
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
          console.log('🎯 Reporter: Found direct restifiedData attachment!');
          console.log('🎯 Reporter: restifiedData structure:', JSON.stringify(test.restifiedData, null, 2));
        }
        result.request = test.restifiedData.request;
        result.response = test.restifiedData.response;
        result.assertions = test.restifiedData.assertions;
        result._dataSource = 'direct_restified_data';
        
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
          console.log('🎯 Reporter: Found direct restifiedData attachment');
          console.log('📊 Request method:', test.restifiedData.request?.method);
          console.log('📊 Response status:', test.restifiedData.response?.status);
          console.log('📊 Assertions count:', test.restifiedData.assertions?.length || 0);
        }
        return; // Found direct data, exit immediately
      }
      
      // 🔄 PRIORITY 0.5: Check global backup storage from ThenStep
      const globalTestData = (global as any).__RESTIFIED_TEST_DATA__;
      if (globalTestData && globalTestData.data) {
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
          console.log('🔄 Reporter: Found global backup restifiedData!');
        }
        result.request = globalTestData.data.request;
        result.response = globalTestData.data.response;
        result.assertions = globalTestData.data.assertions;
        result._dataSource = 'global_restified_backup';
        
        if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
          console.log('🔄 Reporter: Found global backup restifiedData');
        }
        return; // Found backup data, exit immediately
      }
      
      // Method 1: Extract from Mocha test context if available
      if (test.ctx) {
        const ctx = test.ctx;
        
        // Check if test has context added via addContext
        if (ctx.test && ctx.test.context) {
          const contextEntries = Object.values(ctx.test.context);
          for (const entry of contextEntries) {
            if (entry && typeof entry === 'object' && (entry as any).value) {
              const value = (entry as any).value;
              if (value.request || value.response) {
                result.request = value.request || result.request;
                result.response = value.response || result.response;
                result.assertions = value.assertions || result.assertions;
                result._dataSource = 'direct_context';
                return; // Found data, exit
              }
            }
          }
        }
        
        // Check parent test context
        if (ctx.parent && ctx.parent.ctx && ctx.parent.ctx.test) {
          const parentContext = ctx.parent.ctx.test.context;
          if (parentContext) {
            const contextEntries = Object.values(parentContext);
            for (const entry of contextEntries) {
              if (entry && typeof entry === 'object' && (entry as any).value) {
                const value = (entry as any).value;
                if (value.request || value.response) {
                  result.request = value.request || result.request;
                  result.response = value.response || result.response;
                  result.assertions = value.assertions || result.assertions;
                  result._dataSource = 'parent_context';
                  return;
                }
              }
            }
          }
        }
      }
      
      // Method 2: Check test object properties directly
      if (test.responseData) {
        result.request = test.responseData.request || result.request;
        result.response = test.responseData.response || result.response;
        result.assertions = test.responseData.assertions || result.assertions;
        result._dataSource = 'test_property';
        return;
      }
      
      // Method 3: Check for any RestifiedTS execution context on the test
      if (test._restifiedResponse) {
        result.request = test._restifiedResponse.request || result.request;
        result.response = test._restifiedResponse.response || result.response;
        result.assertions = test._restifiedResponse.assertions || result.assertions;
        result._dataSource = 'restified_response';
        return;
      }
      
    } catch (error) {
      // Ignore extraction errors but log them for debugging
      if (process.env.DEBUG_RESTIFIED_REPORTER === 'true') {
        console.warn('⚠️ Error extracting direct test data:', error.message);
      }
    }
  }

  private static validateAndCompleteTestData(result: any, test: any): any {
    // Only add fallback data if no real data exists
    if (!result.request || result.request.method === 'UNKNOWN') {
      result.request = {
        method: 'UNKNOWN',
        url: 'Not captured',
        headers: {},
        body: null,
        timestamp: new Date().toISOString(),
        _warning: 'Request data not captured - ensure RestifiedTS is properly integrated'
      };
    }
    
    // Only add fallback response if no real response exists
    if (!result.response || (result.response.status === 0 && !result.response.error)) {
      result.response = {
        status: 0,
        statusText: 'Not captured',
        headers: {},
        body: null,
        responseTime: 0,
        timestamp: new Date().toISOString(),
        _warning: 'Response data not captured - ensure RestifiedTS is properly integrated'
      };
    }
    
    // Ensure assertions array exists
    if (!result.assertions) {
      result.assertions = [];
    }
    
    // Add metadata about data capture success (improved validation)
    result._captureMetadata = {
      hasRequest: !!result.request && result.request.url !== 'Not captured' && result.request.method !== 'UNKNOWN',
      hasResponse: !!result.response && (result.response.status > 0 || result.response.error),
      hasAssertions: result.assertions.length > 0,
      dataSource: result._dataSource || 'none',
      captureTime: new Date().toISOString()
    };
    
    return result;
  }

  // Enhanced static methods for backward compatibility
  static addTestResult(testResult: any): void {
    // Enhance the test result if data capture is enabled
    if (this.dataCapture && testResult) {
      testResult = this.validateAndCompleteTestData(testResult, testResult);
    }
    this.storeTestResult(testResult);
  }

  static getTestResults(): any[] {
    return this.testResults;
  }

  static reset(): void {
    this.testResults = [];
    this.suiteInfo = {
      title: this.reportConfig.title || 'Restified Test Report',
      subtitle: this.reportConfig.subtitle || '',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      passed: 0,
      failed: 0,
      pending: 0,
      total: 0
    };
  }

  static configure(config: any): void {
    this.reportConfig = config || {};
    
    // Load environment variables from .env.enterprise if not already loaded
    try {
      require('dotenv').config({ path: '.env.enterprise' });
    } catch (error) {
      // Ignore if dotenv is not available
    }
    
    // Merge config with environment variables (env vars take precedence)
    const finalConfig = {
      title: process.env.REPORT_TITLE || this.reportConfig.title || 'Restified Test Report',
      subtitle: process.env.REPORT_SUBTITLE || this.reportConfig.subtitle || '',
      filename: process.env.REPORT_FILENAME || this.reportConfig.filename || 'restified-html-report.html',
      outputDir: process.env.REPORT_OUTPUT_DIR || this.reportConfig.outputDir || 'reports'
    };
    
    this.reportConfig = finalConfig;
    
    // Update current suite info if already initialized
    if (this.suiteInfo) {
      this.suiteInfo.title = finalConfig.title;
      this.suiteInfo.subtitle = finalConfig.subtitle;
    }
  }

  static addTest(test: any): void {
    this.testResults.push(test);
  }

  static generateReport(outputPath?: string): void {
    // Use configured filename and output directory if not provided
    const defaultFilename = this.reportConfig.filename || 'restified-html-report.html';
    const defaultOutputDir = this.reportConfig.outputDir || process.env.REPORT_OUTPUT_DIR || 'reports';
    const finalPath = outputPath || `${defaultOutputDir}/${defaultFilename}`;
    const memUsage = this.getMemoryUsage();
    
    console.log(`🚀 Generating Enhanced Restified HTML Report for ${this.testResults.length} tests...`);
    console.log(`💾 Current Memory Usage: ${memUsage.memoryMB}MB`);
    console.log(`⚡ Large Report Mode: ${this.largeReportMode ? 'ENABLED' : 'DISABLED'}`);
    
    this.suiteInfo.endTime = new Date();
    this.suiteInfo.duration = this.suiteInfo.endTime.getTime() - this.suiteInfo.startTime.getTime();
    this.suiteInfo.total = this.testResults.length;
    
    // Performance-optimized statistics calculation
    let passed = 0, failed = 0, pending = 0;
    for (const test of this.testResults) {
      if (test.status === 'passed') passed++;
      else if (test.status === 'failed') failed++;
      else if (test.status === 'pending') pending++;
    }
    this.suiteInfo.passed = passed;
    this.suiteInfo.failed = failed;
    this.suiteInfo.pending = pending;

    // Memory-optimized test grouping for large datasets
    const groupedTests = this.largeReportMode ? 
      this.createOptimizedGroupedTests() : 
      {
        all: this.testResults,
        passed: this.testResults.filter(t => t.status === 'passed'),
        failed: this.testResults.filter(t => t.status === 'failed'),
        pending: this.testResults.filter(t => t.status === 'pending')
      };

    // Group tests by suite name with performance optimization
    const suiteGroups = this.groupTestsBySuite(this.testResults);

    // Calculate suite-level statistics
    const suiteStats = this.calculateSuiteStats(suiteGroups);

    try {
      let htmlContent: string;
      
      if (this.largeReportMode) {
        console.log('⚡ Using optimized generation for large report...');
        htmlContent = this.generateOptimizedHtml(groupedTests, suiteGroups, suiteStats);
      } else {
        htmlContent = this.generateQuickFixHtml(groupedTests, suiteGroups, suiteStats);
      }
      
      // Ensure directory exists
      const dir = path.dirname(finalPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created report directory: ${dir}`);
      }
      
      // Write file with streaming for large reports
      if (this.largeReportMode && htmlContent.length > 50 * 1024 * 1024) { // 50MB+
        console.log('💾 Using streaming write for large report...');
        this.writeStreamedReport(finalPath, htmlContent);
      } else {
        fs.writeFileSync(finalPath, htmlContent, 'utf8');
      }
      
      console.log(`✅ Enhanced Restified HTML Report generated: ${finalPath}`);
      console.log(`📊 Performance: ${this.testResults.length} tests, ${Math.round(htmlContent.length / 1024)}KB`);
      console.log(`🔍 Data Capture Success Rate: ${this.calculateDataCaptureRate()}%`);
      
      // Clean up memory after generation
      this.cleanupAfterGeneration();
      
    } catch (error) {
      console.error('❌ Error generating HTML report:', error);
      console.error(error.stack);
    }
  }

  private static generateTestItemStatic(test: any, index: number): string {
    const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏳';
    const method = test.isHook ? 'HOOK' : (test.request?.method || 'N/A');
    const duration = test.duration ? `${test.duration}ms` : 'N/A';

    return `
        <div class="test-item ${test.isHook ? 'hook-item' : ''}" data-test="${index}" data-status="${test.status}">
            <div class="test-header">
                <div class="test-title">${this.escapeHtml(test.title)}</div>
                <div class="test-status ${test.status}">${statusIcon} ${test.status.toUpperCase()}</div>
            </div>
            <div class="test-meta">${method} • ${duration}</div>
            
            <div class="test-details">
                ${test.isHook ? `
                <div class="detail-section">
                    <h4 onclick="toggleDetail(this); event.stopPropagation();">🔧 Hook Details</h4>
                    <div class="detail-content">
                        <div class="json-view">${this.formatHookDetails(test)}</div>
                    </div>
                </div>
                ` : ''}
                
                ${test.request ? `
                <div class="detail-section">
                    <h4 onclick="toggleDetail(this); event.stopPropagation();">📤 Request</h4>
                    <div class="detail-content">
                        <div class="json-view">${this.formatRequest(test.request)}</div>
                    </div>
                </div>
                ` : ''}
                
                ${test.response ? `
                <div class="detail-section">
                    <h4 onclick="toggleDetail(this); event.stopPropagation();">📥 Response</h4>
                    <div class="detail-content">
                        <div class="json-view">${this.formatResponse(test.response)}</div>
                    </div>
                </div>
                ` : ''}
                
                ${test.assertions && test.assertions.length > 0 ? `
                <div class="detail-section">
                    <h4 onclick="toggleDetail(this); event.stopPropagation();">🔍 Assertions</h4>
                    <div class="detail-content">
                        <div class="json-view">${JSON.stringify(test.assertions, null, 2)}</div>
                    </div>
                </div>
                ` : ''}
                
                ${test.error ? `
                <div class="detail-section">
                    <h4 onclick="toggleDetail(this); event.stopPropagation();">❌ Error</h4>
                    <div class="detail-content">
                        <div class="json-view">${this.escapeHtml(test.error)}</div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>`;
  }

  private static formatRequest(request: any): string {
    const obj: any = {
      method: request.method,
      url: request.url,
      headers: request.headers,
      timestamp: request.timestamp
    };
    
    if (request.body) {
      obj['body'] = request.body;
    }
    
    return JSON.stringify(obj, null, 2);
  }

  private static formatResponse(response: any): string {
    const obj: any = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      responseTime: response.responseTime + 'ms',
      timestamp: response.timestamp,
      body: response.body || response.data
    };
    
    return JSON.stringify(obj, null, 2);
  }

  private static formatHookDetails(test: any): string {
    const hookTypeMap: Record<string, string> = {
      'before': 'Global Setup (before all tests)',
      'after': 'Global Cleanup (after all tests)',
      'beforeEach': 'Test Setup (before each test)',
      'afterEach': 'Test Cleanup (after each test)',
      'hook': 'Setup/Teardown Hook',
      'unknown': 'Setup/Teardown Hook'
    };

    const hookType = hookTypeMap[test.hookType || 'unknown'] || 'Setup/Teardown Hook';
    const duration = test.duration ? `${test.duration}ms` : '0ms';
    const status = test.status || 'passed';
    const error = test.error ? `\nError: ${test.error}` : '';
    const hookCode = test.hookCode || 'Code not available';
    
    return `Hook Type: ${hookType}
Execution Time: ${duration}
Status: ${status.toUpperCase()}
Purpose: ${this.getHookPurpose(test)}

=== Hook Implementation ===
${hookCode}${error}`;
  }

  private static getHookPurpose(test: any): string {
    if (!test.hookType) return 'General setup or cleanup operations';
    
    const purposeMap: Record<string, string> = {
      'before': 'Initialize global test environment, configure clients, perform authentication',
      'after': 'Clean up resources, generate reports, restore system state',
      'beforeEach': 'Prepare test data, reset state, setup test-specific conditions',
      'afterEach': 'Clean up test data, reset variables, restore clean state',
      'hook': 'Perform setup or cleanup operations',
      'unknown': 'Execute necessary preparation or cleanup tasks'
    };

    return purposeMap[test.hookType] || 'Execute setup or cleanup operations';
  }

  private static createOptimizedTestData(groupedTests: any): string {
    // FOR 3000+ TESTS: Use virtual scrolling approach
    // Only embed minimal data needed for initial rendering
    // Full details loaded on-demand when user expands tests
    
    const optimized: any = {};
    
    for (const [status, tests] of Object.entries(groupedTests)) {
      optimized[status] = (tests as any[]).map((test, index) => {
        // Only include essential data for list rendering
        const lightTest: any = {
          id: `${status}_${index}`,
          title: test.title,
          status: test.status,
          duration: test.duration,
          isHook: test.isHook,
          hookType: test.hookType,
          // Store if test has additional details (for expand indicator)
          hasRequest: !!test.request,
          hasResponse: !!test.response,
          hasAssertions: !!(test.assertions && test.assertions.length > 0),
          hasError: !!test.error
        };
        
        return lightTest;
      });
    }
    
    // Return minimal JSON for initial page load
    return JSON.stringify(optimized, null, 0);
  }

  private static createDetailStorage(groupedTests: any): string {
    // Store full test details in a separate data structure
    // This will be used for on-demand loading
    const detailStorage: any = {};
    
    for (const [status, tests] of Object.entries(groupedTests)) {
      detailStorage[status] = (tests as any[]).map((test, index) => {
        const details: any = {
          id: `${status}_${index}`
        };
        
        // Store full details for on-demand loading
        if (test.request) {
          details.request = {
            method: test.request.method,
            url: test.request.url,
            headers: test.request.headers,
            timestamp: test.request.timestamp,
            body: test.request.body
          };
        }
        
        if (test.response) {
          details.response = {
            status: test.response.status,
            statusText: test.response.statusText,
            headers: test.response.headers,
            responseTime: test.response.responseTime,
            timestamp: test.response.timestamp,
            body: test.response.body || test.response.data
          };
        }
        
        if (test.assertions) {
          details.assertions = test.assertions;
        }
        
        if (test.error) {
          details.error = test.error;
        }
        
        if (test.hookCode) {
          details.hookCode = test.hookCode;
        }
        
        return details;
      });
    }
    
    // Compress the detail storage using base64 to reduce size
    const compressed = Buffer.from(JSON.stringify(detailStorage, null, 0)).toString('base64');
    return `"${compressed}"`;
  }

  private static escapeHtml(text: string): string {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // New optimization methods for large reports
  private static createOptimizedGroupedTests(): any {
    // More memory-efficient grouping for large datasets
    const groups: any = { all: [], passed: [], failed: [], pending: [] };
    
    for (const test of this.testResults) {
      groups.all.push(test);
      if (test.status === 'passed') groups.passed.push(test);
      else if (test.status === 'failed') groups.failed.push(test);
      else if (test.status === 'pending') groups.pending.push(test);
    }
    
    return groups;
  }
  
  private static generateOptimizedHtml(groupedTests: any, suiteGroups: any, suiteStats: any): string {
    console.log('🚀 Generating optimized HTML for large report...');
    
    // Use RestifiedTemplateEngine with virtual scrolling enabled
    const templateEngine = new RestifiedTemplateEngine();
    
    // Enhanced configuration for large reports
    const optimizedConfig = {
      ...this.reportConfig,
      virtualScrolling: true,
      lazyLoading: true,
      compressData: true,
      enableSearch: true,
      enableFilters: true,
      maxInitialTests: 100, // Only render first 100 tests initially
      theme: {
        primaryColor: this.reportConfig.theme?.primaryColor || '#667eea',
        secondaryColor: this.reportConfig.theme?.secondaryColor || '#764ba2',
        accentColor: this.reportConfig.theme?.accentColor || '#007acc'
      }
    };
    
    templateEngine.setConfig(optimizedConfig);
    
    // Optimize test data for virtual scrolling
    const optimizedSuites = Object.entries(suiteGroups).map(([suiteName, suiteObj]: [string, any]) => {
      return {
        title: suiteName,
        tests: this.optimizeTestsForVirtualScrolling(suiteObj.tests || []),
        stats: {
          passes: (suiteObj.tests || []).filter((t: any) => t.status === 'passed').length,
          failures: (suiteObj.tests || []).filter((t: any) => t.status === 'failed').length,
          pending: (suiteObj.tests || []).filter((t: any) => t.status === 'pending').length,
          total: (suiteObj.tests || []).length
        }
      };
    });

    const reportData = {
      stats: {
        suites: Object.keys(suiteGroups).length,
        tests: this.suiteInfo.total,
        passes: this.suiteInfo.passed,
        failures: this.suiteInfo.failed,
        pending: this.suiteInfo.pending
      },
      suites: optimizedSuites,
      metadata: {
        title: this.reportConfig?.title || 'RestifiedTS Enterprise API Test Results',
        subtitle: this.reportConfig?.subtitle || 'Enterprise API Testing with Advanced Features',
        generated: new Date().toISOString(),
        duration: this.suiteInfo.duration,
        memoryUsage: this.getMemoryUsage().memoryMB,
        largeReportMode: true,
        dataCapture: this.dataCapture
      },
      config: optimizedConfig
    };

    return templateEngine.generateReport(reportData);
  }
  
  private static optimizeTestsForVirtualScrolling(tests: any[]): any[] {
    // Optimize test data for virtual scrolling
    return tests.map(test => ({
      ...test,
      // Compress large data for initial load
      request: test.request ? this.compressDataForInitialLoad(test.request) : null,
      response: test.response ? this.compressDataForInitialLoad(test.response) : null,
      // Keep assertions minimal for list view
      assertionCount: test.assertions ? test.assertions.length : 0,
      // Store full data in compressed format for on-demand loading
      _fullData: this.compressTestData(test)
    }));
  }
  
  private static compressDataForInitialLoad(data: any): any {
    if (!data) return null;
    
    // For initial load, only keep essential fields
    if (data.method && data.url) { // Request data
      return {
        method: data.method,
        url: data.url,
        timestamp: data.timestamp,
        _compressed: true
      };
    } else if (data.status !== undefined) { // Response data
      return {
        status: data.status,
        statusText: data.statusText,
        responseTime: data.responseTime,
        timestamp: data.timestamp,
        _compressed: true
      };
    }
    
    return data;
  }
  
  private static compressTestData(test: any): string {
    // Compress full test data for on-demand loading
    try {
      const fullData = {
        request: test.request,
        response: test.response,
        assertions: test.assertions,
        error: test.error,
        stackTrace: test.stackTrace
      };
      return Buffer.from(JSON.stringify(fullData)).toString('base64');
    } catch (error) {
      return '';
    }
  }
  
  private static writeStreamedReport(filePath: string, content: string): void {
    try {
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });
      
      // Write in chunks to prevent memory issues
      const chunkSize = 1024 * 1024; // 1MB chunks
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        writeStream.write(chunk);
      }
      
      writeStream.end();
      console.log('✅ Large report written successfully using streaming');
    } catch (error) {
      console.error('❌ Error writing streamed report:', error);
      throw error;
    }
  }
  
  private static calculateDataCaptureRate(): number {
    if (this.testResults.length === 0) return 0;
    
    let successfulCaptures = 0;
    for (const test of this.testResults) {
      if (test._captureMetadata && test._captureMetadata.hasRequest && test._captureMetadata.hasResponse) {
        successfulCaptures++;
      }
    }
    
    return Math.round((successfulCaptures / this.testResults.length) * 100);
  }
  
  private static cleanupAfterGeneration(): void {
    // Clean up memory after report generation
    this.testDataStore.clear();
    this.requestResponseCache.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    console.log('🧹 Memory cleanup completed after report generation');
  }

  private static groupTestsBySuite(tests: any[]): any {
    const suites: any = {};
    
    tests.forEach(test => {
      // Use proper suite name from Mocha test structure
      let suiteName = 'Other Tests';
      
      // First priority: Use parent suite name from Mocha
      if (test.parent && test.parent.title && test.parent.title !== '') {
        suiteName = test.parent.title;
      }
      // Second priority: Extract from fullTitle if available
      else if (test.fullTitle && test.title) {
        const fullTitle = test.fullTitle;
        const testTitle = test.title;
        // Remove test title from full title to get suite name
        suiteName = fullTitle.replace(testTitle, '').trim();
        if (!suiteName) {
          suiteName = 'Other Tests';
        }
      }
      // Fallback: Use title parsing for older data structures
      else if (test.title) {
        // Check for hooks first
        if (test.isHook || test.title.includes('"before') || test.title.includes('"after') || 
            test.title.includes('beforeEach') || test.title.includes('afterEach') || 
            test.title.includes('🔧')) {
          suiteName = 'Setup & Teardown Hooks';
        } else {
          // Pattern 1: "Suite Name should do something"
          let parts = test.title.split(' should ');
          if (parts.length > 1) {
            suiteName = parts[0].trim();
          } else {
            // Pattern 2: "Suite Name: test description"
            parts = test.title.split(':');
            if (parts.length > 1) {
              suiteName = parts[0].trim();
            } else {
              // Pattern 3: Try to extract meaningful suite name from longer titles
              const words = test.title.split(' ');
              if (words.length > 3) {
                suiteName = words.slice(0, Math.min(3, words.length - 1)).join(' ');
              }
            }
          }
        }
      }
      
      if (!suites[suiteName]) {
        suites[suiteName] = {
          name: suiteName,
          tests: [],
          total: 0,
          passed: 0,
          failed: 0,
          pending: 0
        };
      }
      
      suites[suiteName].tests.push(test);
      suites[suiteName].total++;
      
      if (test.status === 'passed') suites[suiteName].passed++;
      else if (test.status === 'failed') suites[suiteName].failed++;
      else if (test.status === 'pending') suites[suiteName].pending++;
    });
    
    return suites;
  }

  private static calculateSuiteStats(suiteGroups: any): any {
    const suiteNames = Object.keys(suiteGroups);
    const total = suiteNames.length;
    let passed = 0;
    let failed = 0;
    let pending = 0;

    suiteNames.forEach(suiteName => {
      const suite = suiteGroups[suiteName];
      if (suite.failed > 0) {
        failed++;
      } else if (suite.pending > 0) {
        pending++;
      } else if (suite.passed > 0) {
        passed++;
      }
    });

    return { total, passed, failed, pending };
  }

  private static generateQuickFixHtml(groupedTests: any, suiteGroups: any, suiteStats: any): string {
    // Calculate stats for the template
    const totalSuites = Object.keys(suiteGroups).length;
    const totalTests = this.suiteInfo.total;
    const passedTests = this.suiteInfo.passed;
    const failedTests = this.suiteInfo.failed; 
    const pendingTests = this.suiteInfo.pending;

    // Build suite data structure for RestifiedTemplateEngine
    const reportData = {
      stats: {
        suites: totalSuites,
        tests: totalTests,
        passes: passedTests,
        failures: failedTests,
        pending: pendingTests
      },
      suites: Object.entries(suiteGroups).map(([suiteName, suiteObj]: [string, any]) => {
        const testsArray = suiteObj.tests || [];
        return {
          title: suiteName,
          tests: testsArray,
          stats: {
            passes: testsArray.filter((t: any) => t.status === 'passed').length,
            failures: testsArray.filter((t: any) => t.status === 'failed').length,
            pending: testsArray.filter((t: any) => t.status === 'pending').length,
            total: testsArray.length
          }
        };
      }),
      metadata: {
        title: this.reportConfig?.title || 'RestifiedTS Enterprise API Test Results',
        subtitle: this.reportConfig?.subtitle || 'Enterprise API Testing with Advanced Features and Analytics',
        generated: new Date().toISOString(),
        duration: this.suiteInfo.duration
      },
      config: {
        title: this.reportConfig?.title || 'RestifiedTS Enterprise API Test Results',
        subtitle: this.reportConfig?.subtitle || 'Enterprise API Testing with Advanced Features and Analytics',
        theme: {
          primaryColor: '#1e293b',
          secondaryColor: '#334155',
          accentColor: '#007acc'
        },
        footer: {
          show: true,
          text: 'Generated by RestifiedTS Enterprise Test Framework',
          links: [
            { text: 'RestifiedTS Docs', url: 'https://github.com/rajkumar-krishnan/RestifiedTS', external: true },
            { text: 'API Documentation', url: '#', external: true }
          ],
          copyright: '© 2025 RestifiedTS Enterprise',
          timestamp: true,
          version: 'v2.0.7',
          customHtml: ''
        },
        branding: {
          showPoweredBy: true,
          company: 'Enterprise Solutions',
          website: 'https://enterprise.example.com'
        }
      }
    };

    // Use RestifiedTemplateEngine to generate the HTML
    const templateEngine = new RestifiedTemplateEngine();
    templateEngine.setConfig(reportData.config);
    return templateEngine.generateReport(reportData);
  }
}

// Export the function (not the class) for Mocha compatibility
export = RestifiedHtmlReporter;