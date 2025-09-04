/**
 * Redis Client Implementation for RestifiedTS
 */

import { DatabaseClient, DatabaseConfig, QueryResult } from './DatabaseClient';
import { VariableStore } from '../stores/variable.core';

export class RedisClient extends DatabaseClient {
  private client: any = null;
  private redisModule: any = null;
  private pipeline: any = null;

  constructor(config: DatabaseConfig, variableStore: VariableStore) {
    super(config, variableStore);
  }

  async connect(): Promise<void> {
    try {
      // Dynamic require for redis - will fail gracefully if not installed
      this.redisModule = require('redis');

      const clientConfig: any = {
        host: this.config.host || 'localhost',
        port: this.config.port || 6379,
        password: this.config.password,
        username: this.config.username || 'default',
        database: this.config.options?.database || 0,
        connectTimeout: this.config.timeout || 10000,
        commandTimeout: this.config.options?.commandTimeout || 5000,
        lazyConnect: this.config.options?.lazyConnect !== false,
        keepAlive: this.config.options?.keepAlive || 30000,
        family: this.config.options?.family || 4,
        keyPrefix: this.config.options?.keyPrefix || '',
        retryDelayOnFailover: this.config.options?.retryDelayOnFailover || 100,
        enableOfflineQueue: this.config.options?.enableOfflineQueue !== false,
        maxRetriesPerRequest: this.config.options?.maxRetriesPerRequest || 3,
        retryConnectOnFailure: this.config.options?.retryConnectOnFailure !== false,
        autoResubscribe: this.config.options?.autoResubscribe !== false,
        autoResendUnfulfilledCommands: this.config.options?.autoResendUnfulfilledCommands !== false,
        ...this.config.options
      };

      // Handle connection string format
      if (this.config.connectionString) {
        this.client = this.redisModule.createClient({
          url: this.config.connectionString,
          ...clientConfig
        });
      } else {
        this.client = this.redisModule.createClient(clientConfig);
      }

      // Set up error handler
      this.client.on('error', (err: any) => {
        console.warn('Redis client error:', err);
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
      });

      this.client.on('reconnecting', () => {
        console.log('Redis client reconnecting');
      });

      await this.client.connect();
      
      // Select database if specified
      if (this.config.options?.database) {
        await this.client.select(this.config.options.database);
      }
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('Redis client requires "redis" package. Install with: npm install redis');
      }
      throw new Error(`Failed to connect to Redis: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
      }
    } catch (error: any) {
      // Force disconnect if graceful quit fails
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
      }
      throw new Error(`Failed to disconnect from Redis: ${error.message}`);
    }
  }

  async query(command: string, params?: any[]): Promise<QueryResult> {
    if (!this.client) {
      throw new Error('No Redis connection available');
    }

    try {
      // Parse command - Redis uses command-based operations
      const commandObj = this.parseRedisCommand(command, params);
      const startTime = Date.now();
      
      let result: any;
      
      if (commandObj.isMulti) {
        // Handle multi/pipeline commands
        result = await this.executeMultiCommand(commandObj.commands);
      } else {
        // Execute single command
        result = await this.executeSingleCommand(commandObj.command, commandObj.args);
      }

      const endTime = Date.now();

      return {
        rows: Array.isArray(result) ? result : [result],
        rowCount: Array.isArray(result) ? result.length : (result !== null ? 1 : 0),
        metadata: {
          command: commandObj.command,
          type: typeof result
        },
        executionTime: endTime - startTime
      };
    } catch (error: any) {
      throw new Error(`Redis command failed: ${error.message}`);
    }
  }

  private parseRedisCommand(command: string, params?: any[]): any {
    try {
      // Try to parse as JSON first (for complex operations)
      const commandObj = JSON.parse(command);
      
      if (commandObj.multi || commandObj.pipeline) {
        return {
          isMulti: true,
          commands: commandObj.commands || []
        };
      }
      
      return {
        isMulti: false,
        command: commandObj.command,
        args: commandObj.args || params || []
      };
    } catch {
      // If not JSON, treat as simple command string
      const parts = command.trim().split(/\s+/);
      return {
        isMulti: false,
        command: parts[0].toLowerCase(),
        args: [...parts.slice(1), ...(params || [])]
      };
    }
  }

  private async executeSingleCommand(command: string, args: any[]): Promise<any> {
    // Convert command to Redis client method
    const cmd = command.toLowerCase();
    
    // Handle common Redis commands
    switch (cmd) {
      case 'get':
        return await this.client.get(args[0]);
      case 'set':
        return await this.client.set(args[0], args[1], args[2] ? { EX: args[2] } : {});
      case 'del':
        return await this.client.del(args);
      case 'exists':
        return await this.client.exists(args);
      case 'expire':
        return await this.client.expire(args[0], args[1]);
      case 'ttl':
        return await this.client.ttl(args[0]);
      case 'keys':
        return await this.client.keys(args[0] || '*');
      case 'hget':
        return await this.client.hGet(args[0], args[1]);
      case 'hset':
        return await this.client.hSet(args[0], args[1], args[2]);
      case 'hgetall':
        return await this.client.hGetAll(args[0]);
      case 'lpush':
        return await this.client.lPush(args[0], args.slice(1));
      case 'rpush':
        return await this.client.rPush(args[0], args.slice(1));
      case 'lpop':
        return await this.client.lPop(args[0]);
      case 'rpop':
        return await this.client.rPop(args[0]);
      case 'llen':
        return await this.client.lLen(args[0]);
      case 'lrange':
        return await this.client.lRange(args[0], args[1], args[2]);
      case 'sadd':
        return await this.client.sAdd(args[0], args.slice(1));
      case 'srem':
        return await this.client.sRem(args[0], args.slice(1));
      case 'smembers':
        return await this.client.sMembers(args[0]);
      case 'scard':
        return await this.client.sCard(args[0]);
      case 'zadd':
        const zaddArgs = [];
        for (let i = 1; i < args.length; i += 2) {
          zaddArgs.push({ score: args[i], value: args[i + 1] });
        }
        return await this.client.zAdd(args[0], zaddArgs);
      case 'zrange':
        return await this.client.zRange(args[0], args[1], args[2]);
      case 'zcard':
        return await this.client.zCard(args[0]);
      case 'incr':
        return await this.client.incr(args[0]);
      case 'decr':
        return await this.client.decr(args[0]);
      case 'incrby':
        return await this.client.incrBy(args[0], args[1]);
      case 'decrby':
        return await this.client.decrBy(args[0], args[1]);
      case 'ping':
        return await this.client.ping();
      case 'info':
        return await this.client.info(args[0]);
      case 'flushdb':
        return await this.client.flushDb();
      case 'flushall':
        return await this.client.flushAll();
      case 'dbsize':
        return await this.client.dbSize();
      case 'select':
        return await this.client.select(args[0]);
      default:
        // Try to execute as generic command
        return await (this.client as any)[cmd]?.(...args) || 
               await this.client.sendCommand([cmd, ...args]);
    }
  }

  private async executeMultiCommand(commands: any[]): Promise<any[]> {
    const multi = this.client.multi();
    
    for (const cmd of commands) {
      if (Array.isArray(cmd)) {
        multi.addCommand(cmd);
      } else if (typeof cmd === 'object' && cmd.command) {
        multi.addCommand([cmd.command, ...(cmd.args || [])]);
      }
    }
    
    return await multi.exec();
  }

  // Redis doesn't have traditional transactions like SQL databases
  async beginTransaction(): Promise<void> {
    this.pipeline = this.client.multi();
  }

  async commit(): Promise<void> {
    if (!this.pipeline) {
      throw new Error('No active transaction');
    }
    
    await this.pipeline.exec();
    this.pipeline = null;
  }

  async rollback(): Promise<void> {
    if (!this.pipeline) {
      throw new Error('No active transaction');
    }
    
    // Redis doesn't support rollback, just discard the pipeline
    this.pipeline.discard();
    this.pipeline = null;
  }

  async getTableSchema(keyPattern: string): Promise<any> {
    // Redis doesn't have schemas, but we can analyze key patterns
    const keys = await this.client.keys(keyPattern || '*');
    const schema: any = {};
    
    for (const key of keys.slice(0, 100)) { // Limit to first 100 keys
      const type = await this.client.type(key);
      const ttl = await this.client.ttl(key);
      
      if (!schema[type]) {
        schema[type] = {
          count: 0,
          examples: []
        };
      }
      
      schema[type].count++;
      if (schema[type].examples.length < 5) {
        schema[type].examples.push({
          key: key,
          ttl: ttl
        });
      }
    }
    
    return schema;
  }

  isConnected(): boolean {
    return this.client && this.client.isReady;
  }

  /**
   * Redis specific methods
   */

  async getInfo(section?: string): Promise<any> {
    const info = await this.client.info(section);
    
    // Parse info string into object
    const infoObj: any = {};
    const lines = info.split('\r\n');
    let currentSection = '';
    
    for (const line of lines) {
      if (line.startsWith('#')) {
        currentSection = line.substring(1).trim();
        infoObj[currentSection] = {};
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (currentSection) {
          infoObj[currentSection][key] = value;
        } else {
          infoObj[key] = value;
        }
      }
    }
    
    return infoObj;
  }

  async getKeys(pattern: string = '*'): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async getKeysByType(type: string, pattern: string = '*'): Promise<string[]> {
    const keys = await this.client.keys(pattern);
    const filteredKeys = [];
    
    for (const key of keys) {
      const keyType = await this.client.type(key);
      if (keyType === type) {
        filteredKeys.push(key);
      }
    }
    
    return filteredKeys;
  }

  async getKeyInfo(key: string): Promise<any> {
    const exists = await this.client.exists(key);
    if (!exists) {
      return null;
    }
    
    const type = await this.client.type(key);
    const ttl = await this.client.ttl(key);
    let size = 0;
    let sample = null;
    
    switch (type) {
      case 'string':
        const strVal = await this.client.get(key);
        size = strVal ? strVal.length : 0;
        sample = strVal;
        break;
      case 'list':
        size = await this.client.lLen(key);
        sample = await this.client.lRange(key, 0, 4);
        break;
      case 'set':
        size = await this.client.sCard(key);
        sample = await this.client.sMembers(key);
        if (sample.length > 5) sample = sample.slice(0, 5);
        break;
      case 'zset':
        size = await this.client.zCard(key);
        sample = await this.client.zRange(key, 0, 4, { WITHSCORES: true });
        break;
      case 'hash':
        size = await this.client.hLen(key);
        const allFields = await this.client.hGetAll(key);
        sample = Object.keys(allFields).slice(0, 5).reduce((obj: any, field) => {
          obj[field] = allFields[field];
          return obj;
        }, {});
        break;
    }
    
    return {
      key,
      type,
      ttl,
      size,
      sample
    };
  }

  async validateKeyExists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) > 0;
  }

  async validateKeyType(key: string, expectedType: string): Promise<boolean> {
    const type = await this.client.type(key);
    return type === expectedType;
  }

  async validateKeyPattern(pattern: string, expectedCount?: { min?: number; max?: number }): Promise<boolean> {
    const keys = await this.client.keys(pattern);
    
    if (!expectedCount) {
      return true;
    }
    
    const count = keys.length;
    
    if (expectedCount.min !== undefined && count < expectedCount.min) {
      return false;
    }
    
    if (expectedCount.max !== undefined && count > expectedCount.max) {
      return false;
    }
    
    return true;
  }

  /**
   * Enhanced validation methods for Redis
   */
  async validateExists(keyPattern: string, conditions: Record<string, any>): Promise<boolean> {
    const keys = await this.client.keys(keyPattern);
    
    for (const key of keys) {
      const keyInfo = await this.getKeyInfo(key);
      
      // Check conditions against key info
      for (const [field, expectedValue] of Object.entries(conditions)) {
        if (keyInfo && keyInfo[field] !== expectedValue) {
          return false;
        }
      }
    }
    
    return keys.length > 0;
  }

  async validateCount(keyPattern: string, expectedCount: number): Promise<boolean> {
    const keys = await this.client.keys(keyPattern);
    return keys.length === expectedCount;
  }

  /**
   * Bulk operations
   */
  async bulkSet(data: Record<string, any>, ttl?: number): Promise<QueryResult> {
    const multi = this.client.multi();
    let operations = 0;
    
    for (const [key, value] of Object.entries(data)) {
      if (ttl) {
        multi.setEx(key, ttl, value);
      } else {
        multi.set(key, value);
      }
      operations++;
    }
    
    const results = await multi.exec();
    
    return {
      rows: results,
      rowCount: operations,
      affectedRows: operations,
      executionTime: 0
    };
  }

  async bulkDelete(keys: string[]): Promise<QueryResult> {
    if (!keys.length) {
      return { rows: [], rowCount: 0, affectedRows: 0, executionTime: 0 };
    }
    
    const result = await this.client.del(keys);
    
    return {
      rows: [],
      rowCount: result,
      affectedRows: result,
      executionTime: 0
    };
  }
}