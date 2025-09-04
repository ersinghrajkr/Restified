/**
 * MongoDB Client Implementation for RestifiedTS
 */

import { DatabaseClient, DatabaseConfig, QueryResult } from './DatabaseClient';
import { VariableStore } from '../stores/variable.core';

export class MongoDBClient extends DatabaseClient {
  private client: any = null;
  private db: any = null;
  private session: any = null;
  private mongoModule: any = null;

  constructor(config: DatabaseConfig, variableStore: VariableStore) {
    super(config, variableStore);
  }

  async connect(): Promise<void> {
    try {
      // Dynamic require for mongodb - will fail gracefully if not installed
      this.mongoModule = require('mongodb');
      const { MongoClient } = this.mongoModule;

      const uri = this.config.connectionString || 
        `mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port || 27017}/${this.config.database}`;

      this.client = new MongoClient(uri, {
        connectTimeoutMS: this.config.timeout || 30000,
        ...this.config.options
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database);
    } catch (error: any) {
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.session) {
        await this.session.endSession();
        this.session = null;
      }

      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
      }
    } catch (error: any) {
      throw new Error(`Failed to disconnect from MongoDB: ${error.message}`);
    }
  }

  async query(operation: string, params?: any[]): Promise<QueryResult> {
    // For MongoDB, we'll interpret the 'sql' as a JSON operation
    try {
      const startTime = Date.now();
      let result: any;

      const operationObj = JSON.parse(operation);
      const { collection, method, query, options, document, documents } = operationObj;

      if (!this.db) {
        throw new Error('No database connection available');
      }

      const coll = this.db.collection(collection);

      switch (method) {
        case 'find':
          result = await coll.find(query || {}, options).toArray();
          break;
        case 'findOne':
          result = await coll.findOne(query || {}, options);
          break;
        case 'insertOne':
          result = await coll.insertOne(document, options);
          break;
        case 'insertMany':
          result = await coll.insertMany(documents, options);
          break;
        case 'updateOne':
          result = await coll.updateOne(query, document, options);
          break;
        case 'updateMany':
          result = await coll.updateMany(query, document, options);
          break;
        case 'deleteOne':
          result = await coll.deleteOne(query, options);
          break;
        case 'deleteMany':
          result = await coll.deleteMany(query, options);
          break;
        case 'countDocuments':
          result = await coll.countDocuments(query || {}, options);
          break;
        case 'aggregate':
          result = await coll.aggregate(query, options).toArray();
          break;
        default:
          throw new Error(`Unsupported MongoDB operation: ${method}`);
      }

      const endTime = Date.now();

      return {
        rows: Array.isArray(result) ? result : [result],
        rowCount: Array.isArray(result) ? result.length : 1,
        insertId: result?.insertedId,
        affectedRows: result?.modifiedCount || result?.deletedCount,
        metadata: {
          acknowledged: result?.acknowledged,
          insertedIds: result?.insertedIds,
          matchedCount: result?.matchedCount,
          modifiedCount: result?.modifiedCount,
          deletedCount: result?.deletedCount
        },
        executionTime: endTime - startTime
      };
    } catch (error: any) {
      throw new Error(`MongoDB operation failed: ${error.message}`);
    }
  }

  async beginTransaction(): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('No database connection available');
      }

      this.session = this.client.startSession();
      this.session.startTransaction();
    } catch (error: any) {
      throw new Error(`Failed to begin transaction: ${error.message}`);
    }
  }

  async commit(): Promise<void> {
    try {
      if (!this.session) {
        throw new Error('No active transaction');
      }

      await this.session.commitTransaction();
      await this.session.endSession();
      this.session = null;
    } catch (error: any) {
      throw new Error(`Failed to commit transaction: ${error.message}`);
    }
  }

  async rollback(): Promise<void> {
    try {
      if (!this.session) {
        throw new Error('No active transaction');
      }

      await this.session.abortTransaction();
      await this.session.endSession();
      this.session = null;
    } catch (error: any) {
      throw new Error(`Failed to rollback transaction: ${error.message}`);
    }
  }

  async getTableSchema(collectionName: string): Promise<any> {
    try {
      // MongoDB doesn't have strict schemas, so we'll sample documents
      const operation = JSON.stringify({
        collection: collectionName,
        method: 'find',
        options: { limit: 100 }
      });

      const result = await this.query(operation);
      const documents = result.rows || [];

      // Analyze document structure
      const schema: Record<string, any> = {};
      
      documents.forEach((doc: any) => {
        Object.keys(doc).forEach(key => {
          if (!schema[key]) {
            schema[key] = {
              type: typeof doc[key],
              examples: [doc[key]]
            };
          } else if (schema[key].examples.length < 5) {
            schema[key].examples.push(doc[key]);
          }
        });
      });

      return schema;
    } catch (error: any) {
      throw new Error(`Failed to get collection schema: ${error.message}`);
    }
  }

  isConnected(): boolean {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }

  /**
   * MongoDB specific helper methods
   */

  async findDocuments(collection: string, query: any = {}, options: any = {}): Promise<QueryResult> {
    const operation = JSON.stringify({
      collection,
      method: 'find',
      query,
      options
    });

    return this.executeQuery(operation);
  }

  async insertDocument(collection: string, document: any, options: any = {}): Promise<QueryResult> {
    const operation = JSON.stringify({
      collection,
      method: 'insertOne',
      document,
      options
    });

    return this.executeQuery(operation);
  }

  async updateDocument(collection: string, query: any, update: any, options: any = {}): Promise<QueryResult> {
    const operation = JSON.stringify({
      collection,
      method: 'updateOne',
      query,
      document: update,
      options
    });

    return this.executeQuery(operation);
  }

  async deleteDocument(collection: string, query: any, options: any = {}): Promise<QueryResult> {
    const operation = JSON.stringify({
      collection,
      method: 'deleteOne',
      query,
      options
    });

    return this.executeQuery(operation);
  }

  async countDocuments(collection: string, query: any = {}, options: any = {}): Promise<number> {
    const operation = JSON.stringify({
      collection,
      method: 'countDocuments',
      query,
      options
    });

    const result = await this.executeQuery(operation);
    return result.rows?.[0] || 0;
  }

  async getCollectionStats(collectionName: string): Promise<any> {
    if (!this.db) {
      throw new Error('No database connection available');
    }

    return await this.db.collection(collectionName).stats();
  }

  async getIndexes(collectionName: string): Promise<any> {
    if (!this.db) {
      throw new Error('No database connection available');
    }

    return await this.db.collection(collectionName).indexes();
  }

  async createIndex(collectionName: string, indexSpec: any, options: any = {}): Promise<void> {
    if (!this.db) {
      throw new Error('No database connection available');
    }

    await this.db.collection(collectionName).createIndex(indexSpec, options);
  }
}