/**
 * Smart Retry Manager with Exponential Backoff and Jitter
 * 
 * Provides intelligent retry mechanisms for HTTP requests with configurable
 * retry conditions, exponential backoff, and comprehensive statistics tracking.
 */

export interface RetryConfig {
  /** Enable retry mechanism (default: true) */
  enabled?: boolean;
  
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelay?: number;
  
  /** Maximum delay between retries in milliseconds (default: 30000) */
  maxDelay?: number;
  
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  
  /** Add random jitter to prevent thundering herd (default: true) */
  enableJitter?: boolean;
  
  /** Maximum jitter as percentage of delay (default: 0.1 = 10%) */
  jitterFactor?: number;
  
  /** HTTP status codes that should trigger retries (default: [408, 429, 500, 502, 503, 504]) */
  retryOnStatusCodes?: number[];
  
  /** Retry on network errors (default: true) */
  retryOnNetworkError?: boolean;
  
  /** Retry on timeout (default: true) */
  retryOnTimeout?: boolean;
  
  /** Custom retry condition function */
  retryCondition?: (error: any, attempt: number) => boolean;
  
  /** Custom delay calculation function */
  customDelayCalculation?: (attempt: number, baseDelay: number) => number;
  
  /** Callback function called before each retry attempt */
  onRetry?: (error: any, attempt: number, delay: number) => void;
  
  /** Callback function called when max attempts reached */
  onMaxAttemptsReached?: (error: any, attempts: number) => void;
}

export interface RetryStats {
  /** Total number of requests attempted */
  totalRequests: number;
  
  /** Total number of requests that needed retries */
  retriedRequests: number;
  
  /** Total number of retry attempts made */
  totalRetryAttempts: number;
  
  /** Number of requests that succeeded after retry */
  successAfterRetry: number;
  
  /** Number of requests that failed after all retries */
  failedAfterMaxRetries: number;
  
  /** Average number of attempts per retried request */
  averageAttemptsPerRequest: number;
  
  /** Total time spent waiting for retries (ms) */
  totalRetryDelay: number;
  
  /** Retry attempts by status code */
  retriesByStatusCode: Record<number, number>;
  
  /** Retry attempts by error type */
  retriesByErrorType: Record<string, number>;
}

export interface RetryAttempt {
  /** Attempt number (1-based) */
  attemptNumber: number;
  
  /** Delay before this attempt (ms) */
  delay: number;
  
  /** Error that triggered the retry */
  error: any;
  
  /** Timestamp of the attempt */
  timestamp: Date;
  
  /** HTTP status code if available */
  statusCode?: number;
  
  /** Error type classification */
  errorType: 'network' | 'timeout' | 'status_code' | 'custom';
}

/**
 * Smart Retry Manager with advanced retry strategies
 */
export class RetryManager {
  private config: Required<RetryConfig>;
  private stats: RetryStats;
  private activeRetries: Map<string, RetryAttempt[]> = new Map();

  constructor(config: RetryConfig = {}) {
    this.config = {
      enabled: true,
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      enableJitter: true,
      jitterFactor: 0.1,
      retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
      retryOnNetworkError: true,
      retryOnTimeout: true,
      retryCondition: undefined,
      customDelayCalculation: undefined,
      onRetry: undefined,
      onMaxAttemptsReached: undefined,
      ...config
    };

    this.stats = {
      totalRequests: 0,
      retriedRequests: 0,
      totalRetryAttempts: 0,
      successAfterRetry: 0,
      failedAfterMaxRetries: 0,
      averageAttemptsPerRequest: 0,
      totalRetryDelay: 0,
      retriesByStatusCode: {},
      retriesByErrorType: {}
    };
  }

  /**
   * Execute a request with retry logic
   */
  async executeWithRetry<T>(
    requestId: string,
    requestFunction: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const effectiveConfig = { ...this.config, ...retryConfig };
    
    if (!effectiveConfig.enabled) {
      return await requestFunction();
    }

    this.stats.totalRequests++;
    let lastError: any;
    let attempt = 0;
    const maxAttempts = effectiveConfig.maxAttempts;
    const attempts: RetryAttempt[] = [];
    
    this.activeRetries.set(requestId, attempts);

    try {
      while (attempt < maxAttempts) {
        attempt++;
        
        try {
          const result = await requestFunction();
          
          // Success - update stats if this was a retry
          if (attempt > 1) {
            this.stats.successAfterRetry++;
          }
          
          this.activeRetries.delete(requestId);
          this.updateAverageAttempts();
          return result;
          
        } catch (error) {
          lastError = error;
          
          // Check if we should retry
          const shouldRetry = this.shouldRetry(error, attempt, effectiveConfig);
          
          if (!shouldRetry || attempt >= maxAttempts) {
            break;
          }
          
          // Calculate delay for next attempt
          const delay = this.calculateDelay(attempt, effectiveConfig);
          
          // Record retry attempt
          const retryAttempt: RetryAttempt = {
            attemptNumber: attempt,
            delay,
            error,
            timestamp: new Date(),
            statusCode: this.extractStatusCode(error),
            errorType: this.classifyError(error)
          };
          
          attempts.push(retryAttempt);
          this.recordRetryAttempt(retryAttempt);
          
          // Call retry callback if provided
          if (effectiveConfig.onRetry) {
            effectiveConfig.onRetry(error, attempt, delay);
          }
          
          // Wait before retry
          if (delay > 0) {
            await this.sleep(delay);
            this.stats.totalRetryDelay += delay;
          }
        }
      }
      
      // Max attempts reached
      if (attempt > 1) {
        this.stats.retriedRequests++;
        this.stats.failedAfterMaxRetries++;
      }
      
      if (effectiveConfig.onMaxAttemptsReached) {
        effectiveConfig.onMaxAttemptsReached(lastError, attempt);
      }
      
      this.activeRetries.delete(requestId);
      this.updateAverageAttempts();
      throw lastError;
      
    } catch (error) {
      this.activeRetries.delete(requestId);
      throw error;
    }
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: any, attempt: number, config: Required<RetryConfig>): boolean {
    // Custom retry condition takes precedence
    if (config.retryCondition) {
      return config.retryCondition(error, attempt);
    }
    
    // Check if it's an HTTP response error
    if (error.response && error.response.status) {
      const statusCode = error.response.status;
      return config.retryOnStatusCodes.includes(statusCode);
    }
    
    // Check for network errors
    if (config.retryOnNetworkError) {
      const networkErrors = ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EPROTO'];
      if (error.code && networkErrors.includes(error.code)) {
        return true;
      }
      
      if (error.message) {
        const networkErrorMessages = ['network error', 'connection refused', 'connection reset'];
        const errorMessage = error.message.toLowerCase();
        if (networkErrorMessages.some(msg => errorMessage.includes(msg))) {
          return true;
        }
      }
    }
    
    // Check for timeout errors
    if (config.retryOnTimeout) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate delay for next retry attempt using exponential backoff with jitter
   */
  private calculateDelay(attempt: number, config: Required<RetryConfig>): number {
    if (config.customDelayCalculation) {
      return config.customDelayCalculation(attempt, config.baseDelay);
    }
    
    // Exponential backoff: delay = baseDelay * (backoffMultiplier ^ (attempt - 1))
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Apply maximum delay cap
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.enableJitter) {
      const jitterAmount = delay * config.jitterFactor;
      const jitter = (Math.random() * 2 - 1) * jitterAmount; // Random between -jitterAmount and +jitterAmount
      delay = Math.max(0, delay + jitter);
    }
    
    return Math.round(delay);
  }

  /**
   * Extract HTTP status code from error
   */
  private extractStatusCode(error: any): number | undefined {
    return error.response?.status || error.status;
  }

  /**
   * Classify error type for statistics
   */
  private classifyError(error: any): 'network' | 'timeout' | 'status_code' | 'custom' {
    if (error.response?.status) {
      return 'status_code';
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'timeout';
    }
    
    const networkErrors = ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EPROTO'];
    if (error.code && networkErrors.includes(error.code)) {
      return 'network';
    }
    
    return 'custom';
  }

  /**
   * Record retry attempt in statistics
   */
  private recordRetryAttempt(attempt: RetryAttempt): void {
    this.stats.totalRetryAttempts++;
    
    if (attempt.statusCode) {
      this.stats.retriesByStatusCode[attempt.statusCode] = 
        (this.stats.retriesByStatusCode[attempt.statusCode] || 0) + 1;
    }
    
    this.stats.retriesByErrorType[attempt.errorType] = 
      (this.stats.retriesByErrorType[attempt.errorType] || 0) + 1;
  }

  /**
   * Update average attempts per request
   */
  private updateAverageAttempts(): void {
    if (this.stats.retriedRequests > 0) {
      this.stats.averageAttemptsPerRequest = 
        (this.stats.totalRetryAttempts + this.stats.retriedRequests) / this.stats.retriedRequests;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry statistics
   */
  getStats(): RetryStats {
    this.updateAverageAttempts();
    return { ...this.stats };
  }

  /**
   * Get retry performance metrics
   */
  getMetrics(): {
    retryRate: number;
    successRateAfterRetry: number;
    averageRetryDelay: number;
    topRetryStatusCodes: Array<{ statusCode: number; count: number }>;
    topRetryErrorTypes: Array<{ errorType: string; count: number }>;
  } {
    const retryRate = this.stats.totalRequests > 0 ? 
      (this.stats.retriedRequests / this.stats.totalRequests) * 100 : 0;
    
    const successRateAfterRetry = this.stats.retriedRequests > 0 ?
      (this.stats.successAfterRetry / this.stats.retriedRequests) * 100 : 0;
    
    const averageRetryDelay = this.stats.totalRetryAttempts > 0 ?
      this.stats.totalRetryDelay / this.stats.totalRetryAttempts : 0;
    
    const topRetryStatusCodes = Object.entries(this.stats.retriesByStatusCode)
      .map(([code, count]) => ({ statusCode: parseInt(code), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const topRetryErrorTypes = Object.entries(this.stats.retriesByErrorType)
      .map(([errorType, count]) => ({ errorType, count }))
      .sort((a, b) => b.count - a.count);
    
    return {
      retryRate,
      successRateAfterRetry,
      averageRetryDelay,
      topRetryStatusCodes,
      topRetryErrorTypes
    };
  }

  /**
   * Get active retries for monitoring
   */
  getActiveRetries(): Record<string, RetryAttempt[]> {
    return Object.fromEntries(this.activeRetries);
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      retriedRequests: 0,
      totalRetryAttempts: 0,
      successAfterRetry: 0,
      failedAfterMaxRetries: 0,
      averageAttemptsPerRequest: 0,
      totalRetryDelay: 0,
      retriesByStatusCode: {},
      retriesByErrorType: {}
    };
  }

  /**
   * Update retry configuration at runtime
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Generate retry recommendations based on statistics
   */
  getRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];
    
    if (metrics.retryRate > 20) {
      recommendations.push('High retry rate detected. Consider investigating API reliability or network issues.');
    }
    
    if (metrics.successRateAfterRetry < 50) {
      recommendations.push('Low success rate after retries. Consider adjusting retry conditions or increasing max attempts.');
    }
    
    if (metrics.averageRetryDelay > 10000) {
      recommendations.push('High average retry delay. Consider optimizing backoff strategy or reducing max delay.');
    }
    
    const top5xxRetries = metrics.topRetryStatusCodes.filter(s => s.statusCode >= 500);
    if (top5xxRetries.length > 0) {
      recommendations.push(`Server errors (5xx) causing retries: ${top5xxRetries.map(s => s.statusCode).join(', ')}. Consider API health monitoring.`);
    }
    
    if (metrics.topRetryErrorTypes.find(e => e.errorType === 'network')?.count > 5) {
      recommendations.push('Frequent network errors detected. Consider connection pooling optimization or network diagnostics.');
    }
    
    return recommendations;
  }
}

// Global retry manager instance
export const globalRetryManager = new RetryManager();