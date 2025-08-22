/**
 * Restified HTML Reporter - Production Ready
 * Generates beautiful HTML reports with guaranteed request/response visibility
 */

import * as fs from 'fs';
import * as path from 'path';

// Interface for the reporter function with static methods
interface RestifiedHtmlReporterFunction {
  (runner: any, options?: any): void;
  configure: (config: any) => void;
  reset: () => void;
  generateReport: (outputPath?: string) => void;
  addTestResult: (testResult: any) => void;
  getTestResults: () => any[];
}

// Mocha Reporter Function - this is what Mocha expects
const RestifiedHtmlReporter = function(runner: any, options?: any) {
  // Initialize the internal static reporter
  RestifiedHtmlReporterImpl.initialize(runner, options);
} as RestifiedHtmlReporterFunction;

// Add static methods to the function for backwards compatibility
RestifiedHtmlReporter.configure = (config: any) => RestifiedHtmlReporterImpl.configure(config);
RestifiedHtmlReporter.reset = () => RestifiedHtmlReporterImpl.reset();
RestifiedHtmlReporter.generateReport = (outputPath?: string) => RestifiedHtmlReporterImpl.generateReport(outputPath);
RestifiedHtmlReporter.addTestResult = (testResult: any) => RestifiedHtmlReporterImpl.addTestResult(testResult);
RestifiedHtmlReporter.getTestResults = () => RestifiedHtmlReporterImpl.getTestResults();

// Internal implementation as a class
class RestifiedHtmlReporterImpl {
  private static testResults: any[] = [];
  private static reportConfig: any = {};
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

    // Listen to Mocha events
    runner.on('start', () => {
      this.suiteInfo.startTime = new Date();
      console.log('🚀 Starting Restified test execution...');
    });

    runner.on('test', (test: any) => {
      // Store test context
      const currentTest = global.__RESTIFIED_TEST_CONTEXT__;
      if (currentTest) {
        test._restifiedContext = currentTest;
      }
    });

    runner.on('pass', (test: any) => {
      this.suiteInfo.passed++;
      const testResult = this.createTestResult(test, 'passed');
      this.testResults.push(testResult);
    });

    runner.on('fail', (test: any) => {
      this.suiteInfo.failed++;
      const testResult = this.createTestResult(test, 'failed', test.err);
      this.testResults.push(testResult);
    });

    runner.on('pending', (test: any) => {
      this.suiteInfo.pending++;
      const testResult = this.createTestResult(test, 'pending');
      this.testResults.push(testResult);
    });

    runner.on('end', () => {
      this.suiteInfo.endTime = new Date();
      this.suiteInfo.duration = this.suiteInfo.endTime.getTime() - this.suiteInfo.startTime.getTime();
      this.suiteInfo.total = this.testResults.length;

      console.log('📊 Generating Restified HTML Report...');
      this.generateReport();
    });
  }

  private static createTestResult(test: any, status: string, error?: any): any {
    const result: any = {
      title: test.title,
      fullTitle: test.fullTitle(),
      status,
      duration: test.duration,
      isHook: test.type === 'hook',
      hookType: test.type === 'hook' ? (test.title.includes('before') ? 'before' : 'after') : null
    };

    if (error) {
      result.error = error.message || error.stack || error.toString();
    }

    // Get Restified-specific data from test context
    const restifiedData = test._restifiedContext?.responseData || test.responseData;
    if (restifiedData) {
      result.request = restifiedData.request;
      result.response = restifiedData.response;
      result.assertions = restifiedData.assertions;
    }

    // Also check for globally stored response data
    const globalResponseData = (global as any).__RESTIFIED_TEST_RESPONSE_DATA__;
    if (globalResponseData && !result.request) {
      result.request = globalResponseData.request;
      result.response = globalResponseData.response;
      result.assertions = globalResponseData.assertions;
    }

    // Also check for globally stored test context data
    const globalContext = (global as any).__RESTIFIED_TEST_CONTEXT__;
    if (globalContext && globalContext.responseData && !result.request) {
      result.request = globalContext.responseData.request;
      result.response = globalContext.responseData.response;
      result.assertions = globalContext.responseData.assertions;
    }

    return result;
  }

  // Static methods for backward compatibility (direct test result addition)
  static addTestResult(testResult: any): void {
    this.testResults.push(testResult);
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
    console.log(`🚀 Generating Restified HTML Report for ${this.testResults.length} tests...`);
    
    this.suiteInfo.endTime = new Date();
    this.suiteInfo.duration = this.suiteInfo.endTime.getTime() - this.suiteInfo.startTime.getTime();
    this.suiteInfo.total = this.testResults.length;
    this.suiteInfo.passed = this.testResults.filter(t => t.status === 'passed').length;
    this.suiteInfo.failed = this.testResults.filter(t => t.status === 'failed').length;
    this.suiteInfo.pending = this.testResults.filter(t => t.status === 'pending').length;

    // Group tests by status for filtering
    const groupedTests = {
      all: this.testResults,
      passed: this.testResults.filter(t => t.status === 'passed'),
      failed: this.testResults.filter(t => t.status === 'failed'),
      pending: this.testResults.filter(t => t.status === 'pending')
    };

    // Group tests by suite name
    const suiteGroups = this.groupTestsBySuite(this.testResults);

    // Calculate suite-level statistics
    const suiteStats = this.calculateSuiteStats(suiteGroups);

    const htmlContent = this.generateQuickFixHtml(groupedTests, suiteGroups, suiteStats);
    
    // Ensure directory exists
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created report directory: ${dir}`);
    }
    
    fs.writeFileSync(finalPath, htmlContent, 'utf8');
    console.log(`✅ Restified HTML Report generated: ${finalPath}`);
    console.log(`📊 Performance: ${this.testResults.length} tests, ${Math.round(htmlContent.length / 1024)}KB`);
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


  private static groupTestsBySuite(tests: any[]): any {
    const suites: any = {};
    
    tests.forEach(test => {
      // Extract suite name from test title - try multiple patterns
      let suiteName = 'Other Tests';
      if (test.title) {
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
            // Pattern 3: Check for hooks (before, after, beforeEach, afterEach)
            if (test.isHook || test.title.includes('"before') || test.title.includes('"after') || 
                test.title.includes('beforeEach') || test.title.includes('afterEach') || 
                test.title.includes('🔧')) {
              suiteName = 'Setup & Teardown Hooks';
            } else {
              // Pattern 4: Try to extract meaningful suite name from longer titles
              const words = test.title.split(' ');
              if (words.length > 3) {
                // Take first 2-3 words as suite name
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
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restified Test Report - Quick Fix</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; color: #2d3748; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .summary-card h3 { font-size: 2em; margin-bottom: 10px; }
        .summary-card.total h3 { color: #4a5568; }
        .summary-card.passed h3 { color: #48bb78; }
        .summary-card.failed h3 { color: #f56565; }
        .summary-card.pending h3 { color: #ed8936; }
        
        
        .filters { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .filter-tabs { display: flex; border-bottom: 2px solid #e2e8f0; margin-bottom: 15px; }
        .filter-tab { background: none; border: none; padding: 12px 20px; cursor: pointer; font-weight: 500; color: #718096; border-bottom: 2px solid transparent; transition: all 0.3s; }
        .filter-tab:hover { color: #2d3748; }
        .filter-tab.active { color: #667eea; border-bottom-color: #667eea; }
        .filter-content { display: none; }
        .filter-content.active { display: block; }
        .filter-buttons { text-align: center; }
        .filter-btn { background: #e2e8f0; border: none; padding: 12px 24px; margin: 5px; border-radius: 25px; cursor: pointer; font-weight: 500; transition: all 0.3s; }
        .filter-btn:hover { background: #cbd5e0; }
        .filter-btn.active { background: #667eea; color: white; }
        .suite-grid { display: flex; flex-direction: column; gap: 15px; }
        .suite-card { background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 10px; transition: all 0.3s; }
        .suite-card:hover { border-color: #cbd5e0; }
        .suite-card.expanded { border-color: #667eea; background: #ebf4ff; }
        .suite-header { padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .suite-header:hover { background: rgba(102, 126, 234, 0.1); border-radius: 8px; }
        .suite-info { flex: 1; }
        .suite-name { font-weight: 600; font-size: 1.1em; margin-bottom: 8px; color: #2d3748; }
        .suite-stats { font-size: 0.9em; color: #718096; }
        .suite-toggle { font-size: 1.2em; color: #667eea; transition: transform 0.3s; }
        .suite-card.expanded .suite-toggle { transform: rotate(90deg); }
        .suite-tests { display: none; border-top: 1px solid #e2e8f0; background: white; }
        .suite-card.expanded .suite-tests { display: block; }
        
        .test-list { background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .test-list h2 { background: #667eea; color: white; padding: 20px; margin: 0; display: flex; justify-content: space-between; align-items: center; }
        .back-btn { background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 0.9em; transition: background 0.3s; }
        .back-btn:hover { background: rgba(255,255,255,0.3); }
        .test-item { border-bottom: 1px solid #e2e8f0; padding: 12px 16px; transition: background-color 0.2s; }
        .test-item:hover { background: #f7fafc; }
        .test-item:last-child { border-bottom: none; }
        .test-item.hidden { display: none; }
        .test-item.hook-item { border-left: 4px solid #667eea; background: #f8f9ff; }
        .test-item.hook-item .test-title { font-style: italic; color: #667eea; }
        .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; cursor: pointer; padding: 6px; border-radius: 8px; transition: background-color 0.2s; }
        .test-header:hover { background: rgba(102, 126, 234, 0.1); }
        .test-title { font-weight: bold; font-size: 1.1em; }
        .test-status { font-weight: bold; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }
        .test-status.passed { background: #c6f6d5; color: #22543d; }
        .test-status.failed { background: #fed7d7; color: #742a2a; }
        .test-status.pending { background: #feebc8; color: #7b341e; }
        .test-meta { color: #718096; font-size: 0.9em; }
        .test-details { margin-top: 10px; display: none; }
        .test-item.expanded .test-details { display: block; }
        .detail-section { margin: 10px 0; }
        .detail-section h4 { background: #edf2f7; padding: 10px; margin: 0 0 10px 0; border-radius: 5px; cursor: pointer; user-select: none; }
        .detail-section h4:hover { background: #e2e8f0; }
        .detail-content { background: #f7fafc; padding: 15px; border-radius: 5px; display: none; max-height: 400px; overflow: auto; }
        .detail-section.expanded .detail-content { display: block; }
        .json-view { font-family: 'Courier New', monospace; font-size: 0.9em; white-space: pre-wrap; word-break: break-all; }
        .hook-item .json-view { background: #f0f4ff; border: 1px solid #d0d9ff; color: #2d3748; }
        .hook-item .detail-content { background: #f8faff; }
        
        .status-counter { background: #edf2f7; padding: 10px 20px; border-radius: 25px; margin-bottom: 20px; text-align: center; font-weight: 500; }
        
        .footer { background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%); color: white; padding: 40px 20px 20px; margin-top: 50px; border-radius: 10px; }
        .footer-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; }
        .footer-section h4 { color: #90cdf4; margin-bottom: 15px; font-size: 1.1em; }
        .footer-section p { margin-bottom: 8px; color: #cbd5e0; line-height: 1.5; }
        .footer-section a { color: #90cdf4; text-decoration: none; transition: color 0.3s; }
        .footer-section a:hover { color: #63b3ed; }
        .footer-stats { display: flex; gap: 20px; margin-bottom: 15px; }
        .footer-stat { background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 8px; text-align: center; flex: 1; }
        .footer-stat .number { font-size: 1.3em; font-weight: bold; color: #90cdf4; }
        .footer-stat .label { font-size: 0.9em; color: #cbd5e0; }
        .footer-bottom { border-top: 1px solid #4a5568; padding-top: 20px; margin-top: 30px; text-align: center; color: #a0aec0; }
        .footer-links { display: flex; justify-content: center; gap: 20px; margin-bottom: 15px; flex-wrap: wrap; }
        .footer-links a { padding: 5px 10px; border-radius: 5px; transition: background 0.3s; }
        .footer-links a:hover { background: rgba(255,255,255,0.1); }
        .tech-badge { background: rgba(144, 205, 244, 0.2); color: #90cdf4; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; margin: 0 4px; }
        
        /* Performance optimizations for large datasets */
        .loading-placeholder {
            color: #6c757d;
            font-style: italic;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .loading-placeholder:hover {
            background: #e9ecef;
        }
        
        .load-more-button {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed #dee2e6;
        }
        
        .error {
            color: #dc3545;
            background: #f8d7da;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
        }
        
        /* Virtual scroll performance indicator */
        .performance-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 123, 255, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            display: none;
        }
        
        .performance-indicator.show {
            display: block;
        }
    </style>
</head>
<body>
    <div class="performance-indicator" id="performanceIndicator">
        🚀 Virtual Scrolling Active
    </div>
    
    <div class="container">
        <div class="header">
            <h1>🚀 ${this.suiteInfo.title}</h1>
            ${this.suiteInfo.subtitle ? `<p style="font-size: 1.1em; margin-bottom: 10px; opacity: 0.9;">${this.suiteInfo.subtitle}</p>` : ''}
            <p>Generated on ${this.suiteInfo.endTime.toLocaleDateString()} at ${this.suiteInfo.endTime.toLocaleTimeString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>${this.suiteInfo.total}</h3>
                <p>Total Tests (100%)</p>
            </div>
            <div class="summary-card passed">
                <h3>${this.suiteInfo.passed}</h3>
                <p>Passed Tests (${this.suiteInfo.total > 0 ? Math.round((this.suiteInfo.passed / this.suiteInfo.total) * 100) : 0}%)</p>
            </div>
            <div class="summary-card failed">
                <h3>${this.suiteInfo.failed}</h3>
                <p>Failed Tests (${this.suiteInfo.total > 0 ? Math.round((this.suiteInfo.failed / this.suiteInfo.total) * 100) : 0}%)</p>
            </div>
            <div class="summary-card pending">
                <h3>${this.suiteInfo.pending}</h3>
                <p>Pending Tests (${this.suiteInfo.total > 0 ? Math.round((this.suiteInfo.pending / this.suiteInfo.total) * 100) : 0}%)</p>
            </div>
        </div>
        
        <div class="suite-summary">
            <div class="summary">
                <div class="summary-card total">
                    <h3>${suiteStats.total}</h3>
                    <p>Total Suites (100%)</p>
                </div>
                <div class="summary-card passed">
                    <h3>${suiteStats.passed}</h3>
                    <p>Passed Suites (${suiteStats.total > 0 ? Math.round((suiteStats.passed / suiteStats.total) * 100) : 0}%)</p>
                </div>
                <div class="summary-card failed">
                    <h3>${suiteStats.failed}</h3>
                    <p>Failed Suites (${suiteStats.total > 0 ? Math.round((suiteStats.failed / suiteStats.total) * 100) : 0}%)</p>
                </div>
                <div class="summary-card pending">
                    <h3>${suiteStats.pending}</h3>
                    <p>Pending Suites (${suiteStats.total > 0 ? Math.round((suiteStats.pending / suiteStats.total) * 100) : 0}%)</p>
                </div>
            </div>
        </div>
        
        <div class="filters">
            <div class="filter-tabs">
                <button class="filter-tab active" data-tab="status">🔍 By Status</button>
                <button class="filter-tab" data-tab="suite">📂 By Suite</button>
            </div>
            
            <div class="filter-content active" id="statusFilters">
                <div class="filter-buttons">
                    <button class="filter-btn active" data-filter="all">All (${this.suiteInfo.total} - 100%)</button>
                    <button class="filter-btn" data-filter="passed">✅ Passed (${this.suiteInfo.passed} - ${this.suiteInfo.total > 0 ? Math.round((this.suiteInfo.passed / this.suiteInfo.total) * 100) : 0}%)</button>
                    <button class="filter-btn" data-filter="failed">❌ Failed (${this.suiteInfo.failed} - ${this.suiteInfo.total > 0 ? Math.round((this.suiteInfo.failed / this.suiteInfo.total) * 100) : 0}%)</button>
                    <button class="filter-btn" data-filter="pending">⏳ Pending (${this.suiteInfo.pending} - ${this.suiteInfo.total > 0 ? Math.round((this.suiteInfo.pending / this.suiteInfo.total) * 100) : 0}%)</button>
                </div>
            </div>
            
            <div class="filter-content" id="suiteFilters">
                <div class="suite-grid">
                    ${Object.values(suiteGroups).map((suite: any) => `
                        <div class="suite-card" data-suite="${this.escapeHtml(suite.name)}">
                            <div class="suite-header">
                                <div class="suite-info">
                                    <div class="suite-name">${this.escapeHtml(suite.name)}</div>
                                    <div class="suite-stats">
                                        ${suite.total} tests • 
                                        <span style="color: #48bb78">${suite.passed} passed (${suite.total > 0 ? Math.round((suite.passed / suite.total) * 100) : 0}%)</span> • 
                                        <span style="color: #f56565">${suite.failed} failed (${suite.total > 0 ? Math.round((suite.failed / suite.total) * 100) : 0}%)</span>
                                        ${suite.pending > 0 ? ` • <span style="color: #ed8936">${suite.pending} pending (${suite.total > 0 ? Math.round((suite.pending / suite.total) * 100) : 0}%)</span>` : ''}
                                    </div>
                                </div>
                                <div class="suite-toggle">▶</div>
                            </div>
                            <div class="suite-tests">
                                ${suite.tests.map((test: any, index: number) => this.generateTestItemStatic(test, index)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="status-counter" id="statusCounter">
            Showing ${this.suiteInfo.total} of ${this.suiteInfo.total} tests
        </div>
        
        <div class="test-list">
            <h2 id="testListTitle">📋 Test Results</h2>
            <div id="testContainer">
                ${this.testResults.map((test, index) => this.generateTestItemStatic(test, index)).join('')}
            </div>
        </div>
    </div>
    
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-section">
                <h4>📊 Test Execution Summary</h4>
                <div class="footer-stats">
                    <div class="footer-stat">
                        <div class="number">${this.suiteInfo.total}</div>
                        <div class="label">Total Tests</div>
                    </div>
                    <div class="footer-stat">
                        <div class="number">${Math.round(this.suiteInfo.duration / 1000)}s</div>
                        <div class="label">Duration</div>
                    </div>
                    <div class="footer-stat">
                        <div class="number">${this.suiteInfo.total > 0 ? Math.round((this.suiteInfo.passed / this.suiteInfo.total) * 100) : 0}%</div>
                        <div class="label">Success Rate</div>
                    </div>
                </div>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>Generated:</strong> ${this.suiteInfo.endTime.toLocaleString()}</p>
            </div>
            
            <div class="footer-section">
                <h4>🛠️ Testing Framework</h4>
                <p>Powered by <strong>RestifiedTS</strong> v1.0.0</p>
                <p>Modern API testing framework inspired by RestAssured</p>
                <div style="margin-top: 15px;">
                    <span class="tech-badge">TypeScript</span>
                    <span class="tech-badge">Axios</span>
                    <span class="tech-badge">Mocha</span>
                    <span class="tech-badge">HTML Reports</span>
                </div>
            </div>
            
            <div class="footer-section">
                <h4>🔗 Resources & Support</h4>
                <p><a href="https://github.com/restifiedts/restifiedts" target="_blank">📖 Documentation</a></p>
                <p><a href="https://github.com/restifiedts/restifiedts/issues" target="_blank">🐛 Report Issues</a></p>
                <p><a href="https://github.com/restifiedts/restifiedts/examples" target="_blank">📝 Examples</a></p>
                <p><a href="https://npmjs.com/package/restifiedts" target="_blank">📦 NPM Package</a></p>
            </div>
        </div>
        
        <div class="footer-bottom">
            <div class="footer-links">
                <a href="https://github.com/restifiedts/restifiedts" target="_blank">GitHub</a>
                <a href="https://npmjs.com/package/restifiedts" target="_blank">NPM</a>
                <a href="mailto:support@restifiedts.dev">Support</a>
                <a href="https://restifiedts.dev/changelog" target="_blank">Changelog</a>
            </div>
            <p>© ${new Date().getFullYear()} RestifiedTS. Built with ❤️ for modern API testing.</p>
        </div>
    </footer>
    
    <script>
        // Virtual scrolling approach for 3000+ tests
        const testData = ${this.createOptimizedTestData(groupedTests)};
        const detailStorage = ${this.createDetailStorage(groupedTests)};
        const suiteData = ${JSON.stringify(suiteGroups)};
        
        // Performance settings for large datasets  
        const totalTests = Object.values(testData).reduce((total, tests) => total + tests.length, 0);
        const VIRTUAL_SCROLL_ENABLED = totalTests > 100;
        const ITEMS_PER_PAGE = 50; // Render only 50 tests at a time
        
        // Show performance indicator if virtual scrolling is enabled
        const performanceIndicator = document.getElementById('performanceIndicator');
        if (VIRTUAL_SCROLL_ENABLED) {
            performanceIndicator.classList.add('show');
            performanceIndicator.innerHTML = \`🚀 Virtual Scrolling: \${totalTests} tests optimized\`;
        }
        
        // DOM elements
        const filterTabs = document.querySelectorAll('.filter-tab');
        const filterContents = document.querySelectorAll('.filter-content');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const suiteCards = document.querySelectorAll('.suite-card');
        const testContainer = document.getElementById('testContainer');
        const statusCounter = document.getElementById('statusCounter');
        const testListTitle = document.getElementById('testListTitle');
        const backToSuitesBtn = document.getElementById('backToSuitesBtn');
        
        // Track current view
        let currentView = 'status';
        let currentFilter = 'all';
        
        // Tab switching functionality
        filterTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabType = this.dataset.tab;
                
                // Update active tab
                filterTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Show/hide content
                filterContents.forEach(content => content.classList.remove('active'));
                document.getElementById(tabType === 'status' ? 'statusFilters' : 'suiteFilters').classList.add('active');
                
                currentView = tabType;
                
                // Update display based on tab type
                if (tabType === 'status') {
                    // Reset status filters
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    document.querySelector('[data-filter="all"]').classList.add('active');
                    testContainer.style.display = 'block';
                    testListTitle.textContent = '📋 Test Results';
                    renderTests(testData.all);
                    statusCounter.textContent = \`Showing \${testData.all.length} of \${testData.all.length} tests\`;
                } else {
                    // For "By Suite" tab - collapse all suites and hide main test container
                    suiteCards.forEach(card => card.classList.remove('expanded'));
                    testContainer.style.display = 'none';
                    testListTitle.textContent = '📂 Suite Overview';
                    statusCounter.textContent = \`Click on any suite to expand and view its tests\`;
                }
            });
        });
        
        // Suite collapse/expand functionality
        suiteCards.forEach(card => {
            const suiteHeader = card.querySelector('.suite-header');
            suiteHeader.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Toggle expanded state
                card.classList.toggle('expanded');
                
                const suiteName = card.dataset.suite;
                const isExpanded = card.classList.contains('expanded');
                
                if (isExpanded) {
                    statusCounter.textContent = \`Suite "\${suiteName}" expanded - \${suiteData[suiteName].tests.length} tests visible\`;
                    // Attach listeners to newly visible tests in this suite
                    setTimeout(attachExpandListeners, 100);
                } else {
                    statusCounter.textContent = \`Suite "\${suiteName}" collapsed - Click on any suite to expand and view its tests\`;
                }
            });
        });
        
        // Status filter functionality
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                console.log('Filter clicked:', this.dataset.filter);
                const filter = this.dataset.filter;
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Get filtered tests
                const filteredTests = testData[filter] || [];
                
                // Update test display
                renderTests(filteredTests);
                
                // Update counter
                statusCounter.textContent = \`Showing \${filteredTests.length} of \${testData.all.length} tests\`;
                
                console.log('Filtered tests:', filteredTests.length);
            });
        });
        
        // Virtual scrolling state
        let currentPage = 0;
        let currentTests = [];
        let isLoading = false;
        
        function renderTests(tests) {
            currentTests = tests;
            currentPage = 0;
            
            if (VIRTUAL_SCROLL_ENABLED && tests.length > ITEMS_PER_PAGE) {
                renderVirtualTests();
                setupVirtualScrolling();
            } else {
                // Standard rendering for smaller datasets
                testContainer.innerHTML = tests.map((test, index) => createTestHTML(test, index)).join('');
                setTimeout(attachExpandListeners, 100);
            }
        }
        
        function renderVirtualTests() {
            const startIndex = currentPage * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, currentTests.length);
            const visibleTests = currentTests.slice(startIndex, endIndex);
            
            const html = visibleTests.map((test, index) => createTestHTML(test, startIndex + index)).join('');
            
            if (currentPage === 0) {
                testContainer.innerHTML = html;
            } else {
                testContainer.innerHTML += html;
            }
            
            setTimeout(attachExpandListeners, 100);
        }
        
        function setupVirtualScrolling() {
            const loadMoreButton = document.createElement('div');
            loadMoreButton.className = 'load-more-button';
            loadMoreButton.innerHTML = \`
                <button onclick="loadMoreTests()" style="
                    padding: 12px 24px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin: 20px auto;
                    display: block;
                ">
                    Load More Tests (\${currentTests.length - (currentPage + 1) * ITEMS_PER_PAGE} remaining)
                </button>
            \`;
            
            if ((currentPage + 1) * ITEMS_PER_PAGE < currentTests.length) {
                testContainer.appendChild(loadMoreButton);
            }
        }
        
        function loadMoreTests() {
            if (isLoading) return;
            isLoading = true;
            
            // Remove existing load more button
            const existingButton = testContainer.querySelector('.load-more-button');
            if (existingButton) existingButton.remove();
            
            currentPage++;
            renderVirtualTests();
            
            isLoading = false;
        }
        
        // Make functions globally available
        window.loadMoreTests = loadMoreTests;
        
        // Detail storage cache and loader
        let detailCache = {};
        let parsedDetailStorage = null;
        
        function getDetailStorage() {
            if (!parsedDetailStorage) {
                try {
                    const decompressed = atob(detailStorage);
                    parsedDetailStorage = JSON.parse(decompressed);
                } catch (e) {
                    console.error('Failed to parse detail storage:', e);
                    parsedDetailStorage = {};
                }
            }
            return parsedDetailStorage;
        }
        
        function loadAndToggleDetail(element, testId, detailType) {
            const detailContent = element.nextElementSibling.querySelector('.loading-placeholder') || element.nextElementSibling;
            
            // Check if already loaded
            const cacheKey = \`\${testId}_\${detailType}\`;
            if (detailCache[cacheKey]) {
                detailContent.innerHTML = detailCache[cacheKey];
                toggleDetail(element);
                return;
            }
            
            // Show loading state
            if (detailContent.classList.contains('loading-placeholder')) {
                detailContent.innerHTML = '⏳ Loading...';
            }
            
            // Load detail from storage
            try {
                const storage = getDetailStorage();
                const [status, index] = testId.split('_');
                const testDetails = storage[status] && storage[status][parseInt(index)];
                
                if (testDetails) {
                    let content = '';
                    
                    switch (detailType) {
                        case 'request':
                            content = \`<div class="json-view">\${formatRequest(testDetails.request)}</div>\`;
                            break;
                        case 'response':
                            content = \`<div class="json-view">\${formatResponse(testDetails.response)}</div>\`;
                            break;
                        case 'assertions':
                            content = \`<div class="json-view">\${JSON.stringify(testDetails.assertions, null, 2)}</div>\`;
                            break;
                        case 'error':
                            content = \`<div class="json-view">\${escapeHtml(testDetails.error)}</div>\`;
                            break;
                        case 'hook':
                            content = \`<div class="json-view">\${formatHookDetails(testDetails)}</div>\`;
                            break;
                    }
                    
                    detailCache[cacheKey] = content;
                    detailContent.innerHTML = content;
                    detailContent.classList.remove('loading-placeholder');
                } else {
                    detailContent.innerHTML = '<div class="error">❌ Details not found</div>';
                }
            } catch (e) {
                console.error('Error loading detail:', e);
                detailContent.innerHTML = '<div class="error">❌ Error loading details</div>';
            }
            
            toggleDetail(element);
        }
        
        // Make loadAndToggleDetail globally available
        window.loadAndToggleDetail = loadAndToggleDetail;
        
        function createTestHTML(test, index) {
            const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏳';
            const method = test.isHook ? 'HOOK' : 'API';
            const duration = test.duration ? test.duration + 'ms' : 'N/A';
            
            return \`
                <div class="test-item \${test.isHook ? 'hook-item' : ''}" data-test="\${index}" data-test-id="\${test.id}" data-status="\${test.status}">
                    <div class="test-header">
                        <div class="test-title">\${escapeHtml(test.title)}</div>
                        <div class="test-status \${test.status}">\${statusIcon} \${test.status.toUpperCase()}</div>
                    </div>
                    <div class="test-meta">\${method} • \${duration}</div>
                    
                    <div class="test-details" id="details-\${test.id}">
                        \${test.isHook && test.hasRequest ? \`
                        <div class="detail-section">
                            <h4 onclick="loadAndToggleDetail(this, '\${test.id}', 'hook'); event.stopPropagation();">🔧 Hook Details</h4>
                            <div class="detail-content">
                                <div class="loading-placeholder">Click to load hook details...</div>
                            </div>
                        </div>
                        \` : ''}
                        
                        \${test.hasRequest ? \`
                        <div class="detail-section">
                            <h4 onclick="loadAndToggleDetail(this, '\${test.id}', 'request'); event.stopPropagation();">📤 Request</h4>
                            <div class="detail-content">
                                <div class="loading-placeholder">Click to load request details...</div>
                            </div>
                        </div>
                        \` : ''}
                        
                        \${test.hasResponse ? \`
                        <div class="detail-section">
                            <h4 onclick="loadAndToggleDetail(this, '\${test.id}', 'response'); event.stopPropagation();">📥 Response</h4>
                            <div class="detail-content">
                                <div class="loading-placeholder">Click to load response details...</div>
                            </div>
                        </div>
                        \` : ''}
                        
                        \${test.hasAssertions ? \`
                        <div class="detail-section">
                            <h4 onclick="loadAndToggleDetail(this, '\${test.id}', 'assertions'); event.stopPropagation();">🔍 Assertions</h4>
                            <div class="detail-content">
                                <div class="loading-placeholder">Click to load assertion details...</div>
                            </div>
                        </div>
                        \` : ''}
                        
                        \${test.hasError ? \`
                        <div class="detail-section">
                            <h4 onclick="loadAndToggleDetail(this, '\${test.id}', 'error'); event.stopPropagation();">❌ Error</h4>
                            <div class="detail-content">
                                <div class="loading-placeholder">Click to load error details...</div>
                            </div>
                        </div>
                        \` : ''}
                    </div>
                </div>
            \`;
        }
        
        function toggleTest(index) {
            const item = document.querySelector(\`[data-test="\${index}"]\`);
            if (item) {
                item.classList.toggle('expanded');
            }
        }
        
        // Make tests expandable in both main container and suite cards
        function attachExpandListeners() {
            // Main container tests
            const testItems = document.querySelectorAll('#testContainer .test-item');
            testItems.forEach(item => {
                const testHeader = item.querySelector('.test-header');
                if (testHeader && !testHeader.hasAttribute('data-listener-attached')) {
                    testHeader.addEventListener('click', function(e) {
                        e.stopPropagation();
                        item.classList.toggle('expanded');
                    });
                    testHeader.setAttribute('data-listener-attached', 'true');
                }
            });
            
            // Suite card tests
            const suiteTestItems = document.querySelectorAll('.suite-tests .test-item');
            suiteTestItems.forEach(item => {
                const testHeader = item.querySelector('.test-header');
                if (testHeader && !testHeader.hasAttribute('data-listener-attached')) {
                    testHeader.addEventListener('click', function(e) {
                        e.stopPropagation();
                        item.classList.toggle('expanded');
                    });
                    testHeader.setAttribute('data-listener-attached', 'true');
                }
            });
        }
        
        function toggleDetail(element) {
            element.parentElement.classList.toggle('expanded');
        }
        
        function formatRequest(request) {
            const obj = {
                method: request.method,
                url: request.url,
                headers: request.headers,
                timestamp: request.timestamp
            };
            if (request.body) obj.body = request.body;
            return JSON.stringify(obj, null, 2);
        }
        
        function formatResponse(response) {
            const obj = {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                responseTime: response.responseTime + 'ms',
                timestamp: response.timestamp,
                body: response.body || response.data
            };
            return JSON.stringify(obj, null, 2);
        }
        
        function formatHookDetails(test) {
            const hookTypeMap = {
                'before': 'Global Setup (before all tests)',
                'after': 'Global Cleanup (after all tests)',
                'beforeEach': 'Test Setup (before each test)',
                'afterEach': 'Test Cleanup (after each test)',
                'hook': 'Setup/Teardown Hook',
                'unknown': 'Setup/Teardown Hook'
            };

            const purposeMap = {
                'before': 'Initialize global test environment, configure clients, perform authentication',
                'after': 'Clean up resources, generate reports, restore system state',
                'beforeEach': 'Prepare test data, reset state, setup test-specific conditions',
                'afterEach': 'Clean up test data, reset variables, restore clean state',
                'hook': 'Perform setup or cleanup operations',
                'unknown': 'Execute necessary preparation or cleanup tasks'
            };

            const hookType = hookTypeMap[test.hookType || 'unknown'] || 'Setup/Teardown Hook';
            const duration = test.duration ? test.duration + 'ms' : '0ms';
            const status = (test.status || 'passed').toUpperCase();
            const purpose = purposeMap[test.hookType || 'unknown'] || 'Execute setup or cleanup operations';
            const hookCode = test.hookCode || 'Code not available';
            const error = test.error ? '\\nError: ' + test.error : '';
            
            return 'Hook Type: ' + hookType + '\\n' +
                   'Execution Time: ' + duration + '\\n' +
                   'Status: ' + status + '\\n' +
                   'Purpose: ' + purpose + '\\n\\n' +
                   '=== Hook Implementation ===' + '\\n' +
                   hookCode + error;
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Back to suite list functionality - not needed with collapsible approach
        function backToSuiteList() {
            // This function is not needed anymore with the new collapsible approach
            // but keeping it for compatibility
        }
        
        console.log('Restified Report loaded with', testData.all.length, 'tests');
        console.log('Filter buttons found:', filterButtons.length);
        
        // Initialize expand listeners for initial test display
        attachExpandListeners();
    </script>
</body>
</html>`;
  }
}

// Export the function (not the class) for Mocha compatibility
export { RestifiedHtmlReporter };