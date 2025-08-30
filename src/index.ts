// Core framework exports
export { Restified, restified } from './core/Restified';

// DSL exports
export { GivenStep } from './core/dsl/given.core';
export { WhenStep } from './core/dsl/when.core';
export { ThenStep } from './core/dsl/then.core';

// Authentication providers
export { BearerAuth } from './core/auth/bearer.auth';
export { BasicAuth } from './core/auth/basic.auth';
export { ApiKeyAuth } from './core/auth/apikey.auth';
export { OAuth2Auth } from './core/auth/oauth2.auth';

// Stores
export { VariableStore } from './core/stores/variable.core';
export { ResponseStore } from './core/stores/response.core';

// Configuration
export { ConfigManager, configManager } from './core/config/config.core';

// Client types
export { GraphQLClient } from './core/clients/GraphQLClient';
export { WebSocketClient } from './core/clients/WebSocketClient';
export { DatabaseManager } from './core/database/DatabaseManager';

// Network and performance
export { ConnectionManager, globalConnectionManager } from './core/network/ConnectionManager';
export type { ConnectionPoolConfig, ConnectionStats } from './core/network/ConnectionManager';
export { RetryManager, globalRetryManager } from './core/network/RetryManager';
export type { RetryConfig, RetryStats } from './core/network/RetryManager';
export { DatabaseClient } from './core/database/DatabaseClient';
export { PostgreSQLClient } from './core/database/PostgreSQLClient';
export { MongoDBClient } from './core/database/MongoDBClient';

// Utility system exports
export { UtilityManager } from './core/utils/UtilityManager';
export { UtilityRegistry } from './core/utils/UtilityRegistry';
export { StringUtilities, DateUtilities, MathUtilities, RandomUtilities, ValidationUtilities } from './core/utils/CoreUtilities';
export { DataTransformationUtilities } from './core/utils/DataUtilities';
export { CryptographicUtilities, SecurityUtilities } from './core/utils/SecurityUtilities';
export { FileUtilities, EncodingUtilities, NetworkUtilities } from './core/utils/FileUtilities';
export { UtilityUsageExamples, ExampleCustomPlugin, quickStartExample } from './core/utils/UtilityExamples';

// Reporting
export import RestifiedHtmlReporter = require('./reporting/restified-html-reporter');

// Types
export * from './RestifiedTypes';
export * from './core/auth/AuthTypes';
export * from './core/utils/UtilityTypes';

// Default export for convenience  
export { restified as default } from './core/Restified';