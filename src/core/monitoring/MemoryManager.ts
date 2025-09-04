import { EventEmitter } from 'events';

export interface MemoryConfig {
  enabled?: boolean;
  enableObjectPooling?: boolean;
  enableMemoryMonitoring?: boolean;
  enableGarbageCollection?: boolean;
  gcThreshold?: number;
  memoryThreshold?: number;
  poolConfigurations?: PoolConfig[];
  monitoringInterval?: number;
  alertThresholds?: MemoryAlertThresholds;
}

export interface PoolConfig {
  name: string;
  type: string;
  minSize?: number;
  maxSize?: number;
  createFn: () => any;
  resetFn?: (obj: any) => void;
  validateFn?: (obj: any) => boolean;
  destroyFn?: (obj: any) => void;
  idleTimeout?: number;
  enabled?: boolean;
}

export interface MemoryAlertThresholds {
  heapUsed?: number;
  heapTotal?: number;
  external?: number;
  rss?: number;
  gcFrequency?: number;
}

export interface PoolStats {
  name: string;
  type: string;
  totalCreated: number;
  totalDestroyed: number;
  totalReused: number;
  currentSize: number;
  availableObjects: number;
  checkedOutObjects: number;
  hitRate: number;
  missCount: number;
  creationRate: number;
  destructionRate: number;
  averageLifetime: number;
  lastActivity: Date;
}

export interface MemoryStats {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  heapUsagePercentage: number;
  gcStats?: {
    totalGCTime: number;
    gcCount: number;
    averageGCTime: number;
    lastGCTime: Date;
  };
}

export interface MemoryReport {
  generatedAt: Date;
  systemMemory: MemoryStats;
  poolStats: PoolStats[];
  recommendations: string[];
  alerts: Array<{
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    value: number;
    threshold: number;
    timestamp: Date;
  }>;
  summary: {
    totalPools: number;
    totalPooledObjects: number;
    totalMemoryUsage: number;
    memoryEfficiencyGain: number;
    reuseRate: number;
  };
}

interface PooledObject {
  object: any;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
  isAvailable: boolean;
  lifetime: number;
}

export class ObjectPool<T = any> extends EventEmitter {
  private name: string;
  private type: string;
  private minSize: number;
  private maxSize: number;
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private validateFn: (obj: T) => boolean;
  private destroyFn: (obj: T) => void;
  private idleTimeout: number;
  
  private pool: Map<string, PooledObject> = new Map();
  private availableObjects: string[] = [];
  private checkedOutObjects: Set<string> = new Set();
  
  private stats: PoolStats;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: PoolConfig) {
    super();
    
    this.name = config.name;
    this.type = config.type;
    this.minSize = config.minSize || 5;
    this.maxSize = config.maxSize || 50;
    this.createFn = config.createFn;
    this.resetFn = config.resetFn || (() => {});
    this.validateFn = config.validateFn || (() => true);
    this.destroyFn = config.destroyFn || (() => {});
    this.idleTimeout = config.idleTimeout || 300000; // 5 minutes
    
    this.stats = {
      name: this.name,
      type: this.type,
      totalCreated: 0,
      totalDestroyed: 0,
      totalReused: 0,
      currentSize: 0,
      availableObjects: 0,
      checkedOutObjects: 0,
      hitRate: 0,
      missCount: 0,
      creationRate: 0,
      destructionRate: 0,
      averageLifetime: 0,
      lastActivity: new Date()
    };
    
    this.initialize();
  }

  private initialize(): void {
    for (let i = 0; i < this.minSize; i++) {
      this.createObject();
    }
    
    this.startCleanupProcess();
  }

  private createObject(): string {
    const id = this.generateId();
    const obj = this.createFn();
    
    this.pool.set(id, {
      object: obj,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0,
      isAvailable: true,
      lifetime: 0
    });
    
    this.availableObjects.push(id);
    this.stats.totalCreated++;
    this.stats.currentSize++;
    this.stats.availableObjects++;
    this.stats.lastActivity = new Date();
    
    this.emit('objectCreated', { id, type: this.type });
    return id;
  }

  private generateId(): string {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Run cleanup every minute
  }

  private cleanup(): void {
    const now = new Date();
    const objectsToDestroy: string[] = [];
    
    this.pool.forEach((pooledObj, id) => {
      if (pooledObj.isAvailable) {
        const idleTime = now.getTime() - pooledObj.lastUsed.getTime();
        
        if (idleTime > this.idleTimeout && this.availableObjects.length > this.minSize) {
          objectsToDestroy.push(id);
        }
        
        if (!this.validateFn(pooledObj.object)) {
          objectsToDestroy.push(id);
        }
      }
    });
    
    objectsToDestroy.forEach(id => {
      this.destroyObject(id);
    });
    
    this.updateStats();
  }

  private destroyObject(id: string): void {
    const pooledObj = this.pool.get(id);
    if (!pooledObj) return;
    
    try {
      this.destroyFn(pooledObj.object);
    } catch (error) {
      console.error(`Error destroying object ${id}:`, error);
    }
    
    this.pool.delete(id);
    
    const availableIndex = this.availableObjects.indexOf(id);
    if (availableIndex > -1) {
      this.availableObjects.splice(availableIndex, 1);
      this.stats.availableObjects--;
    }
    
    this.checkedOutObjects.delete(id);
    
    this.stats.totalDestroyed++;
    this.stats.currentSize--;
    this.stats.lastActivity = new Date();
    
    this.emit('objectDestroyed', { id, type: this.type });
  }

  public acquire(): T | null {
    this.stats.lastActivity = new Date();
    
    if (this.availableObjects.length === 0) {
      if (this.stats.currentSize < this.maxSize) {
        this.createObject();
      } else {
        this.stats.missCount++;
        this.updateHitRate();
        return null;
      }
    }
    
    const id = this.availableObjects.pop()!;
    const pooledObj = this.pool.get(id)!;
    
    pooledObj.isAvailable = false;
    pooledObj.lastUsed = new Date();
    pooledObj.useCount++;
    
    this.checkedOutObjects.add(id);
    this.stats.availableObjects--;
    this.stats.checkedOutObjects++;
    
    if (pooledObj.useCount > 1) {
      this.stats.totalReused++;
    }
    
    try {
      this.resetFn(pooledObj.object);
    } catch (error) {
      console.error(`Error resetting object ${id}:`, error);
      this.destroyObject(id);
      return this.acquire();
    }
    
    this.updateHitRate();
    this.emit('objectAcquired', { id, type: this.type });
    
    return pooledObj.object;
  }

  public release(obj: T): void {
    const entry = Array.from(this.pool.entries()).find(([_, pooledObj]) => pooledObj.object === obj);
    
    if (!entry) {
      console.warn('Attempting to release object not from this pool');
      return;
    }
    
    const [id, pooledObj] = entry;
    
    if (pooledObj.isAvailable) {
      console.warn('Attempting to release object that is already available');
      return;
    }
    
    pooledObj.isAvailable = true;
    pooledObj.lastUsed = new Date();
    pooledObj.lifetime = pooledObj.lastUsed.getTime() - pooledObj.createdAt.getTime();
    
    this.checkedOutObjects.delete(id);
    this.availableObjects.push(id);
    this.stats.availableObjects++;
    this.stats.checkedOutObjects--;
    this.stats.lastActivity = new Date();
    
    this.updateAverageLifetime(pooledObj.lifetime);
    this.emit('objectReleased', { id, type: this.type });
  }

  private updateHitRate(): void {
    const totalRequests = this.stats.totalReused + this.stats.missCount;
    this.stats.hitRate = totalRequests > 0 ? this.stats.totalReused / totalRequests : 0;
  }

  private updateAverageLifetime(lifetime: number): void {
    const totalObjects = this.stats.totalCreated;
    this.stats.averageLifetime = ((this.stats.averageLifetime * (totalObjects - 1)) + lifetime) / totalObjects;
  }

  private updateStats(): void {
    const now = new Date();
    const uptime = now.getTime() - (this.stats.lastActivity?.getTime() || now.getTime());
    
    this.stats.creationRate = this.stats.totalCreated / (uptime / 1000 / 60); // per minute
    this.stats.destructionRate = this.stats.totalDestroyed / (uptime / 1000 / 60); // per minute
  }

  public getStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }

  public drain(): void {
    const allIds = Array.from(this.pool.keys());
    allIds.forEach(id => this.destroyObject(id));
    
    this.availableObjects.length = 0;
    this.checkedOutObjects.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.emit('poolDrained', { type: this.type });
  }

  public resize(newMinSize: number, newMaxSize: number): void {
    this.minSize = newMinSize;
    this.maxSize = newMaxSize;
    
    while (this.availableObjects.length < this.minSize) {
      this.createObject();
    }
    
    while (this.stats.currentSize > this.maxSize) {
      if (this.availableObjects.length > 0) {
        const id = this.availableObjects.pop()!;
        this.destroyObject(id);
      } else {
        break;
      }
    }
  }
}

export class MemoryManager extends EventEmitter {
  private config: Required<MemoryConfig>;
  private pools: Map<string, ObjectPool> = new Map();
  private memoryStats: MemoryStats[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcStats = {
    totalGCTime: 0,
    gcCount: 0,
    averageGCTime: 0,
    lastGCTime: new Date()
  };

  constructor(config: MemoryConfig = {}) {
    super();
    
    this.config = {
      enabled: true,
      enableObjectPooling: true,
      enableMemoryMonitoring: true,
      enableGarbageCollection: true,
      gcThreshold: 50 * 1024 * 1024, // 50MB
      memoryThreshold: 80, // 80% of heap
      poolConfigurations: [],
      monitoringInterval: 30000, // 30 seconds
      alertThresholds: {
        heapUsed: 100 * 1024 * 1024, // 100MB
        heapTotal: 200 * 1024 * 1024, // 200MB
        external: 50 * 1024 * 1024,  // 50MB
        rss: 300 * 1024 * 1024,      // 300MB
        gcFrequency: 10 // per minute
      },
      ...config
    };

    this.initializePools();
    this.startMonitoring();
  }

  private initializePools(): void {
    this.config.poolConfigurations.forEach(poolConfig => {
      if (poolConfig.enabled !== false) {
        this.createPool(poolConfig);
      }
    });
  }

  public createPool(config: PoolConfig): ObjectPool {
    if (this.pools.has(config.name)) {
      throw new Error(`Pool with name '${config.name}' already exists`);
    }
    
    const pool = new ObjectPool(config);
    this.pools.set(config.name, pool);
    
    pool.on('objectCreated', (data) => this.emit('objectCreated', data));
    pool.on('objectDestroyed', (data) => this.emit('objectDestroyed', data));
    pool.on('objectAcquired', (data) => this.emit('objectAcquired', data));
    pool.on('objectReleased', (data) => this.emit('objectReleased', data));
    
    console.log(`✅ Created object pool: ${config.name} (${config.type})`);
    return pool;
  }

  public getPool<T = any>(name: string): ObjectPool<T> | null {
    return (this.pools.get(name) as ObjectPool<T>) || null;
  }

  public acquireFromPool<T = any>(poolName: string): T | null {
    const pool = this.getPool<T>(poolName);
    return pool ? pool.acquire() : null;
  }

  public releaseToPool<T = any>(poolName: string, obj: T): void {
    const pool = this.getPool<T>(poolName);
    if (pool) {
      pool.release(obj);
    }
  }

  public removePool(name: string): void {
    const pool = this.pools.get(name);
    if (pool) {
      pool.drain();
      this.pools.delete(name);
      console.log(`🗑️ Removed object pool: ${name}`);
    }
  }

  private startMonitoring(): void {
    if (!this.config.enableMemoryMonitoring) {
      return;
    }
    
    console.log('🔍 Starting memory monitoring...');
    
    this.monitoringInterval = setInterval(() => {
      this.collectMemoryStats();
    }, this.config.monitoringInterval);
    
    if (this.config.enableGarbageCollection) {
      this.setupGarbageCollection();
    }
  }

  private collectMemoryStats(): void {
    const memUsage = process.memoryUsage();
    
    const stats: MemoryStats = {
      timestamp: new Date(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers || 0,
      rss: memUsage.rss,
      heapUsagePercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      gcStats: { ...this.gcStats }
    };
    
    this.memoryStats.push(stats);
    
    if (this.memoryStats.length > 1440) { // Keep 24 hours of stats (every 30 seconds)
      this.memoryStats = this.memoryStats.slice(-720); // Keep last 12 hours
    }
    
    this.checkMemoryThresholds(stats);
    this.emit('memoryStatsCollected', stats);
  }

  private checkMemoryThresholds(stats: MemoryStats): void {
    const thresholds = this.config.alertThresholds;
    const alerts: any[] = [];
    
    if (stats.heapUsed > thresholds.heapUsed!) {
      alerts.push({
        type: 'heap_usage',
        severity: 'warning' as const,
        message: `Heap usage exceeds threshold: ${Math.round(stats.heapUsed / 1024 / 1024)}MB > ${Math.round(thresholds.heapUsed! / 1024 / 1024)}MB`,
        value: stats.heapUsed,
        threshold: thresholds.heapUsed!,
        timestamp: new Date()
      });
    }
    
    if (stats.heapUsagePercentage > this.config.memoryThreshold) {
      alerts.push({
        type: 'heap_percentage',
        severity: stats.heapUsagePercentage > 90 ? 'critical' as const : 'warning' as const,
        message: `Heap usage percentage exceeds threshold: ${stats.heapUsagePercentage.toFixed(1)}% > ${this.config.memoryThreshold}%`,
        value: stats.heapUsagePercentage,
        threshold: this.config.memoryThreshold,
        timestamp: new Date()
      });
    }
    
    if (stats.rss > thresholds.rss!) {
      alerts.push({
        type: 'rss_usage',
        severity: 'warning' as const,
        message: `RSS usage exceeds threshold: ${Math.round(stats.rss / 1024 / 1024)}MB > ${Math.round(thresholds.rss! / 1024 / 1024)}MB`,
        value: stats.rss,
        threshold: thresholds.rss!,
        timestamp: new Date()
      });
    }
    
    alerts.forEach(alert => {
      this.emit('memoryAlert', alert);
    });

    if (this.config.enableGarbageCollection && 
        (stats.heapUsed > this.config.gcThreshold || stats.heapUsagePercentage > 85)) {
      this.triggerGarbageCollection();
    }
  }

  private setupGarbageCollection(): void {
    if (global.gc) {
      console.log('✅ Manual garbage collection available');
    } else {
      console.log('⚠️ Manual garbage collection not available (run with --expose-gc)');
    }
  }

  private triggerGarbageCollection(): void {
    if (!global.gc) {
      console.warn('Garbage collection requested but not available');
      return;
    }
    
    const startTime = Date.now();
    const beforeMemory = process.memoryUsage();
    
    try {
      global.gc();
      
      const endTime = Date.now();
      const afterMemory = process.memoryUsage();
      const gcTime = endTime - startTime;
      
      this.gcStats.totalGCTime += gcTime;
      this.gcStats.gcCount++;
      this.gcStats.averageGCTime = this.gcStats.totalGCTime / this.gcStats.gcCount;
      this.gcStats.lastGCTime = new Date();
      
      const memoryFreed = beforeMemory.heapUsed - afterMemory.heapUsed;
      
      console.log(`🗑️ Garbage collection completed in ${gcTime}ms, freed ${Math.round(memoryFreed / 1024 / 1024)}MB`);
      
      this.emit('garbageCollectionCompleted', {
        duration: gcTime,
        memoryFreed,
        beforeMemory,
        afterMemory,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error during garbage collection:', error);
    }
  }

  public forceGarbageCollection(): void {
    this.triggerGarbageCollection();
  }

  public getMemoryStats(): MemoryStats | null {
    return this.memoryStats.length > 0 ? this.memoryStats[this.memoryStats.length - 1] : null;
  }

  public getMemoryHistory(minutes: number = 60): MemoryStats[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.memoryStats.filter(stat => stat.timestamp > cutoffTime);
  }

  public getPoolStats(): PoolStats[] {
    return Array.from(this.pools.values()).map(pool => pool.getStats());
  }

  public getMemoryReport(): MemoryReport {
    const currentMemory = this.getMemoryStats();
    const poolStats = this.getPoolStats();
    
    const alerts: any[] = [];
    const recommendations: string[] = [];
    
    if (currentMemory) {
      if (currentMemory.heapUsagePercentage > 80) {
        recommendations.push('High heap usage detected - consider increasing memory limit or optimizing memory usage');
      }
      
      if (currentMemory.external > 100 * 1024 * 1024) {
        recommendations.push('High external memory usage - check for large buffers or external resources');
      }
    }
    
    poolStats.forEach(stats => {
      if (stats.hitRate < 0.8) {
        recommendations.push(`Pool "${stats.name}" has low hit rate (${(stats.hitRate * 100).toFixed(1)}%) - consider increasing pool size`);
      }
      
      if (stats.availableObjects === 0 && stats.checkedOutObjects > 0) {
        recommendations.push(`Pool "${stats.name}" is exhausted - consider increasing max pool size`);
      }
    });
    
    const totalPooledObjects = poolStats.reduce((sum, stats) => sum + stats.currentSize, 0);
    const totalReuseCount = poolStats.reduce((sum, stats) => sum + stats.totalReused, 0);
    const totalCreatedCount = poolStats.reduce((sum, stats) => sum + stats.totalCreated, 0);
    const reuseRate = totalCreatedCount > 0 ? totalReuseCount / totalCreatedCount : 0;
    
    const memoryEfficiencyGain = reuseRate * 100;
    
    return {
      generatedAt: new Date(),
      systemMemory: currentMemory || this.getDefaultMemoryStats(),
      poolStats,
      recommendations,
      alerts,
      summary: {
        totalPools: this.pools.size,
        totalPooledObjects,
        totalMemoryUsage: currentMemory?.heapUsed || 0,
        memoryEfficiencyGain,
        reuseRate
      }
    };
  }

  private getDefaultMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      timestamp: new Date(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers || 0,
      rss: memUsage.rss,
      heapUsagePercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      gcStats: { ...this.gcStats }
    };
  }

  public optimize(): void {
    console.log('🔧 Starting memory optimization...');
    
    // Trigger garbage collection
    this.forceGarbageCollection();
    
    // Optimize object pools
    this.pools.forEach(pool => {
      const stats = pool.getStats();
      
      if (stats.availableObjects > stats.checkedOutObjects * 2) {
        const newMinSize = Math.max(1, Math.floor(stats.checkedOutObjects * 1.2));
        const newMaxSize = Math.max(newMinSize, Math.floor(stats.checkedOutObjects * 2));
        pool.resize(newMinSize, newMaxSize);
        console.log(`📏 Resized pool "${stats.name}" to min: ${newMinSize}, max: ${newMaxSize}`);
      }
    });
    
    // Clean up old memory stats
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.memoryStats = this.memoryStats.filter(stat => stat.timestamp > oneHourAgo);
    
    console.log('✅ Memory optimization completed');
  }

  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.pools.forEach(pool => {
      pool.drain();
    });
    this.pools.clear();
    
    console.log('🛑 Memory manager stopped');
    this.emit('stopped', { timestamp: new Date() });
  }

  public updateConfig(newConfig: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.monitoringInterval && this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = setInterval(() => {
        this.collectMemoryStats();
      }, this.config.monitoringInterval);
    }
    
    if (newConfig.poolConfigurations) {
      this.initializePools();
    }
  }

  public static create(config?: MemoryConfig): MemoryManager {
    return new MemoryManager(config);
  }
}

export const globalMemoryManager = MemoryManager.create();