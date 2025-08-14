/**
 * Mochawesome HTML Report Enhancer for Restified
 * 
 * This TypeScript module enhances Mochawesome HTML reports by adding collapsible
 * Request/Response sections with better formatting and user experience.
 */

interface RestifiedTestData {
  title: string;
  value: {
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: any;
      timestamp: string;
    };
    response: {
      status: number;
      statusText: string;
      headers: Record<string, string>;
      body: any;
      responseTime: string;
      timestamp: string;
    };
    assertions: Array<{
      type: string;
      passed: boolean;
      message: string;
      expected: any;
      actual: any;
    }>;
    framework: {
      name: string;
      version: string;
      nodeVersion: string;
      platform: string;
      testSuite: string;
    };
  };
}

export class MochawesomeEnhancer {
  private static instance: MochawesomeEnhancer;
  private observer: MutationObserver | null = null;

  private constructor() {}

  static getInstance(): MochawesomeEnhancer {
    if (!MochawesomeEnhancer.instance) {
      MochawesomeEnhancer.instance = new MochawesomeEnhancer();
    }
    return MochawesomeEnhancer.instance;
  }

  /**
   * Initialize the enhancer by injecting styles and setting up observers
   */
  public initialize(): void {
    this.injectEnhancedStyles();
    this.enhanceExistingContent();
    this.setupContentObserver();
    this.setupGlobalFunctions();
  }

  /**
   * Inject enhanced CSS styles for Request/Response sections
   */
  private injectEnhancedStyles(): void {
    const styleElement = document.createElement('style');
    styleElement.id = 'restified-enhancements';
    styleElement.textContent = `
      /* Restified Request/Response Enhancement Styles */
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
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }

      .restified-section-header.request {
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
      }

      .restified-section-header.request:hover {
        background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
      }

      .restified-section-header.response {
        background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
      }

      .restified-section-header.response:hover {
        background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
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

      .restified-data-section:last-child {
        margin-bottom: 0;
      }

      .restified-data-label {
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 8px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 8px;
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

      .restified-copy-btn:hover {
        background: #5a67d8;
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

      /* JSON syntax highlighting */
      .json-key { color: #d73a49; font-weight: 600; }
      .json-value { color: #032f62; }
      .json-string { color: #22863a; }
      .json-number { color: #005cc5; }
      .json-boolean { color: #d73a49; }
      .json-null { color: #6f42c1; }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .restified-section-header {
          padding: 10px 12px;
          font-size: 13px;
        }
        
        .restified-section-content.expanded {
          padding: 12px;
        }
        
        .restified-data-content {
          font-size: 11px;
          max-height: 200px;
        }
      }
    `;

    document.head.appendChild(styleElement);
  }

  /**
   * Enhance existing Restified context data in the DOM
   */
  private enhanceExistingContent(): void {
    const testItems = document.querySelectorAll('[data-test]');
    
    testItems.forEach((testItem) => {
      const contextEl = testItem.querySelector('.test-context') as HTMLElement;
      if (!contextEl) return;

      try {
        const contextText = contextEl.textContent || '';
        
        if (contextText.includes('Restified Request/Response Details')) {
          this.enhanceTestContext(contextEl);
        }
      } catch (error) {
        console.warn('Error enhancing Restified context:', error);
      }
    });
  }

  /**
   * Enhance individual test context element
   */
  private enhanceTestContext(contextEl: HTMLElement): void {
    try {
      const contextData = JSON.parse(contextEl.textContent || '');
      
      let restifiedData: RestifiedTestData | null = null;
      if (Array.isArray(contextData)) {
        restifiedData = contextData.find((item: any) => 
          item.title && item.title.includes('Restified Request/Response Details')
        ) as RestifiedTestData;
      }

      if (!restifiedData?.value) return;

      const { request, response, assertions, framework } = restifiedData.value;

      const enhancedHtml = this.createEnhancedRequestResponseHtml(
        request, 
        response, 
        assertions, 
        framework
      );

      contextEl.innerHTML = enhancedHtml;
      
    } catch (error) {
      console.warn('Error parsing Restified context data:', error);
    }
  }

  /**
   * Create enhanced HTML for request/response display
   */
  private createEnhancedRequestResponseHtml(
    request: RestifiedTestData['value']['request'],
    response: RestifiedTestData['value']['response'],
    assertions: RestifiedTestData['value']['assertions'],
    framework: RestifiedTestData['value']['framework']
  ): string {
    const requestId = 'req_' + Math.random().toString(36).substr(2, 9);
    const responseId = 'res_' + Math.random().toString(36).substr(2, 9);
    
    const statusClass = response.status >= 200 && response.status < 300 ? 'success' : 
                       response.status >= 300 && response.status < 400 ? 'redirect' : 'error';

    return `
      <div class="restified-request-response">
        <!-- Request Section -->
        <div class="restified-section-header request" onclick="window.restifiedToggleSection('${requestId}')">
          <div>
            📤 Request
            <span class="restified-method-badge ${request.method}">${request.method}</span>
            <span class="restified-timing">${request.timestamp ? new Date(request.timestamp).toLocaleTimeString() : ''}</span>
          </div>
          <span class="restified-toggle-icon" id="${requestId}_icon">▶</span>
        </div>
        <div class="restified-section-content collapsed" id="${requestId}">
          <div class="restified-data-section">
            <div class="restified-data-label">🌐 URL</div>
            <div class="restified-data-content">
              <pre>${request.url}</pre>
              <button class="restified-copy-btn" onclick="window.restifiedCopyToClipboard('${this.escapeForAttribute(request.url)}')">📋 Copy</button>
            </div>
          </div>
          ${request.headers && Object.keys(request.headers).length > 0 ? `
          <div class="restified-data-section">
            <div class="restified-data-label">📋 Headers</div>
            <div class="restified-data-content">
              <pre>${this.formatJson(request.headers)}</pre>
              <button class="restified-copy-btn" onclick="window.restifiedCopyToClipboard('${this.escapeForAttribute(JSON.stringify(request.headers, null, 2))}')">📋 Copy</button>
            </div>
          </div>
          ` : ''}
          ${request.body ? `
          <div class="restified-data-section">
            <div class="restified-data-label">📦 Body</div>
            <div class="restified-data-content">
              <pre>${this.formatJson(request.body)}</pre>
              <button class="restified-copy-btn" onclick="window.restifiedCopyToClipboard('${this.escapeForAttribute(JSON.stringify(request.body, null, 2))}')">📋 Copy</button>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Response Section -->
        <div class="restified-section-header response" onclick="window.restifiedToggleSection('${responseId}')">
          <div>
            📥 Response
            <span class="restified-status-badge ${statusClass}">${response.status} ${response.statusText}</span>
            <span class="restified-timing">${response.responseTime || 'N/A'}</span>
          </div>
          <span class="restified-toggle-icon" id="${responseId}_icon">▶</span>
        </div>
        <div class="restified-section-content collapsed" id="${responseId}">
          <div class="restified-data-section">
            <div class="restified-data-label">📊 Status</div>
            <div class="restified-data-content">
              <pre>${response.status} ${response.statusText} (${response.responseTime || 'N/A'})</pre>
            </div>
          </div>
          ${response.headers && Object.keys(response.headers).length > 0 ? `
          <div class="restified-data-section">
            <div class="restified-data-label">📋 Headers</div>
            <div class="restified-data-content">
              <pre>${this.formatJson(response.headers)}</pre>
              <button class="restified-copy-btn" onclick="window.restifiedCopyToClipboard('${this.escapeForAttribute(JSON.stringify(response.headers, null, 2))}')">📋 Copy</button>
            </div>
          </div>
          ` : ''}
          ${response.body ? `
          <div class="restified-data-section">
            <div class="restified-data-label">📦 Body</div>
            <div class="restified-data-content">
              <pre>${this.formatJson(response.body)}</pre>
              <button class="restified-copy-btn" onclick="window.restifiedCopyToClipboard('${this.escapeForAttribute(JSON.stringify(response.body, null, 2))}')">📋 Copy</button>
            </div>
          </div>
          ` : ''}
          ${assertions && assertions.length > 0 ? `
          <div class="restified-data-section">
            <div class="restified-data-label">✅ Assertions (${assertions.filter(a => a.passed).length}/${assertions.length} passed)</div>
            <div class="restified-data-content">
              <pre>${assertions.map(a => `${a.passed ? '✅' : '❌'} ${a.message}`).join('\n')}</pre>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Format JSON with syntax highlighting
   */
  private formatJson(data: any): string {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return data;
      }
    }
    
    let json = JSON.stringify(data, null, 2);
    
    // Basic syntax highlighting
    json = json
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/: null/g, ': <span class="json-null">null</span>');
        
    return json;
  }

  /**
   * Escape string for HTML attribute usage
   */
  private escapeForAttribute(str: string): string {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  /**
   * Setup content observer for dynamically loaded content
   */
  private setupContentObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.enhanceExistingContent();
        }
      });
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Setup global functions for toggle and copy functionality
   */
  private setupGlobalFunctions(): void {
    // Toggle section function
    (window as any).restifiedToggleSection = (sectionId: string): void => {
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

    // Copy to clipboard function
    (window as any).restifiedCopyToClipboard = (text: string): void => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          this.showCopyNotification();
        }).catch((err) => {
          console.warn('Failed to copy to clipboard:', err);
          this.fallbackCopy(text);
        });
      } else {
        this.fallbackCopy(text);
      }
    };
  }

  /**
   * Fallback copy function for older browsers
   */
  private fallbackCopy(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopyNotification();
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
    
    document.body.removeChild(textArea);
  }

  /**
   * Show copy success notification
   */
  private showCopyNotification(): void {
    const notification = document.createElement('div');
    notification.textContent = '📋 Copied to clipboard!';
    notification.style.cssText = `
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
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  /**
   * Cleanup observer and global functions
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Remove global functions
    delete (window as any).restifiedToggleSection;
    delete (window as any).restifiedCopyToClipboard;

    // Remove injected styles
    const styleElement = document.getElementById('restified-enhancements');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

// Auto-initialize when DOM is ready
const initializeEnhancer = (): void => {
  const enhancer = MochawesomeEnhancer.getInstance();
  enhancer.initialize();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnhancer);
} else {
  initializeEnhancer();
}

export default MochawesomeEnhancer;