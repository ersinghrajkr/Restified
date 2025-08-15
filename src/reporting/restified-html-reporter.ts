/**
 * Restified HTML Reporter - Production Ready
 * Generates beautiful HTML reports with guaranteed request/response visibility
 */

import * as fs from 'fs';
import * as path from 'path';

export class RestifiedHtmlReporter {
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
    // Update current suite info if already initialized
    if (this.suiteInfo) {
      this.suiteInfo.title = this.reportConfig.title || 'Restified Test Report';
      this.suiteInfo.subtitle = this.reportConfig.subtitle || '';
    }
  }

  static addTest(test: any): void {
    this.testResults.push(test);
  }

  static generateReport(outputPath?: string): void {
    // Use configured filename if not provided
    const defaultPath = this.reportConfig.filename || 'restified-html-report.html';
    const finalPath = outputPath || `reports/${defaultPath}`;
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
    }
    
    fs.writeFileSync(finalPath, htmlContent, 'utf8');
    console.log(`✅ Restified HTML Report generated: ${finalPath}`);
    console.log(`📊 Performance: ${this.testResults.length} tests, ${Math.round(htmlContent.length / 1024)}KB`);
  }

  private static generateTestItemStatic(test: any, index: number): string {
    const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏳';
    const method = test.request?.method || 'N/A';
    const duration = test.duration ? `${test.duration}ms` : 'N/A';

    return `
        <div class="test-item" data-test="${index}" data-status="${test.status}">
            <div class="test-header">
                <div class="test-title">${this.escapeHtml(test.title)}</div>
                <div class="test-status ${test.status}">${statusIcon} ${test.status.toUpperCase()}</div>
            </div>
            <div class="test-meta">${method} • ${duration}</div>
            
            <div class="test-details">
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
            if (test.title.includes('"before') || test.title.includes('"after') || 
                test.title.includes('beforeEach') || test.title.includes('afterEach')) {
              suiteName = 'Test Hooks';
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
        .test-item { border-bottom: 1px solid #e2e8f0; padding: 20px; transition: background-color 0.2s; }
        .test-item:hover { background: #f7fafc; }
        .test-item:last-child { border-bottom: none; }
        .test-item.hidden { display: none; }
        .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; cursor: pointer; padding: 8px; border-radius: 8px; transition: background-color 0.2s; }
        .test-header:hover { background: rgba(102, 126, 234, 0.1); }
        .test-title { font-weight: bold; font-size: 1.1em; }
        .test-status { font-weight: bold; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }
        .test-status.passed { background: #c6f6d5; color: #22543d; }
        .test-status.failed { background: #fed7d7; color: #742a2a; }
        .test-status.pending { background: #feebc8; color: #7b341e; }
        .test-meta { color: #718096; font-size: 0.9em; }
        .test-details { margin-top: 15px; display: none; }
        .test-item.expanded .test-details { display: block; }
        .detail-section { margin: 15px 0; }
        .detail-section h4 { background: #edf2f7; padding: 10px; margin: 0 0 10px 0; border-radius: 5px; cursor: pointer; user-select: none; }
        .detail-section h4:hover { background: #e2e8f0; }
        .detail-content { background: #f7fafc; padding: 15px; border-radius: 5px; display: none; max-height: 400px; overflow: auto; }
        .detail-section.expanded .detail-content { display: block; }
        .json-view { font-family: 'Courier New', monospace; font-size: 0.9em; white-space: pre-wrap; word-break: break-all; }
        
        .status-counter { background: #edf2f7; padding: 10px 20px; border-radius: 25px; margin-bottom: 20px; text-align: center; font-weight: 500; }
    </style>
</head>
<body>
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
    
    <script>
        // Embed test data directly in the page
        const testData = ${JSON.stringify(groupedTests)};
        const suiteData = ${JSON.stringify(suiteGroups)};
        
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
        
        function renderTests(tests) {
            testContainer.innerHTML = tests.map((test, index) => createTestHTML(test, index)).join('');
            // Attach expand listeners to newly rendered tests
            setTimeout(attachExpandListeners, 100);
        }
        
        function createTestHTML(test, index) {
            const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏳';
            const method = test.request?.method || 'N/A';
            const duration = test.duration ? test.duration + 'ms' : 'N/A';
            
            return \`
                <div class="test-item" data-test="\${index}" data-status="\${test.status}">
                    <div class="test-header">
                        <div class="test-title">\${escapeHtml(test.title)}</div>
                        <div class="test-status \${test.status}">\${statusIcon} \${test.status.toUpperCase()}</div>
                    </div>
                    <div class="test-meta">\${method} • \${duration}</div>
                    
                    <div class="test-details">
                        \${test.request ? \`
                        <div class="detail-section">
                            <h4 onclick="toggleDetail(this); event.stopPropagation();">📤 Request</h4>
                            <div class="detail-content">
                                <div class="json-view">\${formatRequest(test.request)}</div>
                            </div>
                        </div>
                        \` : ''}
                        
                        \${test.response ? \`
                        <div class="detail-section">
                            <h4 onclick="toggleDetail(this); event.stopPropagation();">📥 Response</h4>
                            <div class="detail-content">
                                <div class="json-view">\${formatResponse(test.response)}</div>
                            </div>
                        </div>
                        \` : ''}
                        
                        \${test.assertions && test.assertions.length > 0 ? \`
                        <div class="detail-section">
                            <h4 onclick="toggleDetail(this); event.stopPropagation();">🔍 Assertions</h4>
                            <div class="detail-content">
                                <div class="json-view">\${JSON.stringify(test.assertions, null, 2)}</div>
                            </div>
                        </div>
                        \` : ''}
                        
                        \${test.error ? \`
                        <div class="detail-section">
                            <h4 onclick="toggleDetail(this); event.stopPropagation();">❌ Error</h4>
                            <div class="detail-content">
                                <div class="json-view">\${escapeHtml(test.error)}</div>
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