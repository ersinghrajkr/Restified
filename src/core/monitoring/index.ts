export { HealthCheckManager, globalHealthCheckManager } from './HealthCheckManager';
export { MetricsCollector, globalMetricsCollector } from './MetricsCollector';
export { ValidationPipeline, globalValidationPipeline } from './ValidationPipeline';
export { MemoryManager, ObjectPool, globalMemoryManager } from './MemoryManager';

export type {
  HealthCheckConfig,
  EndpointHealthCheck,
  HealthStatus,
  HealthAlert,
  SystemHealthSummary,
  AlertThresholds,
  NotificationConfig
} from './HealthCheckManager';

export type {
  MetricsConfig,
  Metric,
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  SummaryMetric,
  MetricSeries,
  SystemMetrics,
  ApplicationMetrics,
  MetricsReport,
  MetricThresholds
} from './MetricsCollector';

export type {
  ValidationConfig,
  ValidationRule,
  CustomValidator,
  SecurityRule,
  PerformanceThresholds,
  ValidationContext,
  ValidationResult,
  PipelineResult,
  ValidationMetrics
} from './ValidationPipeline';

export type {
  MemoryConfig,
  PoolConfig,
  MemoryAlertThresholds,
  PoolStats,
  MemoryStats,
  MemoryReport
} from './MemoryManager';

export interface EnterpriseMonitoringConfig {
  enabled?: boolean;
  healthChecks?: import('./HealthCheckManager').HealthCheckConfig;
  metricsCollection?: import('./MetricsCollector').MetricsConfig;
  validation?: import('./ValidationPipeline').ValidationConfig;
  memoryManagement?: import('./MemoryManager').MemoryConfig;
}

export interface MonitoringSummary {
  timestamp: Date;
  healthStatus: import('./HealthCheckManager').SystemHealthSummary;
  performanceMetrics: import('./MetricsCollector').MetricsReport;
  validationSummary: {
    totalValidations: number;
    successRate: number;
    criticalIssues: number;
  };
  memoryStatus: {
    heapUsage: number;
    poolEfficiency: number;
    gcActivity: string;
  };
  overallStatus: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

export class EnterpriseMonitoring {
  private healthManager: import('./HealthCheckManager').HealthCheckManager;
  private metricsCollector: import('./MetricsCollector').MetricsCollector;
  private validationPipeline: import('./ValidationPipeline').ValidationPipeline;
  private memoryManager: import('./MemoryManager').MemoryManager;
  private isInitialized: boolean = false;

  constructor(config: EnterpriseMonitoringConfig = {}) {
    const { HealthCheckManager } = require('./HealthCheckManager');
    const { MetricsCollector } = require('./MetricsCollector');
    const { ValidationPipeline } = require('./ValidationPipeline');
    const { MemoryManager } = require('./MemoryManager');
    
    this.healthManager = new HealthCheckManager(config.healthChecks);
    this.metricsCollector = new MetricsCollector(config.metricsCollection);
    this.validationPipeline = new ValidationPipeline(config.validation);
    this.memoryManager = new MemoryManager(config.memoryManagement);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.healthManager.on('alert', (alert) => {
      console.log(`🚨 Health Alert [${alert.severity}]: ${alert.message}`);
    });

    this.metricsCollector.on('alert', (alert) => {
      console.log(`📊 Metrics Alert [${alert.severity}]: ${alert.message}`);
    });

    this.validationPipeline.on('validationFailed', (result) => {
      console.log(`🛡️ Validation Failed: ${result.errors.length} errors, ${result.warnings.length} warnings`);
    });

    this.memoryManager.on('memoryAlert', (alert) => {
      console.log(`🧠 Memory Alert [${alert.severity}]: ${alert.message}`);
    });
  }

  public async start(): Promise<void> {
    if (this.isInitialized) {
      console.log('Enterprise monitoring is already running');
      return;
    }

    console.log('🚀 Starting Enterprise Monitoring Suite...');

    await this.healthManager.start();
    this.metricsCollector.start();
    this.memoryManager; // Memory manager starts automatically

    this.isInitialized = true;
    console.log('✅ Enterprise Monitoring Suite started successfully');
  }

  public async stop(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    console.log('🛑 Stopping Enterprise Monitoring Suite...');

    await this.healthManager.stop();
    this.metricsCollector.stop();
    this.memoryManager.stop();

    this.isInitialized = false;
    console.log('✅ Enterprise Monitoring Suite stopped successfully');
  }

  public getHealthManager(): import('./HealthCheckManager').HealthCheckManager {
    return this.healthManager;
  }

  public getMetricsCollector(): import('./MetricsCollector').MetricsCollector {
    return this.metricsCollector;
  }

  public getValidationPipeline(): import('./ValidationPipeline').ValidationPipeline {
    return this.validationPipeline;
  }

  public getMemoryManager(): import('./MemoryManager').MemoryManager {
    return this.memoryManager;
  }

  public async getComprehensiveReport(): Promise<MonitoringSummary> {
    const healthStatus = this.healthManager.getSystemHealthSummary();
    const performanceMetrics = this.metricsCollector.getMetricsReport();
    const validationMetrics = this.validationPipeline.getMetrics();
    const memoryReport = this.memoryManager.getMemoryReport();

    const recommendations: string[] = [];
    
    recommendations.push(...healthStatus.recommendations);
    recommendations.push(...performanceMetrics.summary.recommendations);
    recommendations.push(...memoryReport.recommendations);

    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (healthStatus.overallStatus === 'unhealthy' || 
        performanceMetrics.summary.systemHealth === 'critical' ||
        memoryReport.systemMemory.heapUsagePercentage > 90) {
      overallStatus = 'critical';
    } else if (healthStatus.overallStatus === 'degraded' ||
               performanceMetrics.summary.systemHealth === 'warning' ||
               memoryReport.systemMemory.heapUsagePercentage > 80 ||
               validationMetrics.failedValidations / validationMetrics.totalValidations > 0.1) {
      overallStatus = 'warning';
    }

    return {
      timestamp: new Date(),
      healthStatus,
      performanceMetrics,
      validationSummary: {
        totalValidations: validationMetrics.totalValidations,
        successRate: validationMetrics.totalValidations > 0 ? 
          validationMetrics.passedValidations / validationMetrics.totalValidations : 1,
        criticalIssues: validationMetrics.securityViolations
      },
      memoryStatus: {
        heapUsage: memoryReport.systemMemory.heapUsagePercentage,
        poolEfficiency: memoryReport.summary.reuseRate,
        gcActivity: memoryReport.systemMemory.gcStats?.gcCount > 0 ? 
          `${memoryReport.systemMemory.gcStats.gcCount} collections, avg ${memoryReport.systemMemory.gcStats.averageGCTime.toFixed(1)}ms` :
          'No GC activity'
      },
      overallStatus,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  public static create(config?: EnterpriseMonitoringConfig): EnterpriseMonitoring {
    return new EnterpriseMonitoring(config);
  }
}

export const globalEnterpriseMonitoring = EnterpriseMonitoring.create();