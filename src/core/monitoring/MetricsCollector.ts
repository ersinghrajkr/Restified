import { EventEmitter } from 'events';
import * as os from 'os';
import * as process from 'process';

export interface MetricsConfig {
  enabled?: boolean;
  collectInterval?: number;
  retentionPeriod?: number;
  aggregationWindow?: number;
  enableSystemMetrics?: boolean;
  enableApplicationMetrics?: boolean;
  enableCustomMetrics?: boolean;
  exportFormats?: ('json' | 'prometheus' | 'influx' | 'csv')[];
  thresholds?: MetricThresholds;
}

export interface MetricThresholds {
  responseTime?: { warning: number; critical: number };
  errorRate?: { warning: number; critical: number };
  throughput?: { warning: number; critical: number };
  memoryUsage?: { warning: number; critical: number };
  cpuUsage?: { warning: number; critical: number };
}

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  unit?: string;
  description?: string;
}

export interface CounterMetric extends Metric {
  type: 'counter';
  increment?: number;
}

export interface GaugeMetric extends Metric {
  type: 'gauge';
}

export interface HistogramMetric extends Metric {
  type: 'histogram';
  buckets: number[];
  counts: number[];
  sum: number;
  count: number;
}

export interface SummaryMetric extends Metric {
  type: 'summary';
  quantiles: Record<number, number>;
  sum: number;
  count: number;
}

export interface MetricSeries {
  name: string;
  type: string;
  dataPoints: Array<{ timestamp: Date; value: number; labels?: Record<string, string> }>;
  aggregatedValues: {
    min: number;
    max: number;
    avg: number;
    sum: number;
    count: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  network: {
    connectionsActive: number;
    connectionsIdle: number;
    bytesReceived: number;
    bytesSent: number;
  };
  process: {
    pid: number;
    uptime: number;
    cpuUsage: NodeJS.CpuUsage;
    memoryUsage: NodeJS.MemoryUsage;
    version: string;
  };
}

export interface ApplicationMetrics {
  timestamp: Date;
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number;
    errorRate: number;
  };
  responses: {
    averageTime: number;
    p50Time: number;
    p90Time: number;
    p95Time: number;
    p99Time: number;
    maxTime: number;
  };
  endpoints: Record<string, {
    requestCount: number;
    successCount: number;
    failureCount: number;
    averageResponseTime: number;
    lastAccessed: Date;
  }>;
  database: {
    connections: number;
    queries: number;
    queriesSuccess: number;
    queriesFailure: number;
    averageQueryTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
}

export interface MetricsReport {
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  system: SystemMetrics;
  application: ApplicationMetrics;
  customMetrics: Record<string, MetricSeries>;
  alerts: Array<{
    metric: string;
    threshold: string;
    currentValue: number;
    thresholdValue: number;
    severity: 'warning' | 'critical';
    timestamp: Date;
  }>;
  summary: {
    totalRequests: number;
    totalErrors: number;
    averageResponseTime: number;
    systemHealth: 'good' | 'warning' | 'critical';
    recommendations: string[];
  };
}

export class MetricsCollector extends EventEmitter {
  private config: Required<MetricsConfig>;
  private metrics: Map<string, Metric[]> = new Map();
  private systemMetricsHistory: SystemMetrics[] = [];
  private applicationMetricsHistory: ApplicationMetrics[] = [];
  private collectionInterval: NodeJS.Timeout | null = null;
  private startTime: Date = new Date();
  private isCollecting: boolean = false;
  
  private requestCounter = 0;
  private successCounter = 0;
  private failureCounter = 0;
  private responseTimeSamples: number[] = [];
  private endpointMetrics: Map<string, any> = new Map();
  private previousCpuUsage: NodeJS.CpuUsage | null = null;

  constructor(config: MetricsConfig = {}) {
    super();
    
    this.config = {
      enabled: true,
      collectInterval: 10000,
      retentionPeriod: 24 * 60 * 60 * 1000,
      aggregationWindow: 60000,
      enableSystemMetrics: true,
      enableApplicationMetrics: true,
      enableCustomMetrics: true,
      exportFormats: ['json'],
      thresholds: {
        responseTime: { warning: 1000, critical: 5000 },
        errorRate: { warning: 0.05, critical: 0.1 },
        throughput: { warning: 10, critical: 5 },
        memoryUsage: { warning: 80, critical: 90 },
        cpuUsage: { warning: 70, critical: 90 }
      },
      ...config
    };
  }

  public start(): void {
    if (this.isCollecting) {
      console.log('Metrics collector is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('Metrics collection is disabled');
      return;
    }

    this.isCollecting = true;
    this.startTime = new Date();
    this.previousCpuUsage = process.cpuUsage();

    console.log('📊 Starting metrics collection...');

    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectInterval);

    this.emit('started', { timestamp: new Date() });
  }

  public stop(): void {
    if (!this.isCollecting) {
      return;
    }

    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    console.log('📊 Metrics collection stopped');
    this.emit('stopped', { timestamp: new Date() });
  }

  private async collectMetrics(): Promise<void> {
    const timestamp = new Date();

    try {
      if (this.config.enableSystemMetrics) {
        const systemMetrics = await this.collectSystemMetrics();
        this.systemMetricsHistory.push(systemMetrics);
        this.checkSystemThresholds(systemMetrics);
      }

      if (this.config.enableApplicationMetrics) {
        const applicationMetrics = await this.collectApplicationMetrics();
        this.applicationMetricsHistory.push(applicationMetrics);
        this.checkApplicationThresholds(applicationMetrics);
      }

      this.cleanupOldMetrics();
      this.emit('metricsCollected', { timestamp });

    } catch (error) {
      console.error('Error collecting metrics:', error);
      this.emit('collectionError', { error, timestamp });
    }
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.previousCpuUsage || undefined);
    this.previousCpuUsage = process.cpuUsage();

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      timestamp: new Date(),
      cpu: {
        usage: this.calculateCpuPercentage(cpuUsage),
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usage: (usedMem / totalMem) * 100,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      },
      network: {
        connectionsActive: 0,
        connectionsIdle: 0,
        bytesReceived: 0,
        bytesSent: 0
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        cpuUsage,
        memoryUsage: memUsage,
        version: process.version
      }
    };
  }

  private calculateCpuPercentage(cpuUsage: NodeJS.CpuUsage): number {
    const total = cpuUsage.user + cpuUsage.system;
    return (total / 1000000) / this.config.collectInterval * 100;
  }

  private async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    const responseTimeStats = this.calculateResponseTimeStats();
    
    return {
      timestamp: new Date(),
      requests: {
        total: this.requestCounter,
        successful: this.successCounter,
        failed: this.failureCounter,
        rate: this.calculateRequestRate(),
        errorRate: this.failureCounter / (this.requestCounter || 1)
      },
      responses: {
        averageTime: responseTimeStats.avg,
        p50Time: responseTimeStats.p50,
        p90Time: responseTimeStats.p90,
        p95Time: responseTimeStats.p95,
        p99Time: responseTimeStats.p99,
        maxTime: responseTimeStats.max
      },
      endpoints: Object.fromEntries(this.endpointMetrics),
      database: {
        connections: 0,
        queries: 0,
        queriesSuccess: 0,
        queriesFailure: 0,
        averageQueryTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0
      }
    };
  }

  private calculateResponseTimeStats(): any {
    if (this.responseTimeSamples.length === 0) {
      return { avg: 0, p50: 0, p90: 0, p95: 0, p99: 0, max: 0 };
    }

    const sorted = [...this.responseTimeSamples].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      avg: Math.round(this.responseTimeSamples.reduce((a, b) => a + b, 0) / len),
      p50: sorted[Math.floor(len * 0.5)],
      p90: sorted[Math.floor(len * 0.9)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
      max: sorted[len - 1]
    };
  }

  private calculateRequestRate(): number {
    const uptime = (Date.now() - this.startTime.getTime()) / 1000;
    return Math.round((this.requestCounter / uptime) * 60);
  }

  private checkSystemThresholds(metrics: SystemMetrics): void {
    const thresholds = this.config.thresholds;

    if (metrics.cpu.usage > thresholds.cpuUsage!.critical) {
      this.emitAlert('cpu_usage', 'critical', metrics.cpu.usage, thresholds.cpuUsage!.critical);
    } else if (metrics.cpu.usage > thresholds.cpuUsage!.warning) {
      this.emitAlert('cpu_usage', 'warning', metrics.cpu.usage, thresholds.cpuUsage!.warning);
    }

    if (metrics.memory.usage > thresholds.memoryUsage!.critical) {
      this.emitAlert('memory_usage', 'critical', metrics.memory.usage, thresholds.memoryUsage!.critical);
    } else if (metrics.memory.usage > thresholds.memoryUsage!.warning) {
      this.emitAlert('memory_usage', 'warning', metrics.memory.usage, thresholds.memoryUsage!.warning);
    }
  }

  private checkApplicationThresholds(metrics: ApplicationMetrics): void {
    const thresholds = this.config.thresholds;

    if (metrics.responses.averageTime > thresholds.responseTime!.critical) {
      this.emitAlert('response_time', 'critical', metrics.responses.averageTime, thresholds.responseTime!.critical);
    } else if (metrics.responses.averageTime > thresholds.responseTime!.warning) {
      this.emitAlert('response_time', 'warning', metrics.responses.averageTime, thresholds.responseTime!.warning);
    }

    if (metrics.requests.errorRate > thresholds.errorRate!.critical) {
      this.emitAlert('error_rate', 'critical', metrics.requests.errorRate, thresholds.errorRate!.critical);
    } else if (metrics.requests.errorRate > thresholds.errorRate!.warning) {
      this.emitAlert('error_rate', 'warning', metrics.requests.errorRate, thresholds.errorRate!.warning);
    }
  }

  private emitAlert(metric: string, severity: 'warning' | 'critical', currentValue: number, thresholdValue: number): void {
    const alert = {
      metric,
      threshold: severity,
      currentValue,
      thresholdValue,
      severity,
      timestamp: new Date()
    };

    this.emit('alert', alert);
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod);

    this.systemMetricsHistory = this.systemMetricsHistory.filter(
      m => m.timestamp > cutoffTime
    );

    this.applicationMetricsHistory = this.applicationMetricsHistory.filter(
      m => m.timestamp > cutoffTime
    );

    this.metrics.forEach((metricList, key) => {
      this.metrics.set(key, metricList.filter(m => m.timestamp > cutoffTime));
    });
  }

  public recordRequest(endpoint: string, method: string): void {
    this.requestCounter++;
    const key = `${method}:${endpoint}`;
    
    if (!this.endpointMetrics.has(key)) {
      this.endpointMetrics.set(key, {
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        averageResponseTime: 0,
        lastAccessed: new Date()
      });
    }
    
    const endpointMetric = this.endpointMetrics.get(key);
    endpointMetric.requestCount++;
    endpointMetric.lastAccessed = new Date();
  }

  public recordResponse(endpoint: string, method: string, responseTime: number, success: boolean): void {
    if (success) {
      this.successCounter++;
    } else {
      this.failureCounter++;
    }

    this.responseTimeSamples.push(responseTime);
    
    if (this.responseTimeSamples.length > 10000) {
      this.responseTimeSamples = this.responseTimeSamples.slice(-5000);
    }

    const key = `${method}:${endpoint}`;
    const endpointMetric = this.endpointMetrics.get(key);
    
    if (endpointMetric) {
      if (success) {
        endpointMetric.successCount++;
      } else {
        endpointMetric.failureCount++;
      }
      
      const totalTime = endpointMetric.averageResponseTime * (endpointMetric.successCount - 1) + responseTime;
      endpointMetric.averageResponseTime = Math.round(totalTime / endpointMetric.successCount);
    }
  }

  public recordCustomMetric(metric: Metric): void {
    if (!this.config.enableCustomMetrics) {
      return;
    }

    const key = `${metric.name}_${metric.type}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push({ ...metric, timestamp: new Date() });
    
    if (this.metrics.get(key)!.length > 10000) {
      this.metrics.set(key, this.metrics.get(key)!.slice(-5000));
    }
  }

  public incrementCounter(name: string, increment: number = 1, labels?: Record<string, string>): void {
    this.recordCustomMetric({
      name,
      type: 'counter',
      value: increment,
      timestamp: new Date(),
      labels
    });
  }

  public setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordCustomMetric({
      name,
      type: 'gauge',
      value,
      timestamp: new Date(),
      labels
    });
  }

  public recordHistogram(name: string, value: number, buckets: number[] = [10, 50, 100, 500, 1000, 5000], labels?: Record<string, string>): void {
    const counts = buckets.map(bucket => value <= bucket ? 1 : 0);
    
    this.recordCustomMetric({
      name,
      type: 'histogram',
      value,
      timestamp: new Date(),
      labels,
      buckets,
      counts,
      sum: value,
      count: 1
    } as HistogramMetric);
  }

  public getMetricsReport(periodMinutes: number = 60): MetricsReport {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - periodMinutes * 60 * 1000);
    
    const systemMetrics = this.systemMetricsHistory
      .filter(m => m.timestamp >= startTime)
      .slice(-1)[0] || this.getDefaultSystemMetrics();
    
    const applicationMetrics = this.applicationMetricsHistory
      .filter(m => m.timestamp >= startTime)
      .slice(-1)[0] || this.getDefaultApplicationMetrics();

    const customMetrics: Record<string, MetricSeries> = {};
    
    this.metrics.forEach((metricList, key) => {
      const filteredMetrics = metricList.filter(m => m.timestamp >= startTime);
      if (filteredMetrics.length > 0) {
        customMetrics[key] = this.aggregateMetrics(key, filteredMetrics);
      }
    });

    const alerts: any[] = [];
    const recommendations: string[] = [];

    if (systemMetrics.cpu.usage > this.config.thresholds.cpuUsage!.warning) {
      recommendations.push('High CPU usage detected. Consider scaling or optimizing your application.');
    }
    
    if (systemMetrics.memory.usage > this.config.thresholds.memoryUsage!.warning) {
      recommendations.push('High memory usage detected. Check for memory leaks or consider increasing memory allocation.');
    }
    
    if (applicationMetrics.requests.errorRate > this.config.thresholds.errorRate!.warning) {
      recommendations.push('High error rate detected. Investigate failing endpoints and error patterns.');
    }

    let systemHealth: 'good' | 'warning' | 'critical' = 'good';
    
    if (systemMetrics.cpu.usage > this.config.thresholds.cpuUsage!.critical || 
        systemMetrics.memory.usage > this.config.thresholds.memoryUsage!.critical ||
        applicationMetrics.requests.errorRate > this.config.thresholds.errorRate!.critical) {
      systemHealth = 'critical';
    } else if (systemMetrics.cpu.usage > this.config.thresholds.cpuUsage!.warning || 
               systemMetrics.memory.usage > this.config.thresholds.memoryUsage!.warning ||
               applicationMetrics.requests.errorRate > this.config.thresholds.errorRate!.warning) {
      systemHealth = 'warning';
    }

    return {
      generatedAt: new Date(),
      period: {
        start: startTime,
        end: endTime,
        duration: periodMinutes * 60 * 1000
      },
      system: systemMetrics,
      application: applicationMetrics,
      customMetrics,
      alerts,
      summary: {
        totalRequests: this.requestCounter,
        totalErrors: this.failureCounter,
        averageResponseTime: applicationMetrics.responses.averageTime,
        systemHealth,
        recommendations
      }
    };
  }

  private getDefaultSystemMetrics(): SystemMetrics {
    return {
      timestamp: new Date(),
      cpu: { usage: 0, loadAverage: [0, 0, 0], cores: os.cpus().length },
      memory: { total: 0, used: 0, free: 0, usage: 0, heapUsed: 0, heapTotal: 0, external: 0 },
      network: { connectionsActive: 0, connectionsIdle: 0, bytesReceived: 0, bytesSent: 0 },
      process: { pid: process.pid, uptime: 0, cpuUsage: { user: 0, system: 0 }, memoryUsage: process.memoryUsage(), version: process.version }
    };
  }

  private getDefaultApplicationMetrics(): ApplicationMetrics {
    return {
      timestamp: new Date(),
      requests: { total: 0, successful: 0, failed: 0, rate: 0, errorRate: 0 },
      responses: { averageTime: 0, p50Time: 0, p90Time: 0, p95Time: 0, p99Time: 0, maxTime: 0 },
      endpoints: {},
      database: { connections: 0, queries: 0, queriesSuccess: 0, queriesFailure: 0, averageQueryTime: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0, size: 0 }
    };
  }

  private aggregateMetrics(key: string, metrics: Metric[]): MetricSeries {
    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const len = values.length;
    
    return {
      name: key,
      type: metrics[0].type,
      dataPoints: metrics.map(m => ({ 
        timestamp: m.timestamp, 
        value: m.value, 
        labels: m.labels 
      })),
      aggregatedValues: {
        min: values[0] || 0,
        max: values[len - 1] || 0,
        avg: values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / len) : 0,
        sum: values.reduce((a, b) => a + b, 0),
        count: len,
        p50: values[Math.floor(len * 0.5)] || 0,
        p90: values[Math.floor(len * 0.9)] || 0,
        p95: values[Math.floor(len * 0.95)] || 0,
        p99: values[Math.floor(len * 0.99)] || 0
      }
    };
  }

  public exportMetrics(format: 'json' | 'prometheus' | 'csv' = 'json'): string {
    const report = this.getMetricsReport();
    
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'prometheus':
        return this.exportPrometheusFormat(report);
      case 'csv':
        return this.exportCsvFormat(report);
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  private exportPrometheusFormat(report: MetricsReport): string {
    let output = '';
    
    output += `# HELP restified_requests_total Total number of requests\n`;
    output += `# TYPE restified_requests_total counter\n`;
    output += `restified_requests_total ${report.application.requests.total}\n\n`;
    
    output += `# HELP restified_response_time_seconds Response time in seconds\n`;
    output += `# TYPE restified_response_time_seconds histogram\n`;
    output += `restified_response_time_seconds{quantile="0.5"} ${report.application.responses.p50Time / 1000}\n`;
    output += `restified_response_time_seconds{quantile="0.9"} ${report.application.responses.p90Time / 1000}\n`;
    output += `restified_response_time_seconds{quantile="0.95"} ${report.application.responses.p95Time / 1000}\n`;
    output += `restified_response_time_seconds{quantile="0.99"} ${report.application.responses.p99Time / 1000}\n\n`;
    
    return output;
  }

  private exportCsvFormat(report: MetricsReport): string {
    const headers = ['timestamp', 'metric', 'value', 'unit'];
    let csv = headers.join(',') + '\n';
    
    const timestamp = report.generatedAt.toISOString();
    csv += `${timestamp},requests_total,${report.application.requests.total},count\n`;
    csv += `${timestamp},cpu_usage,${report.system.cpu.usage},percent\n`;
    csv += `${timestamp},memory_usage,${report.system.memory.usage},percent\n`;
    csv += `${timestamp},response_time_avg,${report.application.responses.averageTime},ms\n`;
    
    return csv;
  }

  public resetMetrics(): void {
    this.requestCounter = 0;
    this.successCounter = 0;
    this.failureCounter = 0;
    this.responseTimeSamples = [];
    this.endpointMetrics.clear();
    this.metrics.clear();
    this.systemMetricsHistory = [];
    this.applicationMetricsHistory = [];
    this.startTime = new Date();
  }

  public getConfig(): MetricsConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isCollecting && this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = setInterval(() => {
        this.collectMetrics();
      }, this.config.collectInterval);
    }
  }

  public static create(config?: MetricsConfig): MetricsCollector {
    return new MetricsCollector(config);
  }
}

export const globalMetricsCollector = MetricsCollector.create();