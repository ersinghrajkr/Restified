import { CircuitBreakerConfig, CircuitBreakerState } from '../../RestifiedTypes';

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  openedAt: Date | null;
  halfOpenAttempts: number;
  stateTransitions: {
    closedToOpen: number;
    openToHalfOpen: number;
    halfOpenToClosed: number;
    halfOpenToOpen: number;
  };
}

export interface CircuitBreakerMetrics {
  circuitId: string;
  stats: CircuitBreakerStats;
  config: CircuitBreakerConfig;
  uptime: number;
  availabilityPercentage: number;
  meanTimeToRecovery: number;
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
}

/**
 * Circuit Breaker Pattern Implementation for Network Resilience
 * 
 * Implements the Circuit Breaker pattern to prevent cascade failures by:
 * - Monitoring failure rates and response times
 * - Opening circuit when failure threshold is exceeded
 * - Allowing limited requests in half-open state to test recovery
 * - Automatically closing circuit when service recovers
 * 
 * States:
 * - CLOSED: Normal operation, all requests pass through
 * - OPEN: Circuit is open, requests fail fast without hitting service
 * - HALF_OPEN: Limited requests allowed to test if service has recovered
 */
export class CircuitBreakerManager {
  private circuits: Map<string, CircuitBreakerStats> = new Map();
  private configs: Map<string, CircuitBreakerConfig> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private responseTimes: Map<string, number[]> = new Map();

  private defaultConfig: CircuitBreakerConfig = {
    enabled: true,
    failureThreshold: 5,
    failureThresholdPercentage: 50,
    requestVolumeThreshold: 10,
    timeoutDuration: 30000,
    resetTimeoutDuration: 60000,
    halfOpenMaxAttempts: 3,
    monitoringPeriod: 60000,
    responseTimeThreshold: 5000
  };

  /**
   * Execute a function with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    circuitId: string,
    requestFunction: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitConfig = this.getOrCreateConfig(circuitId, config);
    const stats = this.getOrCreateStats(circuitId);

    // Check if circuit breaker is disabled
    if (!circuitConfig.enabled) {
      return await this.executeRequest(circuitId, requestFunction);
    }

    // Check circuit state
    const currentState = this.getCurrentState(circuitId);
    
    switch (currentState) {
      case 'CLOSED':
        return await this.executeInClosedState(circuitId, requestFunction);
      
      case 'OPEN':
        return await this.executeInOpenState(circuitId, requestFunction);
      
      case 'HALF_OPEN':
        return await this.executeInHalfOpenState(circuitId, requestFunction);
      
      default:
        throw new Error(`Unknown circuit breaker state: ${currentState}`);
    }
  }

  /**
   * Execute request in CLOSED state (normal operation)
   */
  private async executeInClosedState<T>(
    circuitId: string,
    requestFunction: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await this.executeRequest(circuitId, requestFunction);
      this.recordSuccess(circuitId);
      return result;
    } catch (error) {
      this.recordFailure(circuitId);
      
      // Check if we should open the circuit
      if (this.shouldOpenCircuit(circuitId)) {
        this.openCircuit(circuitId);
      }
      
      throw error;
    }
  }

  /**
   * Execute request in OPEN state (fail fast)
   */
  private async executeInOpenState<T>(
    circuitId: string,
    requestFunction: () => Promise<T>
  ): Promise<T> {
    const config = this.configs.get(circuitId)!;
    const stats = this.circuits.get(circuitId)!;
    
    // Check if reset timeout has elapsed
    if (stats.openedAt && 
        Date.now() - stats.openedAt.getTime() >= config.resetTimeoutDuration!) {
      this.transitionToHalfOpen(circuitId);
      return await this.executeInHalfOpenState(circuitId, requestFunction);
    }

    // Circuit is open, fail fast
    const error = new Error(`Circuit breaker '${circuitId}' is OPEN. Failing fast to protect downstream service.`);
    (error as any).circuitBreakerState = 'OPEN';
    (error as any).circuitId = circuitId;
    
    // Execute onCircuitOpen callback if provided
    if (config.onCircuitOpen) {
      await config.onCircuitOpen(circuitId, stats);
    }
    
    throw error;
  }

  /**
   * Execute request in HALF_OPEN state (testing recovery)
   */
  private async executeInHalfOpenState<T>(
    circuitId: string,
    requestFunction: () => Promise<T>
  ): Promise<T> {
    const config = this.configs.get(circuitId)!;
    const stats = this.circuits.get(circuitId)!;

    // Check if we've exceeded max half-open attempts
    if (stats.halfOpenAttempts >= config.halfOpenMaxAttempts!) {
      this.reopenCircuit(circuitId);
      return await this.executeInOpenState(circuitId, requestFunction);
    }

    stats.halfOpenAttempts++;

    try {
      const result = await this.executeRequest(circuitId, requestFunction);
      this.recordSuccess(circuitId);
      
      // If we have enough successful requests, close the circuit
      if (this.shouldCloseCircuit(circuitId)) {
        this.closeCircuit(circuitId);
      }
      
      return result;
    } catch (error) {
      this.recordFailure(circuitId);
      this.reopenCircuit(circuitId);
      throw error;
    }
  }

  /**
   * Execute the actual request with timing
   */
  private async executeRequest<T>(
    circuitId: string,
    requestFunction: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const config = this.configs.get(circuitId)!;

    try {
      // Set timeout if configured
      let timeoutHandle: NodeJS.Timeout | null = null;
      let isTimedOut = false;

      const timeoutPromise = config.timeoutDuration ? 
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            isTimedOut = true;
            reject(new Error(`Circuit breaker timeout after ${config.timeoutDuration}ms`));
          }, config.timeoutDuration);
        }) : null;

      const resultPromise = requestFunction();
      
      const result = timeoutPromise ? 
        await Promise.race([resultPromise, timeoutPromise]) :
        await resultPromise;

      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      // Record response time
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(circuitId, responseTime);

      // Check if response time exceeds threshold
      if (config.responseTimeThreshold && responseTime > config.responseTimeThreshold) {
        throw new Error(`Response time ${responseTime}ms exceeded threshold ${config.responseTimeThreshold}ms`);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(circuitId, responseTime);
      throw error;
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(circuitId: string): void {
    const stats = this.circuits.get(circuitId)!;
    stats.successCount++;
    stats.totalRequests++;
    stats.lastSuccessTime = new Date();
  }

  /**
   * Record failed request
   */
  private recordFailure(circuitId: string): void {
    const stats = this.circuits.get(circuitId)!;
    stats.failureCount++;
    stats.totalRequests++;
    stats.lastFailureTime = new Date();
  }

  /**
   * Record response time for metrics
   */
  private recordResponseTime(circuitId: string, responseTime: number): void {
    if (!this.responseTimes.has(circuitId)) {
      this.responseTimes.set(circuitId, []);
    }
    
    const times = this.responseTimes.get(circuitId)!;
    times.push(responseTime);
    
    // Keep only last 1000 response times to prevent memory issues
    if (times.length > 1000) {
      times.splice(0, times.length - 1000);
    }
  }

  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(circuitId: string): boolean {
    const config = this.configs.get(circuitId)!;
    const stats = this.circuits.get(circuitId)!;

    // Need minimum request volume
    if (stats.totalRequests < config.requestVolumeThreshold!) {
      return false;
    }

    // Check failure threshold (absolute)
    if (stats.failureCount >= config.failureThreshold!) {
      return true;
    }

    // Check failure threshold (percentage)
    const failureRate = (stats.failureCount / stats.totalRequests) * 100;
    return failureRate >= config.failureThresholdPercentage!;
  }

  /**
   * Check if circuit should be closed (from half-open)
   */
  private shouldCloseCircuit(circuitId: string): boolean {
    const config = this.configs.get(circuitId)!;
    const stats = this.circuits.get(circuitId)!;

    // Need successful attempts in half-open state
    return stats.halfOpenAttempts >= Math.min(config.halfOpenMaxAttempts!, 3) &&
           stats.successCount > 0;
  }

  /**
   * Open the circuit
   */
  private openCircuit(circuitId: string): void {
    const stats = this.circuits.get(circuitId)!;
    const config = this.configs.get(circuitId)!;
    
    stats.state = 'OPEN';
    stats.openedAt = new Date();
    stats.stateTransitions.closedToOpen++;
    
    console.warn(`⚠️ Circuit breaker '${circuitId}' opened due to failures. Failing fast for ${config.resetTimeoutDuration}ms.`);
    
    // Set timer to transition to half-open
    this.setResetTimer(circuitId);
  }

  /**
   * Close the circuit (recovery)
   */
  private closeCircuit(circuitId: string): void {
    const stats = this.circuits.get(circuitId)!;
    
    stats.state = 'CLOSED';
    stats.failureCount = 0; // Reset failure count
    stats.halfOpenAttempts = 0;
    stats.stateTransitions.halfOpenToClosed++;
    
    console.log(`✅ Circuit breaker '${circuitId}' closed. Service has recovered.`);
    
    // Clear reset timer
    const timer = this.timers.get(circuitId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(circuitId);
    }
  }

  /**
   * Transition to half-open state
   */
  private transitionToHalfOpen(circuitId: string): void {
    const stats = this.circuits.get(circuitId)!;
    
    stats.state = 'HALF_OPEN';
    stats.halfOpenAttempts = 0;
    stats.stateTransitions.openToHalfOpen++;
    
    console.log(`🔄 Circuit breaker '${circuitId}' transitioned to HALF_OPEN. Testing service recovery.`);
  }

  /**
   * Reopen the circuit (from half-open back to open)
   */
  private reopenCircuit(circuitId: string): void {
    const stats = this.circuits.get(circuitId)!;
    
    stats.state = 'OPEN';
    stats.openedAt = new Date();
    stats.halfOpenAttempts = 0;
    stats.stateTransitions.halfOpenToOpen++;
    
    console.warn(`⚠️ Circuit breaker '${circuitId}' reopened. Service still failing.`);
    
    // Set timer to transition to half-open again
    this.setResetTimer(circuitId);
  }

  /**
   * Set reset timer
   */
  private setResetTimer(circuitId: string): void {
    const config = this.configs.get(circuitId)!;
    
    // Clear existing timer
    const existingTimer = this.timers.get(circuitId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.transitionToHalfOpen(circuitId);
      this.timers.delete(circuitId);
    }, config.resetTimeoutDuration!);
    
    this.timers.set(circuitId, timer);
  }

  /**
   * Get current circuit state
   */
  getCurrentState(circuitId: string): CircuitBreakerState {
    const stats = this.circuits.get(circuitId);
    return stats ? stats.state : 'CLOSED';
  }

  /**
   * Get or create circuit configuration
   */
  private getOrCreateConfig(circuitId: string, config?: Partial<CircuitBreakerConfig>): CircuitBreakerConfig {
    if (!this.configs.has(circuitId)) {
      const mergedConfig = { ...this.defaultConfig, ...config };
      this.configs.set(circuitId, mergedConfig);
    } else if (config) {
      // Update existing config with new values
      const existingConfig = this.configs.get(circuitId)!;
      this.configs.set(circuitId, { ...existingConfig, ...config });
    }
    
    return this.configs.get(circuitId)!;
  }

  /**
   * Get or create circuit stats
   */
  private getOrCreateStats(circuitId: string): CircuitBreakerStats {
    if (!this.circuits.has(circuitId)) {
      const stats: CircuitBreakerStats = {
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
        totalRequests: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
        openedAt: null,
        halfOpenAttempts: 0,
        stateTransitions: {
          closedToOpen: 0,
          openToHalfOpen: 0,
          halfOpenToClosed: 0,
          halfOpenToOpen: 0
        }
      };
      this.circuits.set(circuitId, stats);
    }
    
    return this.circuits.get(circuitId)!;
  }

  /**
   * Get circuit statistics
   */
  getStats(circuitId?: string): Map<string, CircuitBreakerStats> | CircuitBreakerStats | null {
    if (circuitId) {
      return this.circuits.get(circuitId) || null;
    }
    return new Map(this.circuits);
  }

  /**
   * Get circuit metrics with calculated values
   */
  getMetrics(circuitId: string): CircuitBreakerMetrics | null {
    const stats = this.circuits.get(circuitId);
    const config = this.configs.get(circuitId);
    
    if (!stats || !config) {
      return null;
    }

    const uptime = stats.openedAt ? 
      Date.now() - stats.openedAt.getTime() : Date.now();
    
    const availabilityPercentage = stats.totalRequests > 0 ? 
      (stats.successCount / stats.totalRequests) * 100 : 100;
    
    const meanTimeToRecovery = this.calculateMeanTimeToRecovery(circuitId);
    
    const responseTimePercentiles = this.calculateResponseTimePercentiles(circuitId);

    return {
      circuitId,
      stats: { ...stats },
      config: { ...config },
      uptime,
      availabilityPercentage,
      meanTimeToRecovery,
      responseTimeP50: responseTimePercentiles.p50,
      responseTimeP95: responseTimePercentiles.p95,
      responseTimeP99: responseTimePercentiles.p99
    };
  }

  /**
   * Calculate mean time to recovery
   */
  private calculateMeanTimeToRecovery(circuitId: string): number {
    const stats = this.circuits.get(circuitId)!;
    const transitions = stats.stateTransitions;
    
    if (transitions.closedToOpen === 0) {
      return 0;
    }
    
    // Simple calculation - in production, you'd track actual recovery times
    return (transitions.openToHalfOpen + transitions.halfOpenToClosed) / transitions.closedToOpen * 60000;
  }

  /**
   * Calculate response time percentiles
   */
  private calculateResponseTimePercentiles(circuitId: string): { p50: number; p95: number; p99: number } {
    const times = this.responseTimes.get(circuitId) || [];
    
    if (times.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }
    
    const sorted = [...times].sort((a, b) => a - b);
    
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    return { p50, p95, p99 };
  }

  /**
   * Update circuit configuration
   */
  updateConfig(circuitId: string, config: Partial<CircuitBreakerConfig>): void {
    const existingConfig = this.configs.get(circuitId) || this.defaultConfig;
    this.configs.set(circuitId, { ...existingConfig, ...config });
  }

  /**
   * Reset circuit statistics
   */
  resetStats(circuitId?: string): void {
    if (circuitId) {
      this.circuits.delete(circuitId);
      this.responseTimes.delete(circuitId);
      const timer = this.timers.get(circuitId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(circuitId);
      }
    } else {
      this.circuits.clear();
      this.responseTimes.clear();
      this.timers.forEach(timer => clearTimeout(timer));
      this.timers.clear();
    }
  }

  /**
   * Force open circuit (for testing or maintenance)
   */
  forceOpen(circuitId: string): void {
    const stats = this.getOrCreateStats(circuitId);
    stats.state = 'OPEN';
    stats.openedAt = new Date();
    console.log(`🔧 Circuit breaker '${circuitId}' forced open for maintenance.`);
  }

  /**
   * Force close circuit (for testing or emergency recovery)
   */
  forceClose(circuitId: string): void {
    const stats = this.getOrCreateStats(circuitId);
    stats.state = 'CLOSED';
    stats.failureCount = 0;
    stats.halfOpenAttempts = 0;
    
    // Clear timer
    const timer = this.timers.get(circuitId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(circuitId);
    }
    
    console.log(`🔧 Circuit breaker '${circuitId}' forced closed for emergency recovery.`);
  }

  /**
   * Get all circuit IDs
   */
  getAllCircuitIds(): string[] {
    return Array.from(this.circuits.keys());
  }

  /**
   * Check if circuit exists
   */
  hasCircuit(circuitId: string): boolean {
    return this.circuits.has(circuitId);
  }
}

// Global circuit breaker manager instance
export const globalCircuitBreakerManager = new CircuitBreakerManager();