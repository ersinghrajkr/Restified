/**
 * SQLite Client Implementation for RestifiedTS
 */

import { DatabaseClient, DatabaseConfig, QueryResult } from './DatabaseClient';
import { VariableStore } from '../stores/variable.core';

export class SQLiteClient extends DatabaseClient {
  private db: any = null;
  private transaction: any = null;
  private sqliteModule: any = null;
  private inTransaction = false;

  constructor(config: DatabaseConfig, variableStore: VariableStore) {
    super(config, variableStore);
  }

  async connect(): Promise<void> {
    try {
      // Dynamic require for sqlite3 - will fail gracefully if not installed
      this.sqliteModule = require('sqlite3');
      const sqlite3 = this.sqliteModule.verbose();

      const filename = this.config.options?.filename || this.config.database || ':memory:';
      const mode = this.getOpenMode();

      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(filename, mode, (err: any) => {
          if (err) {
            reject(new Error(`Failed to connect to SQLite: ${err.message}`));
            return;
          }

          // Configure SQLite settings
          this.configureSQLite()
            .then(() => resolve())
            .catch(reject);
        });
      });
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('SQLite client requires "sqlite3" package. Install with: npm install sqlite3');
      }
      throw new Error(`Failed to connect to SQLite: ${error.message}`);
    }
  }

  private getOpenMode(): number {
    const sqlite3 = this.sqliteModule;
    let mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;

    if (this.config.options?.readonly) {
      mode = sqlite3.OPEN_READONLY;
    }

    if (this.config.options?.memory) {
      // In-memory database
      return mode;
    }

    if (this.config.options?.fileMustExist) {
      mode = mode & ~sqlite3.OPEN_CREATE;
    }

    return mode;
  }

  private async configureSQLite(): Promise<void> {
    const pragmas = {
      journal_mode: this.config.options?.journalMode || 'WAL',
      synchronous: this.config.options?.synchronous || 'NORMAL',
      temp_store: this.config.options?.tempStore || 'MEMORY',
      mmap_size: this.config.options?.mmapSize || 268435456,
      cache_size: this.config.options?.cacheSize || -2000,
      foreign_keys: 'ON',
      ...this.config.options?.pragmas
    };

    for (const [key, value] of Object.entries(pragmas)) {
      await this.runPragma(key, value);
    }

    // Set busy timeout
    if (this.config.timeout) {
      await this.runPragma('busy_timeout', this.config.timeout);
    }

    // Register custom functions if provided
    if (this.config.options?.functions) {
      for (const [name, func] of Object.entries(this.config.options.functions)) {
        this.db.function(name, func);
      }
    }
  }

  private runPragma(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`PRAGMA ${key} = ${value}`, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    try {
      if (this.db) {
        return new Promise((resolve, reject) => {
          this.db.close((err: any) => {
            if (err) {
              reject(new Error(`Failed to disconnect from SQLite: ${err.message}`));
            } else {
              this.db = null;
              resolve();
            }
          });
        });
      }
    } catch (error: any) {
      throw new Error(`Failed to disconnect from SQLite: ${error.message}`);
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('No database connection available');
    }

    const startTime = Date.now();

    try {
      // Determine query type
      const sqlTrimmed = sql.trim().toUpperCase();
      const isSelect = sqlTrimmed.startsWith('SELECT') || sqlTrimmed.startsWith('WITH');
      const isPragma = sqlTrimmed.startsWith('PRAGMA');

      if (isSelect || isPragma) {
        // SELECT queries return rows
        return await this.executeSelectQuery(sql, params, startTime);
      } else {
        // INSERT, UPDATE, DELETE queries
        return await this.executeModifyQuery(sql, params, startTime);
      }
    } catch (error: any) {
      throw new Error(`SQLite query failed: ${error.message}`);
    }
  }

  private executeSelectQuery(sql: string, params?: any[], startTime?: number): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params || [], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const endTime = Date.now();
        resolve({
          rows: rows || [],
          rowCount: rows ? rows.length : 0,
          executionTime: endTime - (startTime || Date.now())
        });
      });
    });
  }

  private executeModifyQuery(sql: string, params?: any[], startTime?: number): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], function(this: any, err: any) {
        if (err) {
          reject(err);
          return;
        }

        const endTime = Date.now();
        resolve({
          rows: [],
          rowCount: this.changes || 0,
          insertId: this.lastID,
          affectedRows: this.changes || 0,
          executionTime: endTime - (startTime || Date.now())
        });
      });
    });
  }

  async beginTransaction(): Promise<void> {
    try {
      if (this.inTransaction) {
        throw new Error('Transaction already in progress');
      }

      await this.executeModifyQuery('BEGIN TRANSACTION');
      this.inTransaction = true;
      this.transaction = true;
    } catch (error: any) {
      throw new Error(`Failed to begin transaction: ${error.message}`);
    }
  }

  async commit(): Promise<void> {
    try {
      if (!this.inTransaction) {
        throw new Error('No active transaction');
      }

      await this.executeModifyQuery('COMMIT');
      this.inTransaction = false;
      this.transaction = null;
    } catch (error: any) {
      throw new Error(`Failed to commit transaction: ${error.message}`);
    }
  }

  async rollback(): Promise<void> {
    try {
      if (!this.inTransaction) {
        throw new Error('No active transaction');
      }

      await this.executeModifyQuery('ROLLBACK');
      this.inTransaction = false;
      this.transaction = null;
    } catch (error: any) {
      throw new Error(`Failed to rollback transaction: ${error.message}`);
    }
  }

  async getTableSchema(tableName: string): Promise<any> {
    const result = await this.query(`PRAGMA table_info(${tableName})`);
    return result.rows;
  }

  isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * SQLite specific methods
   */

  async getTables(): Promise<string[]> {
    const result = await this.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    return result.rows?.map((row: any) => row.name) || [];
  }

  async getIndexes(tableName?: string): Promise<any> {
    let sql = `
      SELECT name, tbl_name, sql 
      FROM sqlite_master 
      WHERE type='index' AND sql IS NOT NULL
    `;
    
    if (tableName) {
      sql += ` AND tbl_name='${tableName}'`;
    }
    
    sql += ` ORDER BY tbl_name, name`;

    const result = await this.query(sql);
    return result.rows;
  }

  async getTableInfo(tableName: string): Promise<any> {
    const result = await this.query(`PRAGMA table_info(${tableName})`);
    return result.rows;
  }

  async getForeignKeys(tableName: string): Promise<any> {
    const result = await this.query(`PRAGMA foreign_key_list(${tableName})`);
    return result.rows;
  }

  async analyze(tableName?: string): Promise<void> {
    const sql = tableName ? `ANALYZE ${tableName}` : 'ANALYZE';
    await this.query(sql);
  }

  async vacuum(): Promise<void> {
    await this.query('VACUUM');
  }

  async reindex(indexName?: string): Promise<void> {
    const sql = indexName ? `REINDEX ${indexName}` : 'REINDEX';
    await this.query(sql);
  }

  async checkpoint(mode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE' = 'PASSIVE'): Promise<any> {
    const result = await this.query(`PRAGMA wal_checkpoint(${mode})`);
    return result.rows;
  }

  async getDatabaseInfo(): Promise<any> {
    const queries = [
      'PRAGMA database_list',
      'PRAGMA compile_options',
      'PRAGMA user_version',
      'PRAGMA application_id',
      'PRAGMA page_count',
      'PRAGMA page_size',
      'PRAGMA freelist_count',
      'PRAGMA cache_size',
      'PRAGMA journal_mode',
      'PRAGMA synchronous',
      'PRAGMA foreign_keys'
    ];

    const info: any = {};
    
    for (const query of queries) {
      try {
        const result = await this.query(query);
        const pragmaName = query.replace('PRAGMA ', '');
        info[pragmaName] = result.rows;
      } catch (error) {
        // Some pragmas might not be available in all SQLite versions
        console.warn(`Failed to execute ${query}:`, error);
      }
    }

    return info;
  }

  /**
   * Enhanced validation methods for SQLite
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
   * Backup and restore operations
   */
  async backup(destinationPath: string): Promise<void> {
    if (!this.config.options?.filename || this.config.options?.memory) {
      throw new Error('Cannot backup in-memory database');
    }

    return new Promise((resolve, reject) => {
      const fs = require('fs');
      const path = require('path');

      try {
        // Simple file copy for SQLite backup
        fs.copyFileSync(this.config.options.filename, destinationPath);
        resolve();
      } catch (error: any) {
        reject(new Error(`Backup failed: ${error.message}`));
      }
    });
  }

  async loadFromFile(sqlFilePath: string): Promise<void> {
    const fs = require('fs');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL file into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    await this.beginTransaction();
    try {
      for (const statement of statements) {
        if (statement.trim()) {
          await this.query(statement.trim());
        }
      }
      await this.commit();
    } catch (error) {
      await this.rollback();
      throw error;
    }
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

    let totalAffected = 0;
    
    await this.beginTransaction();
    try {
      // Prepare statement for better performance
      const stmt = this.db.prepare(sql);
      
      for (const row of data) {
        const values = columns.map(col => row[col]);
        stmt.run(values);
        totalAffected++;
      }
      
      stmt.finalize();
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