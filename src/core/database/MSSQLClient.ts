/**
 * Microsoft SQL Server Client Implementation for RestifiedTS
 */

import { DatabaseClient, DatabaseConfig, QueryResult } from './DatabaseClient';
import { VariableStore } from '../stores/variable.core';

export class MSSQLClient extends DatabaseClient {
  private pool: any = null;
  private transaction: any = null;
  private mssqlModule: any = null;

  constructor(config: DatabaseConfig, variableStore: VariableStore) {
    super(config, variableStore);
  }

  async connect(): Promise<void> {
    try {
      // Dynamic require for mssql - will fail gracefully if not installed
      this.mssqlModule = require('mssql');

      const connectionConfig: any = {
        server: this.config.host || this.config.options?.server || 'localhost',
        port: this.config.port || 1433,
        database: this.config.database,
        user: this.config.username || this.config.options?.user,
        password: this.config.password,
        domain: this.config.options?.domain,
        connectionTimeout: this.config.timeout || this.config.options?.connectionTimeout || 15000,
        requestTimeout: this.config.options?.requestTimeout || 30000,
        cancelTimeout: this.config.options?.cancelTimeout || 5000,
        
        // Connection pool settings
        pool: {
          max: this.config.pool?.max || this.config.options?.pool?.max || 10,
          min: this.config.pool?.min || this.config.options?.pool?.min || 0,
          acquireTimeoutMillis: this.config.pool?.idleTimeoutMillis || this.config.options?.pool?.acquireTimeoutMillis || 60000,
          createTimeoutMillis: this.config.options?.pool?.createTimeoutMillis || 30000,
          destroyTimeoutMillis: this.config.options?.pool?.destroyTimeoutMillis || 5000,
          idleTimeoutMillis: this.config.pool?.idleTimeoutMillis || this.config.options?.pool?.idleTimeoutMillis || 30000,
          reapIntervalMillis: this.config.options?.pool?.reapIntervalMillis || 1000,
          createRetryIntervalMillis: this.config.options?.pool?.createRetryIntervalMillis || 200
        },

        // Advanced options
        options: {
          encrypt: this.config.options?.options?.encrypt !== false, // Default to true
          trustServerCertificate: this.config.options?.options?.trustServerCertificate || false,
          enableArithAbort: this.config.options?.options?.enableArithAbort !== false,
          instanceName: this.config.options?.options?.instanceName,
          useUTC: this.config.options?.options?.useUTC !== false,
          dateFirst: this.config.options?.options?.dateFirst || 7,
          language: this.config.options?.options?.language || 'us_english',
          rowCollectionOnDone: this.config.options?.options?.rowCollectionOnDone || false,
          rowCollectionOnRequestCompletion: this.config.options?.options?.rowCollectionOnRequestCompletion || false,
          tdsVersion: this.config.options?.options?.tdsVersion || '7_4',
          serverName: this.config.options?.options?.serverName,
          camelCaseColumns: this.config.options?.options?.camelCaseColumns || false,
          columnNameReplacer: this.config.options?.options?.columnNameReplacer,
          isolationLevel: this.mssqlModule.ISOLATION_LEVEL.READ_COMMITTED,
          connectionIsolationLevel: this.mssqlModule.ISOLATION_LEVEL.READ_COMMITTED,
          readOnlyIntent: this.config.options?.options?.readOnlyIntent || false,
          cryptoCredentialsDetails: this.config.options?.options?.cryptoCredentialsDetails || {},
          ...this.config.options?.options
        },

        // Authentication
        authentication: this.config.options?.authentication || {
          type: 'default'
        },

        // Parse connection string if provided
        ...(this.config.connectionString && this.parseConnectionString(this.config.connectionString))
      };

      // Create connection pool
      this.pool = new this.mssqlModule.ConnectionPool(connectionConfig);
      
      // Set up event handlers
      this.pool.on('error', (err: any) => {
        console.warn('MSSQL pool error:', err);
      });

      await this.pool.connect();
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('MSSQL client requires "mssql" package. Install with: npm install mssql');
      }
      throw new Error(`Failed to connect to SQL Server: ${error.message}`);
    }
  }

  private parseConnectionString(connectionString: string): any {
    const config: any = {};
    const parts = connectionString.split(';');
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        const lowerKey = key.trim().toLowerCase();
        const trimmedValue = value.trim();
        
        switch (lowerKey) {
          case 'server':
          case 'data source':
            config.server = trimmedValue;
            break;
          case 'database':
          case 'initial catalog':
            config.database = trimmedValue;
            break;
          case 'user id':
          case 'uid':
            config.user = trimmedValue;
            break;
          case 'password':
          case 'pwd':
            config.password = trimmedValue;
            break;
          case 'encrypt':
            config.options = config.options || {};
            config.options.encrypt = trimmedValue.toLowerCase() === 'true';
            break;
          case 'trustservercertificate':
            config.options = config.options || {};
            config.options.trustServerCertificate = trimmedValue.toLowerCase() === 'true';
            break;
          case 'connection timeout':
            config.connectionTimeout = parseInt(trimmedValue, 10);
            break;
          case 'command timeout':
            config.requestTimeout = parseInt(trimmedValue, 10);
            break;
        }
      }
    }
    
    return config;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.transaction) {
        try {
          await this.transaction.rollback();
        } catch {
          // Ignore rollback errors during disconnect
        }
        this.transaction = null;
      }

      if (this.pool) {
        await this.pool.close();
        this.pool = null;
      }
    } catch (error: any) {
      throw new Error(`Failed to disconnect from SQL Server: ${error.message}`);
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    try {
      if (!this.pool) {
        throw new Error('No database connection available');
      }

      const startTime = Date.now();
      const request = this.transaction ? 
        new this.mssqlModule.Request(this.transaction) : 
        new this.mssqlModule.Request(this.pool);

      // Add parameters if provided
      if (params) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });

        // Replace ? placeholders with @param0, @param1, etc.
        let paramIndex = 0;
        sql = sql.replace(/\?/g, () => `@param${paramIndex++}`);
      }

      const result = await request.query(sql);
      const endTime = Date.now();

      return {
        rows: result.recordset || [],
        rowCount: result.rowsAffected ? result.rowsAffected[0] || 0 : (result.recordset?.length || 0),
        fields: result.recordset?.columns,
        affectedRows: result.rowsAffected ? result.rowsAffected[0] || 0 : 0,
        metadata: {
          output: result.output,
          returnValue: result.returnValue
        },
        executionTime: endTime - startTime
      };
    } catch (error: any) {
      throw new Error(`SQL Server query failed: ${error.message}`);
    }
  }

  async beginTransaction(): Promise<void> {
    try {
      if (!this.pool) {
        throw new Error('No database connection available');
      }

      if (this.transaction) {
        throw new Error('Transaction already in progress');
      }

      this.transaction = new this.mssqlModule.Transaction(this.pool);
      await this.transaction.begin();
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
        COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsIdentity') as is_identity,
        COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsComputed') as is_computed
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = @param0
      ORDER BY ORDINAL_POSITION
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  isConnected(): boolean {
    return this.pool && this.pool.connected;
  }

  /**
   * SQL Server specific methods
   */

  async getTableStats(tableName: string): Promise<any> {
    const sql = `
      SELECT 
        t.name as table_name,
        p.rows as row_count,
        SUM(a.total_pages) * 8 as total_space_kb,
        SUM(a.used_pages) * 8 as used_space_kb,
        (SUM(a.total_pages) - SUM(a.used_pages)) * 8 as unused_space_kb,
        SUM(a.data_pages) * 8 as data_space_kb
      FROM sys.tables t
      INNER JOIN sys.indexes i ON t.object_id = i.object_id
      INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
      INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
      WHERE t.name = @param0
      GROUP BY t.name, p.rows
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  async getIndexes(tableName: string): Promise<any> {
    const sql = `
      SELECT 
        i.name as index_name,
        i.type_desc as index_type,
        i.is_unique,
        i.is_primary_key,
        i.is_unique_constraint,
        STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) as columns
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      WHERE t.name = @param0
      GROUP BY i.name, i.type_desc, i.is_unique, i.is_primary_key, i.is_unique_constraint
      ORDER BY i.name
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  async getForeignKeys(tableName: string): Promise<any> {
    const sql = `
      SELECT 
        fk.name as foreign_key_name,
        tp.name as parent_table,
        cp.name as parent_column,
        tr.name as referenced_table,
        cr.name as referenced_column,
        fk.delete_referential_action_desc as on_delete,
        fk.update_referential_action_desc as on_update
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
      INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
      INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
      INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
      WHERE tp.name = @param0
      ORDER BY fk.name
    `;

    const result = await this.query(sql, [tableName]);
    return result.rows;
  }

  async updateStatistics(tableName: string): Promise<void> {
    await this.query(`UPDATE STATISTICS ${tableName}`);
  }

  async rebuildIndexes(tableName: string): Promise<void> {
    await this.query(`ALTER INDEX ALL ON ${tableName} REBUILD`);
  }

  async getServerInfo(): Promise<any> {
    const queries = [
      'SELECT @@VERSION as version',
      'SELECT @@SERVERNAME as server_name',
      'SELECT @@SERVICENAME as service_name',
      'SELECT SERVERPROPERTY(\'ProductVersion\') as product_version',
      'SELECT SERVERPROPERTY(\'ProductLevel\') as product_level',
      'SELECT SERVERPROPERTY(\'Edition\') as edition',
      'SELECT SERVERPROPERTY(\'EngineEdition\') as engine_edition',
      'SELECT SERVERPROPERTY(\'MachineName\') as machine_name',
      'SELECT SERVERPROPERTY(\'InstanceName\') as instance_name'
    ];

    const info: any = {};
    
    for (const query of queries) {
      try {
        const result = await this.query(query);
        if (result.rows && result.rows[0]) {
          Object.assign(info, result.rows[0]);
        }
      } catch (error) {
        console.warn(`Failed to execute ${query}:`, error);
      }
    }

    return info;
  }

  async getDatabaseInfo(): Promise<any> {
    const sql = `
      SELECT 
        name as database_name,
        database_id,
        create_date,
        collation_name,
        state_desc as state,
        recovery_model_desc as recovery_model,
        page_verify_option_desc as page_verify_option,
        is_auto_close_on,
        is_auto_shrink_on,
        is_auto_create_stats_on,
        is_auto_update_stats_on
      FROM sys.databases
      WHERE name = DB_NAME()
    `;

    const result = await this.query(sql);
    return result.rows;
  }

  /**
   * Enhanced validation methods for SQL Server
   */
  async validateExists(tableName: string, conditions: Record<string, any>): Promise<boolean> {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = @param${index}`)
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
        .map((key, index) => `${key} = @param${index}`)
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

    const table = new this.mssqlModule.Table(tableName);
    const columns = Object.keys(data[0]);
    
    // Add columns to table (you might want to get actual column types from schema)
    columns.forEach(column => {
      table.columns.add(column, this.mssqlModule.VarChar(this.mssqlModule.MAX), { nullable: true });
    });

    // Add rows
    data.forEach(row => {
      const values = columns.map(col => row[col]);
      table.rows.add(...values);
    });

    const request = this.transaction ? 
      new this.mssqlModule.Request(this.transaction) : 
      new this.mssqlModule.Request(this.pool);

    const result = await request.bulk(table);

    return {
      rows: [],
      rowCount: result.rowsAffected,
      affectedRows: result.rowsAffected,
      executionTime: 0
    };
  }

  /**
   * Stored procedure execution
   */
  async executeStoredProcedure(procedureName: string, parameters?: Record<string, any>): Promise<QueryResult> {
    const request = this.transaction ? 
      new this.mssqlModule.Request(this.transaction) : 
      new this.mssqlModule.Request(this.pool);

    if (parameters) {
      for (const [name, value] of Object.entries(parameters)) {
        request.input(name, value);
      }
    }

    const startTime = Date.now();
    const result = await request.execute(procedureName);
    const endTime = Date.now();

    return {
      rows: result.recordset || [],
      rowCount: result.rowsAffected ? result.rowsAffected[0] || 0 : (result.recordset?.length || 0),
      fields: result.recordset?.columns,
      affectedRows: result.rowsAffected ? result.rowsAffected[0] || 0 : 0,
      metadata: {
        output: result.output,
        returnValue: result.returnValue
      },
      executionTime: endTime - startTime
    };
  }
}