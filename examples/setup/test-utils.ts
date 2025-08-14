/**
 * Test Utilities for Examples
 * 
 * This file contains utility functions that can be safely imported
 * by test files without triggering Mocha hooks.
 */

import { restified } from '../../src';

// Global test metrics interface
interface TestMetrics {
  startTime: Date;
  endTime?: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  suiteExecutions: { name: string; duration: number; status: string }[];
}

const globalTestMetrics: TestMetrics = {
  startTime: new Date(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  suiteExecutions: []
};

// Export utilities that examples can use
export const GlobalTestUtils = {
  // Helper to log test progress with enhanced formatting
  logTestProgress(suiteName: string, testName: string, status: 'start' | 'success' | 'failed' | 'skipped' = 'start') {
    if (restified.getVariable('enableLogging')) {
      const statusEmoji = {
        start: '📝',
        success: '✅',
        failed: '❌',
        skipped: '⏭️'
      };
      console.log(`${statusEmoji[status]} [${suiteName}] ${testName}`);
      
      // Track metrics for reporting
      if (status !== 'start') {
        globalTestMetrics.totalTests++;
        if (status === 'success') globalTestMetrics.passedTests++;
        if (status === 'failed') globalTestMetrics.failedTests++;
        if (status === 'skipped') globalTestMetrics.skippedTests++;
      }
    }
  },

  // Helper to check if integration tests should run
  shouldRunIntegrationTests(): boolean {
    return restified.getVariable('runIntegrationTests') === true;
  },

  // Helper to get authenticated API client with auth header
  async makeAuthenticatedRequest(client: string = 'api') {
    return restified
      .given()
        .useClient(client)
        .headers({
          'Authorization': `Bearer ${restified.getVariable('globalAuthToken')}`
        });
  },

  // Helper to add custom headers (for overriding or adding to global headers)
  getCustomHeaders(additionalHeaders: Record<string, string> = {}) {
    return additionalHeaders;
  },

  // Helper to capture test execution context for reports
  captureTestContext(suiteName: string, testName: string) {
    return {
      suite: suiteName,
      test: testName,
      timestamp: new Date().toISOString(),
      environment: restified.getVariable('testEnvironment'),
      authToken: restified.getVariable('globalAuthToken') ? '***REDACTED***' : null,
      globalUser: restified.getVariable('globalUserEmail'),
      executionId: `${suiteName}-${testName}-${Date.now()}`
    };
  },

  // Helper to get comprehensive environment info for reports
  getEnvironmentInfo() {
    return {
      framework: 'Restified v1.0.0',
      environment: restified.getVariable('testEnvironment'),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
      clients: {
        api: 'https://jsonplaceholder.typicode.com',
        testUtils: 'https://httpbin.org',
        auth: 'https://jsonplaceholder.typicode.com'
      },
      authentication: {
        status: restified.getVariable('globalAuthToken') ? 'authenticated' : 'not authenticated',
        user: restified.getVariable('globalUserEmail') || 'unknown'
      }
    };
  },

  // Helper to add request/response data to test context (for Mochawesome)
  addToTestContext(testContext: any, data: any) {
    if (testContext && typeof testContext.addContext === 'function') {
      testContext.addContext(data);
    }
  },

  // Helper to format duration for reports
  formatDuration(startTime: Date, endTime: Date = new Date()) {
    const duration = endTime.getTime() - startTime.getTime();
    return {
      milliseconds: duration,
      seconds: (duration / 1000).toFixed(2),
      formatted: `${(duration / 1000).toFixed(2)}s`
    };
  }
};