/**
 * PostgreSQL Client Implementation for RestifiedTS
 */

import { DatabaseClient, DatabaseConfig, QueryResult } from './DatabaseClient';
import { VariableStore } from '../stores/variable.core';

export class PostgreSQLClient extends DatabaseClient {
  private client: any = null;
  private Pool: any = null;
  private pool: any = null;
  private transaction: any = null;
  private pgModule: any = null;

  constructor(config: DatabaseConfig, variableStore: VariableStore) {
    super(config, variableStore);
  }

  async connect(): Promise<void> {
    try {
      // Dynamic require for pg - will fail gracefully if not installed
      this.pgModule = require('pg');
      const { Pool, Client } = this.pgModule;
      this.Pool = Pool;

      const connectionConfig = {
        host: this.config.host,
        port: this.config.port || 5432,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        connectionString: this.config.connectionString,
        connectionTimeoutMillis: this.config.timeout || 30000,
        ...this.config.options
      };

      if (this.config.pool) {
        this.pool = new Pool({
          ...connectionConfig,
          min: this.config.pool.min || 1,
          max: this.config.pool.max || 10,
          idleTimeoutMillis: this.config.pool.idleTimeoutMillis || 30000
        });
        
        // Test connection
        const client = await this.pool.connect();
        client.release();
      } else {
        this.client = new Client(connectionConfig);
        await this.client.connect();
      }
    } catch (error: any) {
      throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      
      if (this.client) {
        await this.client.end();
        this.client = null;
      }
    } catch (error: any) {
      throw new Error(`Failed to disconnect from PostgreSQL: ${error.message}`);
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    try {
      const executor = this.transaction || this.pool || this.client;
      
      if (!executor) {
        throw new Error('No database connection available');
      }

      const startTime = Date.now();
      const result = await executor.query(sql, params);
      const endTime = Date.now();

      return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields,
        executionTime: endTime - startTime
      };
    } catch (error: any) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async beginTransaction(): Promise<void> {
    try {
      if (this.pool) {
        this.transaction = await this.pool.connect();
        await this.transaction.query('BEGIN');
      } else if (this.client) {
        await this.client.query('BEGIN');
        this.transaction = this.client;
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

      await this.transaction.query('COMMIT');
      
      if (this.pool && this.transaction !== this.client) {
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

      await this.transaction.query('ROLLBACK');
      
      if (this.pool && this.transaction !== this.client) {
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
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  isConnected(): boolean {
    return (this.client && !this.client._ending) || (this.pool && !this.pool.ending);
  }

  /**
   * PostgreSQL specific methods
   */

  async getTableStats(tableName: string): Promise<any> {
    const sql = `
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE tablename = $1
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  async getIndexes(tableName: string): Promise<any> {
    const sql = `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = $1
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  async analyzeTable(tableName: string): Promise<void> {
    await this.query(`ANALYZE ${tableName}`);
  }

  async vacuumTable(tableName: string): Promise<void> {
    await this.query(`VACUUM ${tableName}`);
  }
}