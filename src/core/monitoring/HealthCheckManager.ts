import { EventEmitter } from 'events';

export interface HealthCheckConfig {
  enabled?: boolean;
  interval?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  endpoints?: EndpointHealthCheck[];
  alertThresholds?: AlertThresholds;
  notifications?: NotificationConfig;
}

export interface EndpointHealthCheck {
  id: string;
  name: string;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number | number[];
  expectedResponseTime?: number;
  healthyResponsePattern?: RegExp | string;
  enabled?: boolean;
  interval?: number;
  timeout?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface AlertThresholds {
  responseTime?: number;
  failureRate?: number;
  consecutiveFailures?: number;
  uptimePercentage?: number;
}

export interface NotificationConfig {
  enabled?: boolean;
  webhookUrl?: string;
  emailRecipients?: string[];
  slackChannel?: string;
  customHandlers?: Array<(alert: HealthAlert) => void>;
}

export interface HealthStatus {
  id: string;
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  responseTime: number;
  lastCheck: Date;
  lastSuccess: Date | null;
  consecutiveFailures: number;
  totalChecks: number;
  successCount: number;
  failureCount: number;
  uptime: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorDetails?: {
    code?: string;
    message?: string;
    statusCode?: number;
    timestamp: Date;
  };
  trends: {
    responseTimeTrend: 'improving' | 'degrading' | 'stable';
    uptimeTrend: 'improving' | 'degrading' | 'stable';
    last24h: { timestamp: Date; status: string; responseTime: number }[];
  };
}

export interface HealthAlert {
  id: string;
  endpointId: string;
  type: 'failure' | 'degraded_performance' | 'recovery' | 'consecutive_failures';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SystemHealthSummary {
  overallStatus: 'healthy' | 'unhealthy' | 'degraded';
  totalEndpoints: number;
  healthyEndpoints: number;
  unhealthyEndpoints: number;
  degradedEndpoints: number;
  systemUptime: number;
  averageResponseTime: number;
  totalChecks: number;
  lastUpdateTime: Date;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}

export class HealthCheckManager extends EventEmitter {
  private config: Required<HealthCheckConfig>;
  private healthStatuses: Map<string, HealthStatus> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;
  private startTime: Date = new Date();
  private responseTimeHistory: Map<string, number[]> = new Map();

  constructor(config: HealthCheckConfig = {}) {
    super();
    this.config = {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      endpoints: [],
      alertThresholds: {
        responseTime: 5000,
        failureRate: 0.1,
        consecutiveFailures: 3,
        uptimePercentage: 99.0
      },
      notifications: {
        enabled: false,
        customHandlers: []
      },
      ...config
    };

    this.initializeHealthStatuses();
  }

  private initializeHealthStatuses(): void {
    this.config.endpoints.forEach(endpoint => {
      this.healthStatuses.set(endpoint.id, {
        id: endpoint.id,
        name: endpoint.name,
        status: 'unknown',
        responseTime: 0,
        lastCheck: new Date(),
        lastSuccess: null,
        consecutiveFailures: 0,
        totalChecks: 0,
        successCount: 0,
        failureCount: 0,
        uptime: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        trends: {
          responseTimeTrend: 'stable',
          uptimeTrend: 'stable',
          last24h: []
        }
      });
      this.responseTimeHistory.set(endpoint.id, []);
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Health check manager is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('Health check manager is disabled');
      return;
    }

    this.isRunning = true;
    this.startTime = new Date();
    
    console.log(`🏥 Starting health check manager with ${this.config.endpoints.length} endpoints`);

    for (const endpoint of this.config.endpoints) {
      if (endpoint.enabled !== false) {
        await this.startEndpointMonitoring(endpoint);
      }
    }

    this.emit('started', { timestamp: new Date(), endpointsCount: this.config.endpoints.length });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    for (const [endpointId, intervalId] of this.checkIntervals) {
      clearInterval(intervalId);
    }
    this.checkIntervals.clear();

    console.log('🛑 Health check manager stopped');
    this.emit('stopped', { timestamp: new Date() });
  }

  private async startEndpointMonitoring(endpoint: EndpointHealthCheck): Promise<void> {
    const interval = endpoint.interval || this.config.interval;
    
    const performCheck = async () => {
      await this.performHealthCheck(endpoint);
    };

    await performCheck();

    const intervalId = setInterval(performCheck, interval);
    this.checkIntervals.set(endpoint.id, intervalId);
  }

  private async performHealthCheck(endpoint: EndpointHealthCheck): Promise<void> {
    const startTime = Date.now();
    let status = this.healthStatuses.get(endpoint.id)!;
    
    status.totalChecks++;
    status.lastCheck = new Date();

    try {
      const response = await this.executeHealthCheck(endpoint);
      const responseTime = Date.now() - startTime;
      
      this.updateSuccessMetrics(endpoint.id, responseTime);
      this.updateResponseTimeHistory(endpoint.id, responseTime);
      
      const isHealthy = this.evaluateHealthStatus(endpoint, response, responseTime);
      
      if (isHealthy) {
        status.status = 'healthy';
        status.lastSuccess = new Date();
        status.consecutiveFailures = 0;
        status.successCount++;
        
        if (status.failureCount > 0) {
          this.emitAlert({
            id: `recovery-${endpoint.id}-${Date.now()}`,
            endpointId: endpoint.id,
            type: 'recovery',
            severity: 'info',
            message: `Endpoint ${endpoint.name} has recovered`,
            timestamp: new Date()
          });
        }
      } else {
        this.handleUnhealthyEndpoint(endpoint, status, 'Endpoint check failed validation');
      }
      
    } catch (error: any) {
      this.handleUnhealthyEndpoint(endpoint, status, error.message, error);
    }
    
    this.updateTrends(endpoint.id);
    this.healthStatuses.set(endpoint.id, status);
    this.emit('healthCheckCompleted', { endpointId: endpoint.id, status: status.status });
  }

  private async executeHealthCheck(endpoint: EndpointHealthCheck): Promise<Response> {
    const timeout = endpoint.timeout || this.config.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method || 'GET',
        headers: endpoint.headers || {},
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private evaluateHealthStatus(endpoint: EndpointHealthCheck, response: Response, responseTime: number): boolean {
    const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
      ? endpoint.expectedStatus 
      : [endpoint.expectedStatus || 200];
    
    if (!expectedStatuses.includes(response.status)) {
      return false;
    }

    if (endpoint.expectedResponseTime && responseTime > endpoint.expectedResponseTime) {
      return false;
    }

    return true;
  }

  private handleUnhealthyEndpoint(endpoint: EndpointHealthCheck, status: HealthStatus, message: string, error?: any): void {
    status.consecutiveFailures++;
    status.failureCount++;
    status.errorDetails = {
      message,
      code: error?.code,
      statusCode: error?.status,
      timestamp: new Date()
    };

    if (status.consecutiveFailures >= (this.config.alertThresholds.consecutiveFailures || 3)) {
      status.status = 'unhealthy';
    } else {
      status.status = 'degraded';
    }

    this.emitAlert({
      id: `failure-${endpoint.id}-${Date.now()}`,
      endpointId: endpoint.id,
      type: status.consecutiveFailures >= 3 ? 'consecutive_failures' : 'failure',
      severity: endpoint.priority === 'critical' ? 'critical' : 'warning',
      message: `${endpoint.name}: ${message} (${status.consecutiveFailures} consecutive failures)`,
      timestamp: new Date(),
      metadata: { error: error?.message, statusCode: error?.status }
    });
  }

  private updateSuccessMetrics(endpointId: string, responseTime: number): void {
    const status = this.healthStatuses.get(endpointId)!;
    status.responseTime = responseTime;
    
    const totalResponseTime = (status.averageResponseTime * (status.successCount - 1)) + responseTime;
    status.averageResponseTime = Math.round(totalResponseTime / status.successCount);
    
    status.uptime = (status.successCount / status.totalChecks) * 100;
  }

  private updateResponseTimeHistory(endpointId: string, responseTime: number): void {
    let history = this.responseTimeHistory.get(endpointId) || [];
    history.push(responseTime);
    
    if (history.length > 1000) {
      history = history.slice(-1000);
    }
    
    this.responseTimeHistory.set(endpointId, history);
    
    if (history.length >= 20) {
      const sorted = [...history].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);
      
      const status = this.healthStatuses.get(endpointId)!;
      status.p95ResponseTime = sorted[p95Index];
      status.p99ResponseTime = sorted[p99Index];
    }
  }

  private updateTrends(endpointId: string): void {
    const status = this.healthStatuses.get(endpointId)!;
    const now = new Date();
    
    status.trends.last24h.push({
      timestamp: now,
      status: status.status,
      responseTime: status.responseTime
    });
    
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    status.trends.last24h = status.trends.last24h.filter(
      entry => entry.timestamp > twentyFourHoursAgo
    );
    
    if (status.trends.last24h.length >= 10) {
      const recent = status.trends.last24h.slice(-5);
      const earlier = status.trends.last24h.slice(-10, -5);
      
      const recentAvgResponseTime = recent.reduce((sum, entry) => sum + entry.responseTime, 0) / recent.length;
      const earlierAvgResponseTime = earlier.reduce((sum, entry) => sum + entry.responseTime, 0) / earlier.length;
      
      if (recentAvgResponseTime > earlierAvgResponseTime * 1.2) {
        status.trends.responseTimeTrend = 'degrading';
      } else if (recentAvgResponseTime < earlierAvgResponseTime * 0.8) {
        status.trends.responseTimeTrend = 'improving';
      } else {
        status.trends.responseTimeTrend = 'stable';
      }
      
      const recentHealthyCount = recent.filter(entry => entry.status === 'healthy').length;
      const earlierHealthyCount = earlier.filter(entry => entry.status === 'healthy').length;
      
      if (recentHealthyCount > earlierHealthyCount) {
        status.trends.uptimeTrend = 'improving';
      } else if (recentHealthyCount < earlierHealthyCount) {
        status.trends.uptimeTrend = 'degrading';
      } else {
        status.trends.uptimeTrend = 'stable';
      }
    }
  }

  private emitAlert(alert: HealthAlert): void {
    this.emit('alert', alert);
    
    if (this.config.notifications.enabled) {
      this.processNotification(alert);
    }
  }

  private async processNotification(alert: HealthAlert): Promise<void> {
    const notifications = this.config.notifications;
    
    if (notifications.customHandlers) {
      notifications.customHandlers.forEach(handler => {
        try {
          handler(alert);
        } catch (error) {
          console.error('Error in custom notification handler:', error);
        }
      });
    }

    if (notifications.webhookUrl) {
      try {
        await fetch(notifications.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }
  }

  public addEndpoint(endpoint: EndpointHealthCheck): void {
    this.config.endpoints.push(endpoint);
    
    this.healthStatuses.set(endpoint.id, {
      id: endpoint.id,
      name: endpoint.name,
      status: 'unknown',
      responseTime: 0,
      lastCheck: new Date(),
      lastSuccess: null,
      consecutiveFailures: 0,
      totalChecks: 0,
      successCount: 0,
      failureCount: 0,
      uptime: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      trends: {
        responseTimeTrend: 'stable',
        uptimeTrend: 'stable',
        last24h: []
      }
    });
    
    this.responseTimeHistory.set(endpoint.id, []);
    
    if (this.isRunning && endpoint.enabled !== false) {
      this.startEndpointMonitoring(endpoint);
    }
  }

  public removeEndpoint(endpointId: string): void {
    const intervalId = this.checkIntervals.get(endpointId);
    if (intervalId) {
      clearInterval(intervalId);
      this.checkIntervals.delete(endpointId);
    }
    
    this.healthStatuses.delete(endpointId);
    this.responseTimeHistory.delete(endpointId);
    this.config.endpoints = this.config.endpoints.filter(ep => ep.id !== endpointId);
  }

  public getEndpointStatus(endpointId: string): HealthStatus | null {
    return this.healthStatuses.get(endpointId) || null;
  }

  public getAllStatuses(): Map<string, HealthStatus> {
    return new Map(this.healthStatuses);
  }

  public getSystemHealthSummary(): SystemHealthSummary {
    const statuses = Array.from(this.healthStatuses.values());
    const healthyCount = statuses.filter(s => s.status === 'healthy').length;
    const unhealthyCount = statuses.filter(s => s.status === 'unhealthy').length;
    const degradedCount = statuses.filter(s => s.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }
    
    const totalResponseTime = statuses.reduce((sum, s) => sum + s.averageResponseTime, 0);
    const averageResponseTime = statuses.length > 0 ? Math.round(totalResponseTime / statuses.length) : 0;
    
    const totalChecks = statuses.reduce((sum, s) => sum + s.totalChecks, 0);
    
    const systemUptimeMs = Date.now() - this.startTime.getTime();
    const systemUptime = (systemUptimeMs / (1000 * 60 * 60 * 24)) * 100;
    
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    statuses.forEach(status => {
      if (status.status === 'unhealthy') {
        criticalIssues.push(`${status.name} is unhealthy: ${status.errorDetails?.message || 'Unknown error'}`);
      }
      
      if (status.status === 'degraded') {
        warnings.push(`${status.name} is degraded (${status.consecutiveFailures} consecutive failures)`);
      }
      
      if (status.averageResponseTime > (this.config.alertThresholds.responseTime || 5000)) {
        warnings.push(`${status.name} has high response time: ${status.averageResponseTime}ms`);
      }
      
      if (status.uptime < (this.config.alertThresholds.uptimePercentage || 99)) {
        recommendations.push(`Consider investigating ${status.name} - uptime is ${status.uptime.toFixed(2)}%`);
      }
      
      if (status.trends.responseTimeTrend === 'degrading') {
        recommendations.push(`${status.name} response time is trending worse - investigate performance`);
      }
    });
    
    return {
      overallStatus,
      totalEndpoints: statuses.length,
      healthyEndpoints: healthyCount,
      unhealthyEndpoints: unhealthyCount,
      degradedEndpoints: degradedCount,
      systemUptime: Math.min(systemUptime, 100),
      averageResponseTime,
      totalChecks,
      lastUpdateTime: new Date(),
      criticalIssues,
      warnings,
      recommendations
    };
  }

  public async forceCheck(endpointId?: string): Promise<void> {
    if (endpointId) {
      const endpoint = this.config.endpoints.find(ep => ep.id === endpointId);
      if (endpoint) {
        await this.performHealthCheck(endpoint);
      }
    } else {
      const checkPromises = this.config.endpoints.map(endpoint => 
        this.performHealthCheck(endpoint)
      );
      await Promise.all(checkPromises);
    }
  }

  public updateConfig(newConfig: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.endpoints) {
      this.stop();
      this.initializeHealthStatuses();
      if (this.isRunning) {
        this.start();
      }
    }
  }

  public exportMetrics(): {
    summary: SystemHealthSummary;
    detailedStats: HealthStatus[];
    configuration: HealthCheckConfig;
    responseTimeHistograms: Record<string, number[]>;
  } {
    return {
      summary: this.getSystemHealthSummary(),
      detailedStats: Array.from(this.healthStatuses.values()),
      configuration: this.config,
      responseTimeHistograms: Object.fromEntries(this.responseTimeHistory)
    };
  }

  public static create(config?: HealthCheckConfig): HealthCheckManager {
    return new HealthCheckManager(config);
  }
}

export const globalHealthCheckManager = HealthCheckManager.create();