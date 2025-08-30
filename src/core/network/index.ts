/**
 * Network module exports for RestifiedTS
 */

export { ConnectionManager, globalConnectionManager } from './ConnectionManager';
export type { 
  ConnectionPoolConfig, 
  ConnectionStats 
} from './ConnectionManager';

export { RetryManager, globalRetryManager } from './RetryManager';
export type {
  RetryConfig,
  RetryStats,
  RetryAttempt
} from './RetryManager';