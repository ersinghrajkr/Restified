/**
 * Real-time Test Dashboard
 * 
 * Live monitoring and visualization of test execution with terminal-based UI
 */

import chalk from 'chalk';
import { EventEmitter } from 'events';

export interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  startTime: Date;
  endTime?: Date;
  averageResponseTime: number;
  errorRate: number;
}

export interface EndpointMetrics {
  path: string;
  method: string;
  calls: number;
  avgResponseTime: number;
  successRate: number;
  errors: string[];
  lastCall: Date;
}

export interface TestEvent {
  type: 'start' | 'pass' | 'fail' | 'skip' | 'end' | 'request' | 'response';
  timestamp: Date;
  testName?: string;
  error?: string;
  duration?: number;
  endpoint?: string;
  method?: string;
  responseTime?: number;
  statusCode?: number;
}

export class RealTimeDashboard extends EventEmitter {
  private metrics: TestMetrics;
  private endpointMetrics: Map<string, EndpointMetrics>;
  private recentEvents: TestEvent[];
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private startTime: Date;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.endpointMetrics = new Map();
    this.recentEvents = [];
    this.startTime = new Date();
  }

  /**
   * Start the real-time dashboard
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = new Date();
    this.metrics.startTime = this.startTime;
    
    console.log(chalk.cyan('\n🚀 === RestifiedTS Live Dashboard ===\n'));
    
    // Clear screen and start refresh loop
    this.clearScreen();
    this.render();
    
    this.refreshInterval = setInterval(() => {
      this.render();
    }, 1000); // Update every second

    // Listen for keyboard input to stop dashboard
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
      if (key.toString() === '\u0003' || key.toString() === 'q') { // Ctrl+C or 'q'
        this.stop();
      }
    });
  }

  /**
   * Stop the dashboard
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    this.metrics.endTime = new Date();
    this.metrics.duration = this.metrics.endTime.getTime() - this.metrics.startTime.getTime();
    
    process.stdin.setRawMode?.(false);
    process.stdin.pause();
    
    this.renderFinalSummary();
  }

  /**
   * Record a test event
   */
  recordEvent(event: TestEvent): void {
    event.timestamp = new Date();
    this.recentEvents.unshift(event);
    
    // Keep only last 50 events
    if (this.recentEvents.length > 50) {
      this.recentEvents = this.recentEvents.slice(0, 50);
    }

    // Update metrics based on event type
    this.updateMetrics(event);
    
    // Update endpoint metrics for API calls
    if (event.type === 'response' && event.endpoint && event.method) {
      this.updateEndpointMetrics(event);
    }
  }

  /**
   * Clear terminal screen
   */
  private clearScreen(): void {
    process.stdout.write('\u001b[2J\u001b[0;0H');
  }

  /**
   * Render the complete dashboard
   */
  private render(): void {
    if (!this.isRunning) return;
    
    this.clearScreen();
    
    const output = [
      this.renderHeader(),
      this.renderMetrics(),
      this.renderEndpointStats(),
      this.renderRecentActivity(),
      this.renderFooter()
    ].join('\n');
    
    console.log(output);
  }

  /**
   * Render dashboard header
   */
  private renderHeader(): string {
    const elapsed = new Date().getTime() - this.startTime.getTime();
    const elapsedStr = this.formatDuration(elapsed);
    
    return chalk.cyan('🚀 RestifiedTS Live Dashboard') + 
           chalk.gray(` | Running for: ${elapsedStr}`) + 
           chalk.yellow(' | Press \'q\' or Ctrl+C to exit\n') +
           chalk.gray('─'.repeat(80));
  }

  /**
   * Render test metrics summary
   */
  private renderMetrics(): string {
    const { total, passed, failed, skipped, averageResponseTime, errorRate } = this.metrics;
    
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    const failRate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0.0';
    
    return '\n📊 Test Metrics:\n' +
           `   ${chalk.green('✅ Passed:')} ${passed.toString().padStart(4)} (${passRate}%)  ` +
           `${chalk.red('❌ Failed:')} ${failed.toString().padStart(4)} (${failRate}%)  ` +
           `${chalk.yellow('⏭️  Skipped:')} ${skipped.toString().padStart(4)}  ` +
           `${chalk.blue('📈 Total:')} ${total.toString().padStart(4)}\n` +
           `   ${chalk.cyan('⚡ Avg Response:')} ${averageResponseTime.toFixed(0)}ms  ` +
           `${chalk.magenta('📉 Error Rate:')} ${(errorRate * 100).toFixed(1)}%`;
  }

  /**
   * Render endpoint statistics
   */
  private renderEndpointStats(): string {
    if (this.endpointMetrics.size === 0) {
      return '\n🌐 API Endpoints:\n   ' + chalk.gray('No API calls recorded yet...');
    }

    let output = '\n🌐 API Endpoints:\n';
    
    // Sort endpoints by number of calls (descending)
    const sortedEndpoints = Array.from(this.endpointMetrics.entries())
      .sort(([, a], [, b]) => b.calls - a.calls)
      .slice(0, 10); // Show top 10

    for (const [key, metrics] of sortedEndpoints) {
      const method = metrics.method.padEnd(6);
      const path = metrics.path.length > 30 ? 
        metrics.path.substring(0, 27) + '...' : 
        metrics.path.padEnd(30);
      
      const calls = metrics.calls.toString().padStart(4);
      const avgTime = metrics.avgResponseTime.toFixed(0).padStart(5) + 'ms';
      const successRate = (metrics.successRate * 100).toFixed(1).padStart(5) + '%';
      
      const methodColor = this.getMethodColor(metrics.method);
      const successColor = metrics.successRate >= 0.95 ? chalk.green : 
                          metrics.successRate >= 0.8 ? chalk.yellow : chalk.red;
      
      output += `   ${methodColor(method)} ${chalk.gray(path)} ` +
                `${chalk.blue(calls)} calls  ${chalk.cyan(avgTime)}  ${successColor(successRate)}\n`;
    }

    return output;
  }

  /**
   * Render recent activity feed
   */
  private renderRecentActivity(): string {
    if (this.recentEvents.length === 0) {
      return '\n📝 Recent Activity:\n   ' + chalk.gray('No recent activity...');
    }

    let output = '\n📝 Recent Activity:\n';
    
    const recentEvents = this.recentEvents.slice(0, 8); // Show last 8 events
    
    for (const event of recentEvents) {
      const time = event.timestamp.toLocaleTimeString();
      const icon = this.getEventIcon(event.type);
      const message = this.getEventMessage(event);
      
      output += `   ${chalk.gray(time)} ${icon} ${message}\n`;
    }

    return output;
  }

  /**
   * Render dashboard footer
   */
  private renderFooter(): string {
    return '\n' + chalk.gray('─'.repeat(80)) + '\n' +
           chalk.yellow('💡 Tip: ') + 
           chalk.gray('Dashboard updates every second. Watch for patterns in response times and error rates.');
  }

  /**
   * Render final summary when dashboard stops
   */
  private renderFinalSummary(): void {
    console.log('\n' + chalk.cyan('🏁 === Test Execution Summary ===\n'));
    
    const { total, passed, failed, skipped, duration } = this.metrics;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`📊 Results:`);
    console.log(`   ${chalk.green('✅ Passed:')} ${passed}`);
    console.log(`   ${chalk.red('❌ Failed:')} ${failed}`);
    console.log(`   ${chalk.yellow('⏭️  Skipped:')} ${skipped}`);
    console.log(`   ${chalk.blue('📈 Total:')} ${total}`);
    console.log(`   ${chalk.cyan('🎯 Success Rate:')} ${successRate}%`);
    console.log(`   ${chalk.magenta('⏱️  Duration:')} ${this.formatDuration(duration)}`);
    
    if (this.endpointMetrics.size > 0) {
      console.log(`\n🌐 API Performance:`);
      const avgResponseTime = Array.from(this.endpointMetrics.values())
        .reduce((sum, metrics) => sum + metrics.avgResponseTime, 0) / this.endpointMetrics.size;
      console.log(`   ${chalk.cyan('⚡ Average Response Time:')} ${avgResponseTime.toFixed(0)}ms`);
      console.log(`   ${chalk.blue('📡 Endpoints Tested:')} ${this.endpointMetrics.size}`);
    }
    
    console.log('\n' + chalk.green('🎉 Dashboard session completed!'));
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): TestMetrics {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      startTime: new Date(),
      averageResponseTime: 0,
      errorRate: 0
    };
  }

  /**
   * Update metrics based on test event
   */
  private updateMetrics(event: TestEvent): void {
    switch (event.type) {
      case 'pass':
        this.metrics.passed++;
        this.metrics.total++;
        break;
      case 'fail':
        this.metrics.failed++;
        this.metrics.total++;
        break;
      case 'skip':
        this.metrics.skipped++;
        this.metrics.total++;
        break;
      case 'response':
        if (event.responseTime) {
          // Update average response time
          const totalCalls = Array.from(this.endpointMetrics.values())
            .reduce((sum, metrics) => sum + metrics.calls, 0) + 1;
          
          this.metrics.averageResponseTime = (
            (this.metrics.averageResponseTime * (totalCalls - 1)) + event.responseTime
          ) / totalCalls;
        }
        break;
    }

    // Update error rate
    this.metrics.errorRate = this.metrics.total > 0 ? this.metrics.failed / this.metrics.total : 0;
  }

  /**
   * Update endpoint-specific metrics
   */
  private updateEndpointMetrics(event: TestEvent): void {
    if (!event.endpoint || !event.method) return;
    
    const key = `${event.method} ${event.endpoint}`;
    const existing = this.endpointMetrics.get(key);
    
    if (existing) {
      existing.calls++;
      existing.lastCall = event.timestamp!;
      
      if (event.responseTime) {
        existing.avgResponseTime = (
          (existing.avgResponseTime * (existing.calls - 1)) + event.responseTime
        ) / existing.calls;
      }
      
      if (event.statusCode && event.statusCode >= 200 && event.statusCode < 400) {
        existing.successRate = (existing.successRate * (existing.calls - 1) + 1) / existing.calls;
      } else if (event.statusCode) {
        existing.successRate = (existing.successRate * (existing.calls - 1)) / existing.calls;
        if (event.error) {
          existing.errors.push(event.error);
        }
      }
    } else {
      this.endpointMetrics.set(key, {
        path: event.endpoint,
        method: event.method,
        calls: 1,
        avgResponseTime: event.responseTime || 0,
        successRate: (event.statusCode && event.statusCode >= 200 && event.statusCode < 400) ? 1 : 0,
        errors: event.error ? [event.error] : [],
        lastCall: event.timestamp!
      });
    }
  }

  /**
   * Get color for HTTP method
   */
  private getMethodColor(method: string): (text: string) => string {
    switch (method.toLowerCase()) {
      case 'get': return chalk.green;
      case 'post': return chalk.blue;
      case 'put': return chalk.yellow;
      case 'delete': return chalk.red;
      case 'patch': return chalk.magenta;
      default: return chalk.gray;
    }
  }

  /**
   * Get icon for event type
   */
  private getEventIcon(type: string): string {
    switch (type) {
      case 'start': return chalk.blue('🚀');
      case 'pass': return chalk.green('✅');
      case 'fail': return chalk.red('❌');
      case 'skip': return chalk.yellow('⏭️ ');
      case 'end': return chalk.cyan('🏁');
      case 'request': return chalk.blue('➡️ ');
      case 'response': return chalk.green('⬅️ ');
      default: return chalk.gray('ℹ️ ');
    }
  }

  /**
   * Get formatted message for event
   */
  private getEventMessage(event: TestEvent): string {
    switch (event.type) {
      case 'pass':
        return chalk.green(`${event.testName} passed`) + 
               (event.duration ? chalk.gray(` (${event.duration}ms)`) : '');
      case 'fail':
        return chalk.red(`${event.testName} failed`) + 
               (event.error ? chalk.gray(` - ${event.error.substring(0, 40)}...`) : '');
      case 'skip':
        return chalk.yellow(`${event.testName} skipped`);
      case 'request':
        return chalk.blue(`${event.method} ${event.endpoint}`);
      case 'response':
        return chalk.cyan(`${event.statusCode} ${event.endpoint}`) + 
               (event.responseTime ? chalk.gray(` (${event.responseTime}ms)`) : '');
      default:
        return chalk.gray(event.testName || 'Unknown event');
    }
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): TestMetrics {
    return { ...this.metrics };
  }

  /**
   * Get endpoint metrics snapshot
   */
  getEndpointMetrics(): Map<string, EndpointMetrics> {
    return new Map(this.endpointMetrics);
  }
}