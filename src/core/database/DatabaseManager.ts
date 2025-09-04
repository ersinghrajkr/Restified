/**
 * Database Manager for RestifiedTS
 * 
 * Manages multiple database connections and provides unified interface
 */

import { DatabaseClient, DatabaseConfig } from './DatabaseClient';
import { PostgreSQLClient } from './PostgreSQLClient';
import { MongoDBClient } from './MongoDBClient';
import { MySQLClient } from './MySQLClient';
import { SQLiteClient } from './SQLiteClient';
import { RedisClient } from './RedisClient';
import { MSSQLClient } from './MSSQLClient';
import { VariableStore } from '../stores/variable.core';

interface ExpectedRange {
  min?: number;
  max?: number;
}

interface ExpectedResult {
  [key: string]: any | ExpectedRange;
}

export class DatabaseManager {
  private clients: Map<string, DatabaseClient> = new Map();
  private variableStore: VariableStore;

  constructor(variableStore: VariableStore) {
    this.variableStore = variableStore;
  }

  /**
   * Create and register a database client
   */
  async createClient(name: string, config: DatabaseConfig): Promise<DatabaseClient> {
    let client: DatabaseClient;

    switch (config.type) {
      case 'postgresql':
        client = new PostgreSQLClient(config, this.variableStore);
        break;
      case 'mongodb':
        client = new MongoDBClient(config, this.variableStore);
        break;
      case 'mysql':
        client = new MySQLClient(config, this.variableStore);
        break;
      case 'sqlite':
        client = new SQLiteClient(config, this.variableStore);
        break;
      case 'redis':
        client = new RedisClient(config, this.variableStore);
        break;
      case 'mssql':
        client = new MSSQLClient(config, this.variableStore);
        break;
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }

    await client.connect();
    this.clients.set(name, client);
    return client;
  }

  /**
   * Get existing database client
   */
  getClient(name: string): DatabaseClient {
    const client = this.clients.get(name);
    if (!client) {
      throw new Error(`Database client '${name}' not found`);
    }
    return client;
  }

  /**
   * Check if client exists
   */
  hasClient(name: string): boolean {
    return this.clients.has(name);
  }

  /**
   * Get all client names
   */
  getClientNames(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Remove and disconnect client
   */
  async removeClient(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);
    }
  }

  /**
   * Disconnect all clients
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map(client => 
      client.disconnect().catch(error => console.warn(`Failed to disconnect client:`, error))
    );

    await Promise.all(disconnectPromises);
    this.clients.clear();
  }

  /**
   * Health check all clients
   */
  async healthCheckAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [name, client] of this.clients) {
      try {
        results[name] = await client.healthCheck();
      } catch (error: any) {
        results[name] = {
          healthy: false,
          latency: 0,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Get statistics for all clients
   */
  async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [name, client] of this.clients) {
      try {
        stats[name] = await client.getStats();
      } catch (error: any) {
        stats[name] = {
          error: error.message,
          connected: false
        };
      }
    }

    return stats;
  }

  /**
   * Execute transaction across multiple databases
   */
  async executeTransaction(
    clientNames: string[],
    operation: (clients: Record<string, DatabaseClient>) => Promise<void>
  ): Promise<void> {
    const clients: Record<string, DatabaseClient> = {};
    
    // Get all clients
    for (const name of clientNames) {
      clients[name] = this.getClient(name);
    }

    // Begin transactions
    await Promise.all(Object.values(clients).map(client => client.beginTransaction()));

    try {
      // Execute operation
      await operation(clients);
      
      // Commit all transactions
      await Promise.all(Object.values(clients).map(client => client.commit()));
    } catch (error) {
      // Rollback all transactions
      await Promise.all(Object.values(clients).map(client => 
        client.rollback().catch(rollbackError => 
          console.warn('Rollback failed:', rollbackError)
        )
      ));
      throw error;
    }
  }

  /**
   * Validate database state across multiple clients
   */
  async validateDatabaseState(validations: Array<{
    client: string;
    table?: string;
    collection?: string;
    conditions?: Record<string, any>;
    expectedCount?: number | { min?: number; max?: number };
    customQuery?: string;
    expectedResult?: any;
    timeout?: number;
  }>): Promise<{ success: boolean; results: any[] }> {
    const results = [];
    let allSuccess = true;

    for (const validation of validations) {
      try {
        const client = this.getClient(validation.client);
        const startTime = Date.now();

        let result: any = {};
        
        if (validation.customQuery) {
          // Execute custom query
          const queryResult = await client.executeQuery(validation.customQuery);
          result.queryResult = queryResult;
          result.success = true;
          
          if (validation.expectedResult) {
            // Validate against expected result
            result.success = this.validateQueryResult(queryResult, validation.expectedResult);
          }
        } else if (validation.table || validation.collection) {
          const tableName = validation.table || validation.collection!;
          
          if (typeof validation.expectedCount === 'number') {
            // Validate exact count
            result.success = await client.validateCount(tableName, validation.expectedCount, validation.conditions);
            result.expectedCount = validation.expectedCount;
          } else if (validation.expectedCount && typeof validation.expectedCount === 'object') {
            // Validate count range
            const countResult = await client.query(
              `SELECT COUNT(*) as count FROM ${tableName}`,
              validation.conditions ? Object.values(validation.conditions) : []
            );
            const actualCount = countResult.rows?.[0]?.count || 0;
            
            result.actualCount = actualCount;
            result.expectedCount = validation.expectedCount;
            result.success = true;
            
            if (validation.expectedCount.min !== undefined && actualCount < validation.expectedCount.min) {
              result.success = false;
              result.error = `Count ${actualCount} is below minimum ${validation.expectedCount.min}`;
            }
            
            if (validation.expectedCount.max !== undefined && actualCount > validation.expectedCount.max) {
              result.success = false;
              result.error = `Count ${actualCount} is above maximum ${validation.expectedCount.max}`;
            }
          } else {
            // Just validate existence
            result.success = await client.validateExists(tableName, validation.conditions || {});
          }
        }

        result.executionTime = Date.now() - startTime;
        result.client = validation.client;
        result.table = validation.table;
        result.collection = validation.collection;

        if (!result.success) {
          allSuccess = false;
        }

        results.push(result);
      } catch (error: any) {
        allSuccess = false;
        results.push({
          client: validation.client,
          table: validation.table,
          collection: validation.collection,
          success: false,
          error: error.message
        });
      }
    }

    return { success: allSuccess, results };
  }

  /**
   * Setup database state for testing
   */
  async setupDatabaseState(operations: Array<{
    client: string;
    action: 'insert' | 'update' | 'delete' | 'execute' | 'bulk';
    table?: string;
    collection?: string;
    data?: any[] | any;
    conditions?: Record<string, any>;
    sql?: string;
    parameters?: any[];
  }>): Promise<void> {
    for (const operation of operations) {
      const client = this.getClient(operation.client);
      
      switch (operation.action) {
        case 'insert':
          if (operation.data && Array.isArray(operation.data)) {
            await client.seedTestData(operation.table!, operation.data);
          } else if (operation.data) {
            await client.seedTestData(operation.table!, [operation.data]);
          }
          break;
          
        case 'bulk':
          if (operation.data && Array.isArray(operation.data)) {
            // Use bulk insert if available
            if (typeof (client as any).bulkInsert === 'function') {
              await (client as any).bulkInsert(operation.table!, operation.data);
            } else {
              await client.seedTestData(operation.table!, operation.data);
            }
          }
          break;
          
        case 'execute':
          if (operation.sql) {
            await client.executeQuery(operation.sql, operation.parameters);
          }
          break;
          
        case 'delete':
          if (operation.conditions) {
            await client.cleanupTestData(operation.table!, operation.conditions);
          }
          break;
          
        case 'update':
          // Basic update implementation
          if (operation.conditions && operation.data) {
            const whereClause = Object.keys(operation.conditions)
              .map((key, index) => `${key} = $${index + 1}`)
              .join(' AND ');
            const setClause = Object.keys(operation.data)
              .map((key, index) => `${key} = $${index + Object.keys(operation.conditions!).length + 1}`)
              .join(', ');
            
            const sql = `UPDATE ${operation.table} SET ${setClause} WHERE ${whereClause}`;
            const params = [...Object.values(operation.conditions), ...Object.values(operation.data)];
            await client.executeQuery(sql, params);
          }
          break;
      }
    }
  }

  /**
   * Cleanup database state after testing
   */
  async cleanupDatabaseState(operations: Array<{
    client: string;
    action: 'delete' | 'truncate' | 'execute';
    table?: string;
    collection?: string;
    conditions?: Record<string, any>;
    sql?: string;
    parameters?: any[];
  }>): Promise<void> {
    for (const operation of operations) {
      try {
        const client = this.getClient(operation.client);
        
        switch (operation.action) {
          case 'delete':
            if (operation.conditions) {
              await client.cleanupTestData(operation.table!, operation.conditions);
            }
            break;
            
          case 'truncate':
            await client.executeQuery(`TRUNCATE TABLE ${operation.table}`);
            break;
            
          case 'execute':
            if (operation.sql) {
              await client.executeQuery(operation.sql, operation.parameters);
            }
            break;
        }
      } catch (error) {
        console.warn(`Cleanup operation failed for ${operation.client}:`, error);
      }
    }
  }

  /**
   * Helper to validate query results
   */
  private validateQueryResult(queryResult: any, expectedResult: ExpectedResult): boolean {
    if (!queryResult.rows || !queryResult.rows.length) {
      return false;
    }

    const row = queryResult.rows[0];
    
    for (const [key, expected] of Object.entries(expectedResult)) {
      const actual = row[key];
      
      if (typeof expected === 'object' && expected !== null && 'min' in expected || 'max' in expected) {
        const range = expected as ExpectedRange;
        if (range.min !== undefined && actual < range.min) {
          return false;
        }
        if (range.max !== undefined && actual > range.max) {
          return false;
        }
      } else if (actual !== expected) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Database testing utilities
 */
export class DatabaseTestUtils {
  private manager: DatabaseManager;

  constructor(manager: DatabaseManager) {
    this.manager = manager;
  }

  /**
   * Setup test data across multiple databases
   */
  async setupTestData(config: Record<string, { tables: Record<string, any[]> }>): Promise<void> {
    for (const [clientName, data] of Object.entries(config)) {
      const client = this.manager.getClient(clientName);
      
      for (const [tableName, rows] of Object.entries(data.tables)) {
        await client.seedTestData(tableName, rows);
      }
    }
  }

  /**
   * Cleanup test data across multiple databases
   */
  async cleanupTestData(config: Record<string, { tables: Record<string, Record<string, any>> }>): Promise<void> {
    for (const [clientName, data] of Object.entries(config)) {
      const client = this.manager.getClient(clientName);
      
      for (const [tableName, conditions] of Object.entries(data.tables)) {
        await client.cleanupTestData(tableName, conditions);
      }
    }
  }

  /**
   * Create snapshots across multiple databases
   */
  async createSnapshots(config: Record<string, { name: string; tables: string[] }>): Promise<void> {
    for (const [clientName, snapshotConfig] of Object.entries(config)) {
      const client = this.manager.getClient(clientName);
      await client.createSnapshot(snapshotConfig.name, snapshotConfig.tables);
    }
  }

  /**
   * Validate data consistency across databases
   */
  async validateConsistency(
    validations: Array<{
      client: string;
      table: string;
      conditions: Record<string, any>;
      expectedCount?: number;
      shouldExist?: boolean;
    }>
  ): Promise<{ passed: boolean; results: any[] }> {
    const results = [];
    let allPassed = true;

    for (const validation of validations) {
      const client = this.manager.getClient(validation.client);
      
      try {
        let result;
        
        if (validation.expectedCount !== undefined) {
          result = await client.validateCount(
            validation.table, 
            validation.expectedCount, 
            validation.conditions
          );
        } else if (validation.shouldExist !== undefined) {
          result = await client.validateExists(validation.table, validation.conditions);
          result = result === validation.shouldExist;
        } else {
          throw new Error('Validation must specify expectedCount or shouldExist');
        }

        results.push({
          ...validation,
          passed: result,
          error: null
        });

        if (!result) {
          allPassed = false;
        }
      } catch (error: any) {
        results.push({
          ...validation,
          passed: false,
          error: error.message
        });
        allPassed = false;
      }
    }

    return { passed: allPassed, results };
  }
}