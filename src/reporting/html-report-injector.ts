/**
 * HTML Report Injector for Restified
 * 
 * This module injects the enhanced Request/Response viewer into
 * generated Mochawesome HTML reports.
 */

import * as fs from 'fs';
import * as path from 'path';

export class HtmlReportInjector {
  private static readonly INJECTION_MARKER = '</body>';
  private static readonly SCRIPT_TAG_START = '<script type="text/javascript">';
  private static readonly SCRIPT_TAG_END = '</script>';

  /**
   * Inject enhancement script into the HTML report
   */
  public static async injectEnhancements(reportPath: string): Promise<void> {
    try {
      if (!fs.existsSync(reportPath)) {
        console.warn(`⚠️  HTML report not found: ${reportPath}`);
        return;
      }

      const htmlContent = fs.readFileSync(reportPath, 'utf8');
      const enhancementScript = await this.generateEnhancementScript();
      
      const injectedContent = this.injectScript(htmlContent, enhancementScript);
      
      fs.writeFileSync(reportPath, injectedContent, 'utf8');
      console.log(`✅ Enhanced HTML report with Request/Response viewer: ${reportPath}`);

    } catch (error) {
      console.error('❌ Failed to inject enhancements into HTML report:', error);
    }
  }

  /**
   * Generate the complete enhancement script
   */
  private static async generateEnhancementScript(): Promise<string> {
    // Read the TypeScript enhancer (it will be compiled to JS)
    const enhancerJsPath = path.join(__dirname, '..', '..', 'dist', 'src', 'reporting', 'mochawesome-enhancer.js');
    
    let enhancerScript = '';
    if (fs.existsSync(enhancerJsPath)) {
      enhancerScript = fs.readFileSync(enhancerJsPath, 'utf8');
    } else {
      // Fallback to inline script if compiled version not found
      enhancerScript = this.getInlineEnhancementScript();
    }

    return `
${this.SCRIPT_TAG_START}
// Restified HTML Report Enhancer
console.log("🚀 Restified: Initializing HTML report enhancements...");

${enhancerScript}

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
  console.log("✅ Restified: HTML report enhancements loaded successfully!");
});
${this.SCRIPT_TAG_END}
    `.trim();
  }

  /**
   * Inject script into HTML content
   */
  private static injectScript(htmlContent: string, script: string): string {
    const injectionIndex = htmlContent.lastIndexOf(this.INJECTION_MARKER);
    
    if (injectionIndex === -1) {
      console.warn('⚠️  Could not find injection point in HTML report');
      return htmlContent;
    }

    return (
      htmlContent.substring(0, injectionIndex) +
      '\n' + script + '\n' +
      htmlContent.substring(injectionIndex)
    );
  }

  /**
   * Inline enhancement script as fallback
   */
  private static getInlineEnhancementScript(): string {
    return `
// Inline Restified Enhancement Script
(function() {
  'use strict';

  // Enhanced styles
  const enhancedStyles = \`
    <style id="restified-enhancements">
      .restified-request-response {
        margin: 15px 0;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        background: #f8f9fa;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .restified-section-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        border-radius: 8px 8px 0 0;
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.3s ease;
      }

      .restified-section-header:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }

      .restified-section-header.request {
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      }

      .restified-section-header.response {
        background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
      }

      .restified-toggle-icon {
        font-size: 16px;
        transition: transform 0.3s ease;
        font-weight: bold;
      }

      .restified-toggle-icon.expanded {
        transform: rotate(90deg);
      }

      .restified-section-content {
        padding: 0;
        overflow: hidden;
        transition: all 0.3s ease;
        background: white;
        border-radius: 0 0 8px 8px;
      }

      .restified-section-content.collapsed {
        max-height: 0;
        padding: 0 16px;
      }

      .restified-section-content.expanded {
        max-height: 1000px;
        padding: 16px;
      }

      .restified-data-section {
        margin-bottom: 16px;
      }

      .restified-data-label {
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 8px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .restified-data-content {
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 12px;
        font-size: 12px;
        line-height: 1.5;
        max-height: 300px;
        overflow-y: auto;
        position: relative;
      }

      .restified-data-content pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        color: #2d3748;
      }

      .restified-copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 10px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .restified-data-content:hover .restified-copy-btn {
        opacity: 1;
      }

      .restified-method-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: white;
        margin-left: 8px;
      }

      .restified-method-badge.GET { background: #48bb78; }
      .restified-method-badge.POST { background: #ed8936; }
      .restified-method-badge.PUT { background: #4299e1; }
      .restified-method-badge.PATCH { background: #9f7aea; }
      .restified-method-badge.DELETE { background: #f56565; }

      .restified-status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        color: white;
        margin-left: 8px;
      }

      .restified-status-badge.success { background: #48bb78; }
      .restified-status-badge.error { background: #f56565; }
      .restified-status-badge.redirect { background: #ed8936; }

      .restified-timing {
        color: #718096;
        font-size: 11px;
        font-weight: normal;
      }
    </style>
  \`;

  // Initialize enhancement
  function init() {
    document.head.insertAdjacentHTML('beforeend', enhancedStyles);
    enhanceRestifiedContext();
    setupContentObserver();
    setupGlobalFunctions();
  }

  // Enhance Restified context data
  function enhanceRestifiedContext() {
    const testItems = document.querySelectorAll('[data-test]');
    
    testItems.forEach(function(testItem) {
      const contextEl = testItem.querySelector('.test-context');
      if (!contextEl) return;

      try {
        const contextText = contextEl.textContent || '';
        
        if (contextText.includes('Restified Request/Response Details')) {
          enhanceTestContext(contextEl);
        }
      } catch (error) {
        console.warn('Error enhancing Restified context:', error);
      }
    });
  }

  // Enhance individual test context
  function enhanceTestContext(contextEl) {
    try {
      const contextData = JSON.parse(contextEl.textContent);
      
      let restifiedData = null;
      if (Array.isArray(contextData)) {
        restifiedData = contextData.find(function(item) {
          return item.title && item.title.includes('Restified Request/Response Details');
        });
      }

      if (!restifiedData || !restifiedData.value) return;

      const request = restifiedData.value.request;
      const response = restifiedData.value.response;
      const assertions = restifiedData.value.assertions;

      const enhancedHtml = createEnhancedHtml(request, response, assertions);
      contextEl.innerHTML = enhancedHtml;
      
    } catch (error) {
      console.warn('Error parsing Restified context data:', error);
    }
  }

  // Create enhanced HTML
  function createEnhancedHtml(request, response, assertions) {
    const requestId = 'req_' + Math.random().toString(36).substr(2, 9);
    const responseId = 'res_' + Math.random().toString(36).substr(2, 9);
    
    const statusClass = response.status >= 200 && response.status < 300 ? 'success' : 
                       response.status >= 300 && response.status < 400 ? 'redirect' : 'error';

    return \`
      <div class="restified-request-response">
        <div class="restified-section-header request" onclick="toggleSection('\${requestId}')">
          <div>
            📤 Request
            <span class="restified-method-badge \${request.method}">\${request.method}</span>
            <span class="restified-timing">\${request.timestamp ? new Date(request.timestamp).toLocaleTimeString() : ''}</span>
          </div>
          <span class="restified-toggle-icon" id="\${requestId}_icon">▶</span>
        </div>
        <div class="restified-section-content collapsed" id="\${requestId}">
          <div class="restified-data-section">
            <div class="restified-data-label">🌐 URL</div>
            <div class="restified-data-content">
              <pre>\${request.url}</pre>
              <button class="restified-copy-btn" onclick="copyToClipboard('\${request.url}')">📋 Copy</button>
            </div>
          </div>
          \${request.headers && Object.keys(request.headers).length > 0 ? \`
          <div class="restified-data-section">
            <div class="restified-data-label">📋 Headers</div>
            <div class="restified-data-content">
              <pre>\${JSON.stringify(request.headers, null, 2)}</pre>
              <button class="restified-copy-btn" onclick="copyToClipboard('\${JSON.stringify(request.headers, null, 2)}')">📋 Copy</button>
            </div>
          </div>
          \` : ''}
          \${request.body ? \`
          <div class="restified-data-section">
            <div class="restified-data-label">📦 Body</div>
            <div class="restified-data-content">
              <pre>\${JSON.stringify(request.body, null, 2)}</pre>
              <button class="restified-copy-btn" onclick="copyToClipboard('\${JSON.stringify(request.body, null, 2)}')">📋 Copy</button>
            </div>
          </div>
          \` : ''}
        </div>

        <div class="restified-section-header response" onclick="toggleSection('\${responseId}')">
          <div>
            📥 Response
            <span class="restified-status-badge \${statusClass}">\${response.status} \${response.statusText}</span>
            <span class="restified-timing">\${response.responseTime || 'N/A'}</span>
          </div>
          <span class="restified-toggle-icon" id="\${responseId}_icon">▶</span>
        </div>
        <div class="restified-section-content collapsed" id="\${responseId}">
          <div class="restified-data-section">
            <div class="restified-data-label">📊 Status</div>
            <div class="restified-data-content">
              <pre>\${response.status} \${response.statusText} (\${response.responseTime || 'N/A'})</pre>
            </div>
          </div>
          \${response.headers && Object.keys(response.headers).length > 0 ? \`
          <div class="restified-data-section">
            <div class="restified-data-label">📋 Headers</div>
            <div class="restified-data-content">
              <pre>\${JSON.stringify(response.headers, null, 2)}</pre>
              <button class="restified-copy-btn" onclick="copyToClipboard('\${JSON.stringify(response.headers, null, 2)}')">📋 Copy</button>
            </div>
          </div>
          \` : ''}
          \${response.body ? \`
          <div class="restified-data-section">
            <div class="restified-data-label">📦 Body</div>
            <div class="restified-data-content">
              <pre>\${JSON.stringify(response.body, null, 2)}</pre>
              <button class="restified-copy-btn" onclick="copyToClipboard('\${JSON.stringify(response.body, null, 2)}')">📋 Copy</button>
            </div>
          </div>
          \` : ''}
          \${assertions && assertions.length > 0 ? \`
          <div class="restified-data-section">
            <div class="restified-data-label">✅ Assertions (\${assertions.filter(function(a) { return a.passed; }).length}/\${assertions.length} passed)</div>
            <div class="restified-data-content">
              <pre>\${assertions.map(function(a) { return (a.passed ? '✅' : '❌') + ' ' + a.message; }).join('\\n')}</pre>
            </div>
          </div>
          \` : ''}
        </div>
      </div>
    \`;
  }

  // Setup global functions
  function setupGlobalFunctions() {
    window.toggleSection = function(sectionId) {
      const content = document.getElementById(sectionId);
      const icon = document.getElementById(sectionId + '_icon');
      
      if (!content || !icon) return;

      const isCollapsed = content.classList.contains('collapsed');
      
      if (isCollapsed) {
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        icon.classList.add('expanded');
        icon.textContent = '▼';
      } else {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        icon.classList.remove('expanded');
        icon.textContent = '▶';
      }
    };

    window.copyToClipboard = function(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          showCopyNotification();
        });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyNotification();
      }
    };
  }

  function showCopyNotification() {
    const notification = document.createElement('div');
    notification.textContent = '📋 Copied to clipboard!';
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: #48bb78;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    \`;
    
    document.body.appendChild(notification);
    
    setTimeout(function() {
      document.body.removeChild(notification);
    }, 2000);
  }

  function setupContentObserver() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          enhanceRestifiedContext();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
    `;
  }

  /**
   * Inject enhancements into multiple report files
   */
  public static async injectEnhancementsIntoDirectory(
    reportDir: string, 
    filePattern: string = '*.html'
  ): Promise<void> {
    try {
      const files = fs.readdirSync(reportDir);
      
      for (const file of files) {
        if (file.endsWith('.html')) {
          const filePath = path.join(reportDir, file);
          await this.injectEnhancements(filePath);
        }
      }
    } catch (error) {
      console.error('❌ Failed to inject enhancements into report directory:', error);
    }
  }
}

export default HtmlReportInjector;