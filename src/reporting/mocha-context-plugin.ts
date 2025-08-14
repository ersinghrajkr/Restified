/**
 * Mocha Context Plugin for RestifiedTS
 * 
 * This plugin captures the current test context and makes it available
 * to RestifiedTS for adding request/response data to Mochawesome reports.
 */

let currentTestContext: any = null;

// Export function to get current test context
export function getCurrentTestContext(): any {
  return currentTestContext;
}

// Mocha hook to capture test context
export function mochaContextPlugin() {
  // Before each test, capture the context
  beforeEach(function() {
    currentTestContext = this;
    // Store globally for access from RestifiedTS
    (global as any).__RESTIFIED_TEST_CONTEXT__ = this;
  });

  // After each test, clear the context
  afterEach(function() {
    currentTestContext = null;
    (global as any).__RESTIFIED_TEST_CONTEXT__ = null;
  });
}

// Auto-initialize if this file is required
if (typeof beforeEach === 'function') {
  mochaContextPlugin();
}