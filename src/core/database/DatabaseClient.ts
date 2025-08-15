/**
 * Database Client for RestifiedTS
 * 
 * Provides comprehensive database testing and state validation capabilities
 */

import { VariableStore } from '../stores/variable.core';

export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb' | 'redis' | 'mssql' | 'oracle' | 'elasticsearch';
  
  // Basic connection settings
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  connectionString?: string;
  timeout?: number;
  
  // Connection pool settings
  pool?: {
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    destroyTimeoutMillis?: number;
    reapIntervalMillis?: number;
    createRetryIntervalMillis?: number;
  };
  
  // Database-specific options
  options?: {
    // Common options
    ssl?: boolean | {
      ca?: string;
      cert?: string;
      key?: string;
      rejectUnauthorized?: boolean;
      servername?: string;
    };
    
    // MySQL/MariaDB specific
    charset?: string;
    timezone?: string;
    acquireTimeout?: number;
    multipleStatements?: boolean;
    supportBigNumbers?: boolean;
    bigNumberStrings?: boolean;
    dateStrings?: boolean;
    debug?: boolean;
    trace?: boolean;
    stringifyObjects?: boolean;
    reconnect?: boolean;
    queueLimit?: number;
    
    // PostgreSQL specific
    schema?: string;
    application_name?: string;
    search_path?: string;
    client_encoding?: string;
    
    // SQLite specific
    filename?: string;
    memory?: boolean;
    readonly?: boolean;
    fileMustExist?: boolean;
    journalMode?: string;
    synchronous?: string;
    tempStore?: string;
    mmapSize?: number;
    cacheSize?: number;
    pragmas?: Record<string, any>;
    functions?: Record<string, Function>;
    
    // MongoDB specific
    authSource?: string;
    replicaSet?: string;
    readPreference?: string;
    writeConcern?: any;
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTimeMS?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    connectTimeoutMS?: number;
    heartbeatFrequencyMS?: number;
    retryWrites?: boolean;
    retryReads?: boolean;
    compressors?: string[];
    
    // Redis specific
    family?: number;
    keyPrefix?: string;
    retryDelayOnFailover?: number;
    enableOfflineQueue?: boolean;
    maxRetriesPerRequest?: number;
    retryConnectOnFailure?: boolean;
    lazyConnect?: boolean;
    keepAlive?: number;
    commandTimeout?: number;
    maxmemoryPolicy?: string;
    
    // SQL Server specific
    server?: string;
    user?: string;
    domain?: string;
    connectionTimeout?: number;
    requestTimeout?: number;
    cancelTimeout?: number;
    authentication?: any;
    
    // Oracle specific
    connectString?: string;
    hostname?: string;
    serviceName?: string;
    sid?: string;
    poolAlias?: string;
    poolMax?: number;
    poolMin?: number;
    poolIncrement?: number;
    poolTimeout?: number;
    stmtCacheSize?: number;
    edition?: string;
    walletLocation?: string;
    walletPassword?: string;
    
    // Elasticsearch specific
    nodes?: string[];
    node?: string;
    auth?: {
      username?: string;
      password?: string;
      apiKey?: string;
      bearer?: string;
    };
    cloud?: {
      id?: string;
      username?: string;
      password?: string;
    };
    sniffOnStart?: boolean;
    sniffInterval?: number;
    sniffOnConnectionFault?: boolean;
    maxRetries?: number;
    compression?: string;
    index?: string;
    
    // Generic options
    [key: string]: any;
  };
}

export interface QueryResult {
  rows?: any[];
  rowCount?: number;
  fields?: any[];
  insertId?: any;
  affectedRows?: number;
  metadata?: any;
  executionTime: number;
}

export interface DatabaseSnapshot {
  timestamp: number;
  tables: Record<string, any[]>;
  metadata?: any;
}

export abstract class DatabaseClient {
  protected config: DatabaseConfig;
  protected variableStore: VariableStore;
  protected connection: any = null;
  protected snapshots: Map<string, DatabaseSnapshot> = new Map();

  constructor(config: DatabaseConfig, variableStore: VariableStore) {
    this.config = config;
    this.variableStore = variableStore;
  }

  /**
   * Connect to database
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from database
   */
  abstract disconnect(): Promise<void>;

  /**
   * Execute query
   */
  abstract query(sql: string, params?: any[]): Promise<QueryResult>;

  /**
   * Begin transaction
   */
  abstract beginTransaction(): Promise<void>;

  /**
   * Commit transaction
   */
  abstract commit(): Promise<void>;

  /**
   * Rollback transaction
   */
  abstract rollback(): Promise<void>;

  /**
   * Get table schema
   */
  abstract getTableSchema(tableName: string): Promise<any>;

  /**
   * Execute query with variable resolution
   */
  async executeQuery(sql: string, params?: any[]): Promise<QueryResult> {
    const resolvedSql = this.variableStore.resolveVariables(sql) as string;
    const resolvedParams = params ? this.variableStore.resolveVariables(params) : undefined;

    const startTime = Date.now();
    const result = await this.query(resolvedSql, resolvedParams);
    const endTime = Date.now();

    result.executionTime = endTime - startTime;
    return result;
  }

  /**
   * Validate data exists
   */
  async validateExists(tableName: string, conditions: Record<string, any>): Promise<boolean> {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const sql = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`;
    const result = await this.executeQuery(sql, Object.values(conditions));
    
    return result.rows && result.rows[0] && result.rows[0].count > 0;
  }

  /**
   * Validate data count
   */
  async validateCount(tableName: string, expectedCount: number, conditions?: Record<string, any>): Promise<boolean> {
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
    let params: any[] = [];

    if (conditions) {
      const whereClause = Object.keys(conditions)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params = Object.values(conditions);
    }

    const result = await this.executeQuery(sql, params);
    return result.rows && result.rows[0] && result.rows[0].count === expectedCount;
  }

  /**
   * Create database snapshot
   */
  async createSnapshot(name: string, tables: string[]): Promise<void> {
    const snapshot: DatabaseSnapshot = {
      timestamp: Date.now(),
      tables: {}
    };

    for (const table of tables) {
      const result = await this.executeQuery(`SELECT * FROM ${table}`);
      snapshot.tables[table] = result.rows || [];
    }

    this.snapshots.set(name, snapshot);
  }

  /**
   * Compare with snapshot
   */
  async compareWithSnapshot(name: string, tables?: string[]): Promise<{
    added: Record<string, any[]>;
    removed: Record<string, any[]>;
    modified: Record<string, any[]>;
  }> {
    const snapshot = this.snapshots.get(name);
    if (!snapshot) {
      throw new Error(`Snapshot '${name}' not found`);
    }

    const comparison = {
      added: {} as Record<string, any[]>,
      removed: {} as Record<string, any[]>,
      modified: {} as Record<string, any[]>
    };

    const tablesToCompare = tables || Object.keys(snapshot.tables);

    for (const table of tablesToCompare) {
      const currentResult = await this.executeQuery(`SELECT * FROM ${table}`);
      const currentRows = currentResult.rows || [];
      const snapshotRows = snapshot.tables[table] || [];

      // Find added rows
      comparison.added[table] = currentRows.filter(current => 
        !snapshotRows.some(snapshot => this.rowsEqual(current, snapshot))
      );

      // Find removed rows
      comparison.removed[table] = snapshotRows.filter(snapshot => 
        !currentRows.some(current => this.rowsEqual(current, snapshot))
      );

      // Find modified rows would require primary key comparison
      // For now, we'll consider added/removed as sufficient
      comparison.modified[table] = [];
    }

    return comparison;
  }

  /**
   * Cleanup test data
   */
  async cleanupTestData(tableName: string, conditions: Record<string, any>): Promise<void> {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    await this.executeQuery(sql, Object.values(conditions));
  }

  /**
   * Seed test data
   */
  async seedTestData(tableName: string, data: Record<string, any>[]): Promise<void> {
    for (const row of data) {
      const columns = Object.keys(row);
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      
      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await this.executeQuery(sql, Object.values(row));
    }
  }

  /**
   * Check if database is healthy
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    try {
      const startTime = Date.now();
      await this.executeQuery('SELECT 1');
      const latency = Date.now() - startTime;

      return { healthy: true, latency };
    } catch (error: any) {
      return { healthy: false, latency: 0, error: error.message };
    }
  }

  /**
   * Get connection status
   */
  abstract isConnected(): boolean;

  /**
   * Get database statistics
   */
  async getStats(): Promise<Record<string, any>> {
    return {
      snapshots: this.snapshots.size,
      connectionType: this.config.type,
      connected: this.isConnected()
    };
  }

  /**
   * Helper to compare rows (basic equality)
   */
  private rowsEqual(row1: any, row2: any): boolean {
    return JSON.stringify(row1) === JSON.stringify(row2);
  }
}