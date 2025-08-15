/**
 * MySQL Client Implementation for RestifiedTS
 */

import { DatabaseClient, DatabaseConfig, QueryResult } from './DatabaseClient';
import { VariableStore } from '../stores/variable.core';

export class MySQLClient extends DatabaseClient {
  private connection: any = null;
  private pool: any = null;
  private transaction: any = null;
  private mysqlModule: any = null;

  constructor(config: DatabaseConfig, variableStore: VariableStore) {
    super(config, variableStore);
  }

  async connect(): Promise<void> {
    try {
      // Dynamic require for mysql2 - will fail gracefully if not installed
      this.mysqlModule = require('mysql2/promise');

      const connectionConfig = {
        host: this.config.host || 'localhost',
        port: this.config.port || 3306,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        connectTimeout: this.config.timeout || 60000,
        acquireTimeout: this.config.options?.acquireTimeout || 60000,
        timeout: this.config.options?.timeout || 60000,
        charset: this.config.options?.charset || 'utf8mb4',
        timezone: this.config.options?.timezone || 'UTC',
        ssl: this.config.options?.ssl || false,
        multipleStatements: this.config.options?.multipleStatements || false,
        supportBigNumbers: this.config.options?.supportBigNumbers || true,
        bigNumberStrings: this.config.options?.bigNumberStrings || true,
        dateStrings: this.config.options?.dateStrings || false,
        debug: this.config.options?.debug || false,
        trace: this.config.options?.trace || false,
        stringifyObjects: this.config.options?.stringifyObjects || false,
        ...this.config.options
      };

      if (this.config.pool) {
        // Create connection pool
        this.pool = this.mysqlModule.createPool({
          ...connectionConfig,
          connectionLimit: this.config.pool.max || 10,
          queueLimit: this.config.options?.queueLimit || 0,
          acquireTimeout: this.config.options?.acquireTimeout || 60000,
          reconnect: this.config.options?.reconnect !== false,
          idleTimeout: this.config.pool.idleTimeoutMillis || 600000,
          maxIdle: this.config.pool.max || 10,
          minIdle: this.config.pool.min || 0
        });

        // Test connection
        const testConnection = await this.pool.getConnection();
        await testConnection.ping();
        testConnection.release();
      } else {
        // Create single connection
        this.connection = await this.mysqlModule.createConnection(connectionConfig);
        await this.connection.ping();
      }
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('MySQL client requires "mysql2" package. Install with: npm install mysql2');
      }
      throw new Error(`Failed to connect to MySQL: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      
      if (this.connection) {
        await this.connection.end();
        this.connection = null;
      }
    } catch (error: any) {
      throw new Error(`Failed to disconnect from MySQL: ${error.message}`);
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    try {
      const executor = this.transaction || this.pool || this.connection;
      
      if (!executor) {
        throw new Error('No database connection available');
      }

      const startTime = Date.now();
      const [rows, fields] = await executor.execute(sql, params);
      const endTime = Date.now();

      // Handle different result types
      let resultRows: any[] = [];
      let rowCount = 0;
      let insertId: any = undefined;
      let affectedRows = 0;

      if (Array.isArray(rows)) {
        resultRows = rows;
        rowCount = rows.length;
      } else if (rows && typeof rows === 'object') {
        // For INSERT, UPDATE, DELETE operations
        insertId = (rows as any).insertId;
        affectedRows = (rows as any).affectedRows || 0;
        rowCount = affectedRows;
        resultRows = [];
      }

      return {
        rows: resultRows,
        rowCount: rowCount,
        fields: fields,
        insertId: insertId,
        affectedRows: affectedRows,
        executionTime: endTime - startTime
      };
    } catch (error: any) {
      throw new Error(`MySQL query failed: ${error.message}`);
    }
  }

  async beginTransaction(): Promise<void> {
    try {
      if (this.pool) {
        this.transaction = await this.pool.getConnection();
        await this.transaction.beginTransaction();
      } else if (this.connection) {
        await this.connection.beginTransaction();
        this.transaction = this.connection;
      } else {
        throw new Error('No database connection available');
      }
    } catch (error: any) {
      throw new Error(`Failed to begin transaction: ${error.message}`);
    }
  }

  async commit(): Promise<void> {
    try {
      if (!this.transaction) {
        throw new Error('No active transaction');
      }

      await this.transaction.commit();
      
      if (this.pool && this.transaction !== this.connection) {
        this.transaction.release();
      }
      
      this.transaction = null;
    } catch (error: any) {
      throw new Error(`Failed to commit transaction: ${error.message}`);
    }
  }

  async rollback(): Promise<void> {
    try {
      if (!this.transaction) {
        throw new Error('No active transaction');
      }

      await this.transaction.rollback();
      
      if (this.pool && this.transaction !== this.connection) {
        this.transaction.release();
      }
      
      this.transaction = null;
    } catch (error: any) {
      throw new Error(`Failed to rollback transaction: ${error.message}`);
    }
  }

  async getTableSchema(tableName: string): Promise<any> {
    const sql = `
      SELECT 
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
        NUMERIC_PRECISION as numeric_precision,
        NUMERIC_SCALE as numeric_scale,
        COLUMN_KEY as column_key,
        EXTRA as extra
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  isConnected(): boolean {
    if (this.pool) {
      return !this.pool._closed;
    }
    return this.connection && this.connection.connection && !this.connection.connection._closing;
  }

  /**
   * MySQL specific methods
   */

  async getTableStats(tableName: string): Promise<any> {
    const sql = `
      SELECT 
        TABLE_NAME,
        ENGINE,
        TABLE_ROWS,
        DATA_LENGTH,
        INDEX_LENGTH,
        DATA_FREE,
        AUTO_INCREMENT,
        CREATE_TIME,
        UPDATE_TIME,
        CHECK_TIME,
        TABLE_COLLATION
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  async getIndexes(tableName: string): Promise<any> {
    const sql = `
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        SEQ_IN_INDEX,
        NON_UNIQUE,
        INDEX_TYPE,
        CARDINALITY
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  async optimizeTable(tableName: string): Promise<void> {
    await this.query(`OPTIMIZE TABLE ${tableName}`);
  }

  async analyzeTable(tableName: string): Promise<void> {
    await this.query(`ANALYZE TABLE ${tableName}`);
  }

  async checkTable(tableName: string): Promise<any> {
    const result = await this.query(`CHECK TABLE ${tableName}`);
    return result.rows;
  }

  async repairTable(tableName: string): Promise<any> {
    const result = await this.query(`REPAIR TABLE ${tableName}`);
    return result.rows;
  }

  async showProcessList(): Promise<any> {
    const result = await this.query('SHOW PROCESSLIST');
    return result.rows;
  }

  async showStatus(pattern?: string): Promise<any> {
    let sql = 'SHOW STATUS';
    const params: any[] = [];
    
    if (pattern) {
      sql += ' LIKE ?';
      params.push(pattern);
    }

    const result = await this.query(sql, params);
    return result.rows;
  }

  async showVariables(pattern?: string): Promise<any> {
    let sql = 'SHOW VARIABLES';
    const params: any[] = [];
    
    if (pattern) {
      sql += ' LIKE ?';
      params.push(pattern);
    }

    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Enhanced validation methods for MySQL
   */
  async validateExists(tableName: string, conditions: Record<string, any>): Promise<boolean> {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    
    const sql = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`;
    const result = await this.executeQuery(sql, Object.values(conditions));
    
    return result.rows && result.rows[0] && result.rows[0].count > 0;
  }

  async validateCount(tableName: string, expectedCount: number, conditions?: Record<string, any>): Promise<boolean> {
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`;
    let params: any[] = [];

    if (conditions) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params = Object.values(conditions);
    }

    const result = await this.executeQuery(sql, params);
    return result.rows && result.rows[0] && result.rows[0].count === expectedCount;
  }

  /**
   * Bulk operations
   */
  async bulkInsert(tableName: string, data: Record<string, any>[]): Promise<QueryResult> {
    if (!data.length) {
      throw new Error('No data provided for bulk insert');
    }

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    // For MySQL, we'll do multiple individual inserts for simplicity
    // In production, you might want to use INSERT ... VALUES (...), (...), (...)
    let totalAffected = 0;
    
    await this.beginTransaction();
    try {
      for (const row of data) {
        const values = columns.map(col => row[col]);
        const result = await this.query(sql, values);
        totalAffected += result.affectedRows || 0;
      }
      await this.commit();
      
      return {
        rows: [],
        rowCount: totalAffected,
        affectedRows: totalAffected,
        executionTime: 0
      };
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}