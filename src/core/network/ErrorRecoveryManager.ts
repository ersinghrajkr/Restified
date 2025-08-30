import { ErrorRecoveryConfig, FallbackStrategy, RecoveryAction } from '../../RestifiedTypes';

export interface ErrorRecoveryStats {
  totalErrors: number;
  recoveredErrors: number;
  fallbacksExecuted: number;
  degradationActivations: number;
  recoverySuccessRate: number;
  lastRecoveryTime: Date | null;
  errorsByType: Record<string, number>;
  recoveryActionStats: Record<string, { attempts: number; successes: number }>;
}

export interface ErrorRecoveryMetrics {
  endpointId: string;
  currentRecoveryLevel: 'full' | 'degraded' | 'minimal' | 'offline';
  availableFallbacks: number;
  recoveryEffectiveness: number;
  lastDegradationTime: Date | null;
  averageRecoveryTime: number;
  stats: ErrorRecoveryStats;
}

export interface FallbackResult<T = any> {
  success: boolean;
  data: T | null;
  source: 'primary' | 'fallback' | 'cached' | 'default' | 'synthetic';
  fallbackUsed?: string;
  degradationLevel: 'none' | 'partial' | 'full';
  recoveryActions: string[];
}

/**
 * Error Recovery Manager for Graceful Degradation
 * 
 * Provides intelligent error recovery with:
 * - Multiple fallback strategies (cache, alternative endpoints, synthetic data)
 * - Graceful degradation patterns
 * - Circuit breaker integration for automatic degradation
 * - Recovery action orchestration
 * - Health monitoring and automatic restoration
 */
export class ErrorRecoveryManager {
  private endpointStats: Map<string, ErrorRecoveryStats> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy[]> = new Map();
  private recoveryActions: Map<string, RecoveryAction[]> = new Map();
  private cacheStore: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private degradationLevels: Map<string, 'full' | 'degraded' | 'minimal' | 'offline'> = new Map();
  private globalConfig: ErrorRecoveryConfig;

  private defaultConfig: ErrorRecoveryConfig = {
    enabled: true,
    enableFallbacks: true,
    enableCaching: true,
    enableDegradation: true,
    cacheTimeout: 300000, // 5 minutes
    maxFallbackAttempts: 3,
    degradationTimeout: 60000, // 1 minute before attempting recovery
    recoveryAttemptInterval: 30000, // 30 seconds between recovery attempts
    healthCheckInterval: 60000, // 1 minute health checks
    fallbackTimeout: 10000, // 10 seconds for fallback execution
    autoRecovery: true
  };

  constructor(config?: Partial<ErrorRecoveryConfig>) {
    this.globalConfig = { ...this.defaultConfig, ...config };
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default fallback strategies for common patterns
   */
  private initializeDefaultStrategies(): void {
    // Default cache fallback
    this.addFallbackStrategy('cache', {
      name: 'cache-fallback',
      type: 'cache',
      priority: 1,
      timeout: 5000,
      description: 'Return cached response if available',
      execute: async (error, context) => {
        const cacheKey = this.createCacheKey(context.method, context.url);
        const cached = this.cacheStore.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          return {
            success: true,
            data: cached.data,
            source: 'cached' as const,
            fallbackUsed: 'cache-fallback'
          };
        }
        
        return { success: false, data: null, source: 'fallback' as const };
      }
    });

    // Default empty response fallback
    this.addFallbackStrategy('default', {
      name: 'empty-response',
      type: 'default',
      priority: 10,
      timeout: 1000,
      description: 'Return empty response structure',
      execute: async (error, context) => {
        const defaultResponse = this.createDefaultResponse(context.method, context.url);
        return {
          success: true,
          data: defaultResponse,
          source: 'default' as const,
          fallbackUsed: 'empty-response'
        };
      }
    });

    // Default synthetic data fallback
    this.addFallbackStrategy('synthetic', {
      name: 'synthetic-data',
      type: 'synthetic',
      priority: 5,
      timeout: 3000,
      description: 'Generate synthetic response data',
      execute: async (error, context) => {
        const syntheticData = this.generateSyntheticData(context.method, context.url, error);
        return {
          success: true,
          data: syntheticData,
          source: 'synthetic' as const,
          fallbackUsed: 'synthetic-data'
        };
      }
    });
  }

  /**
   * Execute request with error recovery and fallback strategies
   */
  async executeWithRecovery<T>(
    endpointId: string,
    primaryFunction: () => Promise<T>,
    context: { method: string; url: string; body?: any },
    config?: Partial<ErrorRecoveryConfig>
  ): Promise<FallbackResult<T>> {
    const effectiveConfig = { ...this.globalConfig, ...config };
    const stats = this.getOrCreateStats(endpointId);
    const recoveryActions: string[] = [];

    if (!effectiveConfig.enabled) {
      try {
        const result = await primaryFunction();
        return {
          success: true,
          data: result,
          source: 'primary',
          degradationLevel: 'none',
          recoveryActions: []
        };
      } catch (error) {
        throw error; // No recovery if disabled
      }
    }

    // Check if endpoint is in degraded state
    const degradationLevel = this.degradationLevels.get(endpointId) || 'full';
    if (degradationLevel === 'offline') {
      recoveryActions.push('endpoint-offline-fallback');
      return await this.executeFallbacks(endpointId, new Error('Endpoint offline'), context, effectiveConfig, recoveryActions);
    }

    try {
      // Attempt primary request
      const result = await primaryFunction();
      
      // Cache successful response
      if (effectiveConfig.enableCaching) {
        this.cacheResponse(context.method, context.url, result, effectiveConfig.cacheTimeout!);
      }
      
      // Record success and potentially restore service level
      this.recordSuccess(endpointId);
      recoveryActions.push('primary-success');
      
      return {
        success: true,
        data: result,
        source: 'primary',
        degradationLevel: 'none',
        recoveryActions
      };
      
    } catch (error: any) {
      stats.totalErrors++;
      this.recordErrorByType(endpointId, error);
      recoveryActions.push('primary-failed');

      // Attempt error recovery with fallbacks
      if (effectiveConfig.enableFallbacks) {
        recoveryActions.push('attempting-fallbacks');
        const fallbackResult = await this.executeFallbacks(endpointId, error, context, effectiveConfig, recoveryActions);
        
        if (fallbackResult.success) {
          stats.recoveredErrors++;
          stats.fallbacksExecuted++;
          recoveryActions.push('fallback-success');
        }
        
        return { 
          ...fallbackResult, 
          recoveryActions,
          data: fallbackResult.data as T 
        };
      }

      // No fallbacks available or enabled
      recoveryActions.push('no-fallbacks-available');
      throw error;
    }
  }

  /**
   * Execute fallback strategies in priority order
   */
  private async executeFallbacks<T>(
    endpointId: string,
    error: Error,
    context: { method: string; url: string; body?: any },
    config: ErrorRecoveryConfig,
    recoveryActions: string[]
  ): Promise<FallbackResult<T>> {
    const strategies = this.getFallbackStrategies(endpointId);
    const stats = this.getOrCreateStats(endpointId);
    
    // Sort strategies by priority (lower number = higher priority)
    const sortedStrategies = strategies.sort((a, b) => a.priority - b.priority);
    
    for (const strategy of sortedStrategies) {
      try {
        recoveryActions.push(`trying-${strategy.name}`);
        
        // Execute fallback with timeout
        const fallbackPromise = strategy.execute(error, context);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Fallback timeout: ${strategy.name}`)), 
                    strategy.timeout || config.fallbackTimeout!);
        });
        
        const result = await Promise.race([fallbackPromise, timeoutPromise]);
        
        if (result.success) {
          recoveryActions.push(`${strategy.name}-success`);
          
          // Update recovery action stats
          this.updateRecoveryActionStats(endpointId, strategy.name, true);
          
          return {
            success: true,
            data: result.data,
            source: result.source,
            fallbackUsed: strategy.name,
            degradationLevel: this.getDegradationLevel(strategy.type),
            recoveryActions
          };
        }
        
        recoveryActions.push(`${strategy.name}-failed`);
        this.updateRecoveryActionStats(endpointId, strategy.name, false);
        
      } catch (fallbackError) {
        recoveryActions.push(`${strategy.name}-error`);
        this.updateRecoveryActionStats(endpointId, strategy.name, false);
        
        if (process.env.DEBUG_RESTIFIED_RECOVERY === 'true') {
          console.warn(`Fallback ${strategy.name} failed:`, fallbackError);
        }
      }
    }

    // All fallbacks failed
    recoveryActions.push('all-fallbacks-failed');
    return {
      success: false,
      data: null,
      source: 'fallback',
      degradationLevel: 'full',
      recoveryActions
    };
  }

  /**
   * Add fallback strategy for an endpoint or globally
   */
  addFallbackStrategy(endpointId: string, strategy: FallbackStrategy): void {
    if (!this.fallbackStrategies.has(endpointId)) {
      this.fallbackStrategies.set(endpointId, []);
    }
    this.fallbackStrategies.get(endpointId)!.push(strategy);
  }

  /**
   * Get fallback strategies for an endpoint (includes global strategies)
   */
  private getFallbackStrategies(endpointId: string): FallbackStrategy[] {
    const endpointStrategies = this.fallbackStrategies.get(endpointId) || [];
    const globalStrategies = this.fallbackStrategies.get('global') || [];
    const defaultStrategies = this.fallbackStrategies.get('default') || [];
    
    return [...endpointStrategies, ...globalStrategies, ...defaultStrategies];
  }

  /**
   * Cache response for fallback use
   */
  private cacheResponse(method: string, url: string, data: any, ttl: number): void {
    const cacheKey = this.createCacheKey(method, url);
    this.cacheStore.set(cacheKey, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Create cache key from method and URL
   */
  private createCacheKey(method: string, url: string): string {
    return `${method.toUpperCase()}:${url}`;
  }

  /**
   * Create default response structure based on endpoint pattern
   */
  private createDefaultResponse(method: string, url: string): any {
    if (method.toUpperCase() === 'GET') {
      if (url.includes('list') || url.includes('all') || url.includes('?')) {
        return { data: [], total: 0, page: 1, hasMore: false };
      }
      return { data: null, message: 'Service temporarily unavailable' };
    }
    
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      return { success: false, message: 'Operation could not be completed', retry: true };
    }
    
    if (method.toUpperCase() === 'DELETE') {
      return { success: false, message: 'Delete operation pending', retry: true };
    }
    
    return { message: 'Service temporarily unavailable' };
  }

  /**
   * Generate synthetic data based on endpoint patterns
   */
  private generateSyntheticData(method: string, url: string, error: Error): any {
    // User-related endpoints
    if (url.includes('/user')) {
      if (url.match(/\/user[s]?\/\d+/)) {
        return {
          id: 1,
          name: 'Demo User',
          email: 'demo@example.com',
          status: 'active',
          synthetic: true
        };
      }
      if (url.includes('/users')) {
        return {
          data: [
            { id: 1, name: 'Demo User 1', email: 'demo1@example.com', synthetic: true },
            { id: 2, name: 'Demo User 2', email: 'demo2@example.com', synthetic: true }
          ],
          total: 2,
          synthetic: true
        };
      }
    }
    
    // Product-related endpoints
    if (url.includes('/product')) {
      if (url.match(/\/product[s]?\/\d+/)) {
        return {
          id: 1,
          name: 'Sample Product',
          price: 99.99,
          available: true,
          synthetic: true
        };
      }
      if (url.includes('/products')) {
        return {
          data: [
            { id: 1, name: 'Product 1', price: 99.99, synthetic: true },
            { id: 2, name: 'Product 2', price: 199.99, synthetic: true }
          ],
          total: 2,
          synthetic: true
        };
      }
    }
    
    // Search endpoints
    if (url.includes('/search')) {
      return {
        results: [],
        total: 0,
        query: 'search-term',
        message: 'Search temporarily unavailable',
        synthetic: true
      };
    }
    
    // Analytics endpoints
    if (url.includes('/analytics') || url.includes('/stats')) {
      return {
        data: {
          views: 0,
          users: 0,
          conversions: 0
        },
        period: 'last-7-days',
        message: 'Analytics temporarily unavailable',
        synthetic: true
      };
    }
    
    // Default synthetic response
    return {
      message: 'Service temporarily unavailable - synthetic data',
      error: error.message,
      synthetic: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get degradation level based on fallback type
   */
  private getDegradationLevel(fallbackType: string): 'none' | 'partial' | 'full' {
    switch (fallbackType) {
      case 'cache':
        return 'none'; // Cached data is full functionality
      case 'alternative':
        return 'partial'; // Alternative endpoint may have reduced functionality
      case 'synthetic':
        return 'partial'; // Synthetic data is functional but not real
      case 'default':
        return 'full'; // Default responses are minimal functionality
      default:
        return 'partial';
    }
  }

  /**
   * Record success and update service level
   */
  private recordSuccess(endpointId: string): void {
    const stats = this.getOrCreateStats(endpointId);
    
    // Potentially restore service level if it was degraded
    const currentLevel = this.degradationLevels.get(endpointId);
    if (currentLevel && currentLevel !== 'full') {
      // Gradual recovery
      if (currentLevel === 'offline') {
        this.degradationLevels.set(endpointId, 'minimal');
      } else if (currentLevel === 'minimal') {
        this.degradationLevels.set(endpointId, 'degraded');
      } else if (currentLevel === 'degraded') {
        this.degradationLevels.set(endpointId, 'full');
      }
    }
  }

  /**
   * Record error by type for analysis
   */
  private recordErrorByType(endpointId: string, error: Error): void {
    const stats = this.getOrCreateStats(endpointId);
    const errorType = error.name || error.constructor.name || 'Unknown';
    
    if (!stats.errorsByType[errorType]) {
      stats.errorsByType[errorType] = 0;
    }
    stats.errorsByType[errorType]++;
  }

  /**
   * Update recovery action statistics
   */
  private updateRecoveryActionStats(endpointId: string, actionName: string, success: boolean): void {
    const stats = this.getOrCreateStats(endpointId);
    
    if (!stats.recoveryActionStats[actionName]) {
      stats.recoveryActionStats[actionName] = { attempts: 0, successes: 0 };
    }
    
    stats.recoveryActionStats[actionName].attempts++;
    if (success) {
      stats.recoveryActionStats[actionName].successes++;
    }
  }

  /**
   * Get or create stats for an endpoint
   */
  private getOrCreateStats(endpointId: string): ErrorRecoveryStats {
    if (!this.endpointStats.has(endpointId)) {
      const stats: ErrorRecoveryStats = {
        totalErrors: 0,
        recoveredErrors: 0,
        fallbacksExecuted: 0,
        degradationActivations: 0,
        recoverySuccessRate: 0,
        lastRecoveryTime: null,
        errorsByType: {},
        recoveryActionStats: {}
      };
      this.endpointStats.set(endpointId, stats);
    }
    
    const stats = this.endpointStats.get(endpointId)!;
    stats.recoverySuccessRate = stats.totalErrors > 0 ? 
      (stats.recoveredErrors / stats.totalErrors) * 100 : 0;
    
    return stats;
  }

  /**
   * Force degradation level for an endpoint
   */
  forceDegradation(endpointId: string, level: 'full' | 'degraded' | 'minimal' | 'offline'): void {
    this.degradationLevels.set(endpointId, level);
    const stats = this.getOrCreateStats(endpointId);
    stats.degradationActivations++;
    
    console.warn(`🔧 Forced degradation for ${endpointId} to ${level.toUpperCase()}`);
  }

  /**
   * Get error recovery statistics
   */
  getRecoveryStats(endpointId?: string): Map<string, ErrorRecoveryStats> | ErrorRecoveryStats | null {
    if (endpointId) {
      return this.endpointStats.get(endpointId) || null;
    }
    return new Map(this.endpointStats);
  }

  /**
   * Get error recovery metrics
   */
  getRecoveryMetrics(endpointId: string): ErrorRecoveryMetrics | null {
    const stats = this.endpointStats.get(endpointId);
    if (!stats) return null;

    const currentLevel = this.degradationLevels.get(endpointId) || 'full';
    const availableFallbacks = this.getFallbackStrategies(endpointId).length;
    const effectiveness = stats.totalErrors > 0 ? 
      (stats.recoveredErrors / stats.totalErrors) * 100 : 100;

    return {
      endpointId,
      currentRecoveryLevel: currentLevel,
      availableFallbacks,
      recoveryEffectiveness: effectiveness,
      lastDegradationTime: stats.lastRecoveryTime,
      averageRecoveryTime: this.calculateAverageRecoveryTime(endpointId),
      stats: { ...stats }
    };
  }

  /**
   * Calculate average recovery time
   */
  private calculateAverageRecoveryTime(endpointId: string): number {
    // This would be more sophisticated in production with actual timing data
    const stats = this.endpointStats.get(endpointId);
    if (!stats || stats.recoveredErrors === 0) return 0;
    
    // Simplified calculation based on recovery success rate
    const baseTime = 1000; // 1 second base
    const complexity = Object.keys(stats.recoveryActionStats).length;
    return baseTime * complexity * (1 / (stats.recoverySuccessRate / 100));
  }

  /**
   * Clear cache for endpoint or all
   */
  clearCache(endpointId?: string): void {
    if (endpointId) {
      const cacheKey = `${endpointId}`;
      for (const key of this.cacheStore.keys()) {
        if (key.includes(cacheKey)) {
          this.cacheStore.delete(key);
        }
      }
    } else {
      this.cacheStore.clear();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorRecoveryConfig>): void {
    this.globalConfig = { ...this.globalConfig, ...config };
  }

  /**
   * Reset statistics
   */
  resetStats(endpointId?: string): void {
    if (endpointId) {
      this.endpointStats.delete(endpointId);
      this.degradationLevels.delete(endpointId);
    } else {
      this.endpointStats.clear();
      this.degradationLevels.clear();
      this.cacheStore.clear();
    }
  }

  /**
   * Get all tracked endpoint IDs
   */
  getAllEndpointIds(): string[] {
    return Array.from(this.endpointStats.keys());
  }

  /**
   * Add recovery action for an endpoint
   */
  addRecoveryAction(endpointId: string, action: RecoveryAction): void {
    if (!this.recoveryActions.has(endpointId)) {
      this.recoveryActions.set(endpointId, []);
    }
    this.recoveryActions.get(endpointId)!.push(action);
  }

  /**
   * Execute recovery actions for an endpoint
   */
  async executeRecoveryActions(endpointId: string): Promise<boolean> {
    const actions = this.recoveryActions.get(endpointId) || [];
    let allSuccessful = true;

    for (const action of actions) {
      try {
        await action.execute(endpointId);
        console.log(`✅ Recovery action '${action.name}' completed for ${endpointId}`);
      } catch (error) {
        console.error(`❌ Recovery action '${action.name}' failed for ${endpointId}:`, error);
        allSuccessful = false;
      }
    }

    return allSuccessful;
  }
}

// Global error recovery manager instance
export const globalErrorRecoveryManager = new ErrorRecoveryManager();