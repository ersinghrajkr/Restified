import { TimeoutConfig, TimeoutProfile, EndpointPattern } from '../../RestifiedTypes';

export interface TimeoutStats {
  endpoint: string;
  method: string;
  totalRequests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  fastestResponseTime: number;
  slowestResponseTime: number;
  timeoutCount: number;
  timeoutRate: number;
  lastUpdated: Date;
  responseTimes: number[];
}

export interface TimeoutMetrics {
  endpointId: string;
  currentTimeout: number;
  recommendedTimeout: number;
  adaptiveMultiplier: number;
  confidenceLevel: number;
  performanceTrend: 'improving' | 'degrading' | 'stable';
  lastOptimization: Date;
  optimizationCount: number;
  stats: TimeoutStats;
}

export interface TimeoutRecommendation {
  endpointId: string;
  currentTimeout: number;
  recommendedTimeout: number;
  reason: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  action: 'increase' | 'decrease' | 'maintain';
}

/**
 * Request Timeout Intelligence Manager
 * 
 * Provides context-aware timeout management by:
 * - Analyzing endpoint patterns and historical performance
 * - Adapting timeouts based on response time trends
 * - Recognizing different endpoint types (CRUD, search, analytics, file operations)
 * - Learning from timeout failures and successes
 * - Providing intelligent timeout recommendations
 */
export class TimeoutManager {
  private endpointStats: Map<string, TimeoutStats> = new Map();
  private endpointTimeouts: Map<string, number> = new Map();
  private endpointPatterns: EndpointPattern[] = [];
  private globalConfig: TimeoutConfig;

  private defaultConfig: TimeoutConfig = {
    enabled: true,
    baseTimeout: 30000,
    adaptiveTimeout: true,
    learningEnabled: true,
    minTimeout: 1000,
    maxTimeout: 300000,
    confidenceThreshold: 0.8,
    optimizationInterval: 300000, // 5 minutes
    patternMatching: true,
    performanceTracking: true,
    timeoutMultiplier: 2.5,
    slowRequestThreshold: 0.8
  };

  constructor(config?: Partial<TimeoutConfig>) {
    this.globalConfig = { ...this.defaultConfig, ...config };
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default endpoint patterns for common API patterns
   */
  private initializeDefaultPatterns(): void {
    this.endpointPatterns = [
      // CRUD Operations
      {
        name: 'create',
        pattern: /\/(create|add|insert|post)($|\/|\?)/i,
        methods: ['POST'],
        baseTimeout: 15000,
        multiplier: 1.5,
        description: 'Create/Insert operations'
      },
      {
        name: 'read-list',
        pattern: /\/(list|index|all|get)($|\/|\?)|\/\w+\?.*page|\/\w+\?.*limit/i,
        methods: ['GET'],
        baseTimeout: 10000,
        multiplier: 1.2,
        description: 'List/pagination operations'
      },
      {
        name: 'read-single',
        pattern: /\/\w+\/[\w-]+($|\?)|\/\w+\/\d+($|\?)/i,
        methods: ['GET'],
        baseTimeout: 5000,
        multiplier: 1.0,
        description: 'Single item retrieval'
      },
      {
        name: 'update',
        pattern: /\/(update|edit|modify|put|patch)($|\/|\?)/i,
        methods: ['PUT', 'PATCH'],
        baseTimeout: 12000,
        multiplier: 1.3,
        description: 'Update operations'
      },
      {
        name: 'delete',
        pattern: /\/(delete|remove|destroy)($|\/|\?)/i,
        methods: ['DELETE'],
        baseTimeout: 8000,
        multiplier: 1.1,
        description: 'Delete operations'
      },

      // Specialized Operations
      {
        name: 'search',
        pattern: /\/(search|find|query|filter)($|\/|\?)|[?&]q=|[?&]search=/i,
        methods: ['GET', 'POST'],
        baseTimeout: 20000,
        multiplier: 2.0,
        description: 'Search and query operations'
      },
      {
        name: 'analytics',
        pattern: /\/(analytics|stats|metrics|report|dashboard)($|\/|\?)/i,
        methods: ['GET', 'POST'],
        baseTimeout: 45000,
        multiplier: 3.0,
        description: 'Analytics and reporting'
      },
      {
        name: 'export',
        pattern: /\/(export|download|generate|pdf|excel|csv)($|\/|\?)/i,
        methods: ['GET', 'POST'],
        baseTimeout: 120000,
        multiplier: 5.0,
        description: 'Export and file generation'
      },
      {
        name: 'upload',
        pattern: /\/(upload|import|file)($|\/|\?)/i,
        methods: ['POST', 'PUT'],
        baseTimeout: 90000,
        multiplier: 4.0,
        description: 'File upload operations'
      },
      {
        name: 'auth',
        pattern: /\/(login|auth|oauth|token|verify|validate)($|\/|\?)/i,
        methods: ['POST', 'GET'],
        baseTimeout: 8000,
        multiplier: 1.2,
        description: 'Authentication operations'
      },
      {
        name: 'health',
        pattern: /\/(health|ping|status|alive)($|\/|\?)/i,
        methods: ['GET'],
        baseTimeout: 3000,
        multiplier: 0.8,
        description: 'Health check endpoints'
      },
      {
        name: 'batch',
        pattern: /\/(batch|bulk|mass|multi)($|\/|\?)/i,
        methods: ['POST', 'PUT'],
        baseTimeout: 60000,
        multiplier: 4.0,
        description: 'Batch operations'
      }
    ];
  }

  /**
   * Get intelligent timeout for a specific endpoint
   */
  getTimeoutForEndpoint(
    method: string,
    url: string,
    userTimeout?: number,
    config?: Partial<TimeoutConfig>
  ): number {
    const effectiveConfig = { ...this.globalConfig, ...config };
    
    if (!effectiveConfig.enabled) {
      return userTimeout || effectiveConfig.baseTimeout!;
    }

    const endpointId = this.createEndpointId(method, url);
    
    // Use user-specified timeout if provided and adaptive timeout is disabled
    if (userTimeout && !effectiveConfig.adaptiveTimeout) {
      return userTimeout;
    }

    let timeout = userTimeout || effectiveConfig.baseTimeout!;

    // Apply pattern-based timeout if pattern matching is enabled
    if (effectiveConfig.patternMatching) {
      const patternTimeout = this.getPatternBasedTimeout(method, url, effectiveConfig);
      if (patternTimeout) {
        timeout = patternTimeout;
      }
    }

    // Apply adaptive timeout based on historical data
    if (effectiveConfig.adaptiveTimeout && effectiveConfig.learningEnabled) {
      const adaptiveTimeout = this.getAdaptiveTimeout(endpointId, timeout, effectiveConfig);
      if (adaptiveTimeout) {
        timeout = adaptiveTimeout;
      }
    }

    // Apply bounds
    timeout = Math.max(effectiveConfig.minTimeout!, 
              Math.min(effectiveConfig.maxTimeout!, timeout));

    // Cache the computed timeout
    this.endpointTimeouts.set(endpointId, timeout);
    
    return timeout;
  }

  /**
   * Get pattern-based timeout using endpoint pattern matching
   */
  private getPatternBasedTimeout(
    method: string,
    url: string,
    config: TimeoutConfig
  ): number | null {
    const matchedPattern = this.endpointPatterns.find(pattern => {
      const methodMatch = pattern.methods.includes(method.toUpperCase());
      const urlMatch = pattern.pattern.test(url);
      return methodMatch && urlMatch;
    });

    if (matchedPattern) {
      const baseTimeout = matchedPattern.baseTimeout || config.baseTimeout!;
      const multiplier = matchedPattern.multiplier || 1.0;
      return Math.round(baseTimeout * multiplier);
    }

    return null;
  }

  /**
   * Get adaptive timeout based on historical performance
   */
  private getAdaptiveTimeout(
    endpointId: string,
    baseTimeout: number,
    config: TimeoutConfig
  ): number | null {
    const stats = this.endpointStats.get(endpointId);
    
    if (!stats || stats.totalRequests < 5) {
      // Not enough data for adaptation
      return null;
    }

    const p95Time = stats.p95ResponseTime;
    const timeoutMultiplier = config.timeoutMultiplier || 2.5;
    const adaptiveTimeout = Math.round(p95Time * timeoutMultiplier);

    // Apply confidence-based adjustment
    const confidence = this.calculateConfidence(stats);
    if (confidence >= config.confidenceThreshold!) {
      return adaptiveTimeout;
    }

    // Blend adaptive with base timeout based on confidence
    const blendRatio = confidence / config.confidenceThreshold!;
    return Math.round(adaptiveTimeout * blendRatio + baseTimeout * (1 - blendRatio));
  }

  /**
   * Record response time and timeout events for learning
   */
  recordResponseTime(method: string, url: string, responseTime: number, timedOut: boolean = false): void {
    const endpointId = this.createEndpointId(method, url);
    const stats = this.getOrCreateStats(endpointId, method, url);

    stats.totalRequests++;
    stats.lastUpdated = new Date();

    if (timedOut) {
      stats.timeoutCount++;
    } else {
      // Only record successful response times for calculation
      stats.responseTimes.push(responseTime);
      
      // Keep only last 100 response times to prevent memory issues
      if (stats.responseTimes.length > 100) {
        stats.responseTimes.splice(0, stats.responseTimes.length - 100);
      }

      // Update statistics
      this.updateStatistics(stats);
    }

    stats.timeoutRate = (stats.timeoutCount / stats.totalRequests) * 100;

    // Trigger optimization if interval has passed
    this.checkForOptimization(endpointId, stats);
  }

  /**
   * Update statistical calculations
   */
  private updateStatistics(stats: TimeoutStats): void {
    const times = stats.responseTimes;
    if (times.length === 0) return;

    const sorted = [...times].sort((a, b) => a - b);
    
    stats.averageResponseTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    stats.medianResponseTime = sorted[Math.floor(sorted.length / 2)];
    stats.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
    stats.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1];
    stats.fastestResponseTime = Math.min(...times);
    stats.slowestResponseTime = Math.max(...times);
  }

  /**
   * Calculate confidence level for adaptive timeout
   */
  private calculateConfidence(stats: TimeoutStats): number {
    const requestCount = stats.totalRequests;
    const timeoutRate = stats.timeoutRate;
    
    // Base confidence on request count (more requests = higher confidence)
    let confidence = Math.min(requestCount / 50, 1.0); // Max confidence at 50 requests
    
    // Reduce confidence if timeout rate is high
    if (timeoutRate > 10) {
      confidence *= 0.5; // High timeout rate reduces confidence
    } else if (timeoutRate > 5) {
      confidence *= 0.8; // Moderate timeout rate
    }
    
    // Boost confidence for stable endpoints
    const responseVariation = stats.slowestResponseTime > 0 ? 
      (stats.slowestResponseTime - stats.fastestResponseTime) / stats.averageResponseTime : 0;
    
    if (responseVariation < 0.5) {
      confidence *= 1.2; // Stable response times boost confidence
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Check if optimization should be triggered
   */
  private checkForOptimization(endpointId: string, stats: TimeoutStats): void {
    const config = this.globalConfig;
    const lastOptimization = new Date(stats.lastUpdated.getTime() - (config.optimizationInterval || 300000));
    
    if (stats.lastUpdated > lastOptimization && stats.totalRequests >= 10) {
      this.optimizeTimeout(endpointId, stats);
    }
  }

  /**
   * Optimize timeout for an endpoint
   */
  private optimizeTimeout(endpointId: string, stats: TimeoutStats): void {
    const currentTimeout = this.endpointTimeouts.get(endpointId) || this.globalConfig.baseTimeout!;
    const recommendedTimeout = this.calculateRecommendedTimeout(stats);
    
    if (Math.abs(recommendedTimeout - currentTimeout) > currentTimeout * 0.2) {
      // Significant difference, update timeout
      this.endpointTimeouts.set(endpointId, recommendedTimeout);
      
      if (process.env.DEBUG_RESTIFIED_TIMEOUTS === 'true') {
        console.log(`⚡ Timeout optimized for ${endpointId}: ${currentTimeout}ms → ${recommendedTimeout}ms`);
      }
    }
  }

  /**
   * Calculate recommended timeout based on statistics
   */
  private calculateRecommendedTimeout(stats: TimeoutStats): number {
    const multiplier = this.globalConfig.timeoutMultiplier || 2.5;
    const baseRecommendation = Math.round(stats.p95ResponseTime * multiplier);
    
    // Apply adjustments based on timeout rate
    let adjustment = 1.0;
    if (stats.timeoutRate > 5) {
      adjustment = 1.5; // Increase timeout if we're seeing timeouts
    } else if (stats.timeoutRate === 0 && stats.totalRequests > 20) {
      adjustment = 0.9; // Slightly decrease if no timeouts and good sample size
    }
    
    return Math.round(baseRecommendation * adjustment);
  }

  /**
   * Get or create stats for an endpoint
   */
  private getOrCreateStats(endpointId: string, method: string, endpoint: string): TimeoutStats {
    if (!this.endpointStats.has(endpointId)) {
      const stats: TimeoutStats = {
        endpoint,
        method,
        totalRequests: 0,
        averageResponseTime: 0,
        medianResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        fastestResponseTime: 0,
        slowestResponseTime: 0,
        timeoutCount: 0,
        timeoutRate: 0,
        lastUpdated: new Date(),
        responseTimes: []
      };
      this.endpointStats.set(endpointId, stats);
    }
    
    return this.endpointStats.get(endpointId)!;
  }

  /**
   * Create consistent endpoint ID
   */
  private createEndpointId(method: string, url: string): string {
    // Normalize URL to remove query parameters and create consistent ID
    const baseUrl = url.split('?')[0];
    return `${method.toUpperCase()}:${baseUrl}`;
  }

  /**
   * Get timeout statistics for an endpoint
   */
  getTimeoutStats(endpointId?: string): Map<string, TimeoutStats> | TimeoutStats | null {
    if (endpointId) {
      return this.endpointStats.get(endpointId) || null;
    }
    return new Map(this.endpointStats);
  }

  /**
   * Get timeout metrics with recommendations
   */
  getTimeoutMetrics(endpointId: string): TimeoutMetrics | null {
    const stats = this.endpointStats.get(endpointId);
    if (!stats) return null;

    const currentTimeout = this.endpointTimeouts.get(endpointId) || this.globalConfig.baseTimeout!;
    const recommendedTimeout = this.calculateRecommendedTimeout(stats);
    const confidence = this.calculateConfidence(stats);
    const trend = this.calculatePerformanceTrend(stats);

    return {
      endpointId,
      currentTimeout,
      recommendedTimeout,
      adaptiveMultiplier: recommendedTimeout / stats.p95ResponseTime,
      confidenceLevel: confidence,
      performanceTrend: trend,
      lastOptimization: stats.lastUpdated,
      optimizationCount: Math.floor(stats.totalRequests / 10),
      stats: { ...stats }
    };
  }

  /**
   * Calculate performance trend
   */
  private calculatePerformanceTrend(stats: TimeoutStats): 'improving' | 'degrading' | 'stable' {
    const recentTimes = stats.responseTimes.slice(-20); // Last 20 requests
    const olderTimes = stats.responseTimes.slice(-40, -20); // Previous 20 requests
    
    if (recentTimes.length < 5 || olderTimes.length < 5) {
      return 'stable';
    }
    
    const recentAvg = recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
    const olderAvg = olderTimes.reduce((sum, time) => sum + time, 0) / olderTimes.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.2) return 'degrading';
    if (change < -0.2) return 'improving';
    return 'stable';
  }

  /**
   * Get timeout recommendations for all endpoints
   */
  getTimeoutRecommendations(): TimeoutRecommendation[] {
    const recommendations: TimeoutRecommendation[] = [];
    
    for (const [endpointId, stats] of this.endpointStats.entries()) {
      if (stats.totalRequests < 5) continue; // Skip endpoints with insufficient data
      
      const currentTimeout = this.endpointTimeouts.get(endpointId) || this.globalConfig.baseTimeout!;
      const recommendedTimeout = this.calculateRecommendedTimeout(stats);
      const confidence = this.calculateConfidence(stats);
      
      const difference = recommendedTimeout - currentTimeout;
      const percentageChange = Math.abs(difference / currentTimeout);
      
      if (percentageChange > 0.15) { // Only recommend if change is significant
        let reason = '';
        let action: 'increase' | 'decrease' | 'maintain' = 'maintain';
        let impact: 'low' | 'medium' | 'high' = 'low';
        
        if (difference > 0) {
          action = 'increase';
          reason = `High timeout rate (${stats.timeoutRate.toFixed(1)}%) suggests timeout is too low`;
          impact = stats.timeoutRate > 10 ? 'high' : 'medium';
        } else {
          action = 'decrease';
          reason = `No timeouts with good performance suggests timeout can be reduced`;
          impact = 'low';
        }
        
        recommendations.push({
          endpointId,
          currentTimeout,
          recommendedTimeout,
          reason,
          confidence,
          impact,
          action
        });
      }
    }
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Add custom endpoint pattern
   */
  addEndpointPattern(pattern: EndpointPattern): void {
    this.endpointPatterns.push(pattern);
  }

  /**
   * Update global timeout configuration
   */
  updateConfig(config: Partial<TimeoutConfig>): void {
    this.globalConfig = { ...this.globalConfig, ...config };
  }

  /**
   * Reset timeout statistics
   */
  resetStats(endpointId?: string): void {
    if (endpointId) {
      this.endpointStats.delete(endpointId);
      this.endpointTimeouts.delete(endpointId);
    } else {
      this.endpointStats.clear();
      this.endpointTimeouts.clear();
    }
  }

  /**
   * Get all tracked endpoint IDs
   */
  getAllEndpointIds(): string[] {
    return Array.from(this.endpointStats.keys());
  }

  /**
   * Force set timeout for an endpoint
   */
  setTimeoutForEndpoint(method: string, url: string, timeout: number): void {
    const endpointId = this.createEndpointId(method, url);
    this.endpointTimeouts.set(endpointId, timeout);
  }

  /**
   * Get current effective timeout for an endpoint
   */
  getCurrentTimeout(method: string, url: string): number | null {
    const endpointId = this.createEndpointId(method, url);
    return this.endpointTimeouts.get(endpointId) || null;
  }
}

// Global timeout manager instance
export const globalTimeoutManager = new TimeoutManager();