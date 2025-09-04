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

export { CircuitBreakerManager, globalCircuitBreakerManager } from './CircuitBreakerManager';
export type {
  CircuitBreakerStats,
  CircuitBreakerMetrics
} from './CircuitBreakerManager';

export { TimeoutManager, globalTimeoutManager } from './TimeoutManager';
export type {
  TimeoutStats,
  TimeoutMetrics,
  TimeoutRecommendation
} from './TimeoutManager';

export { ErrorRecoveryManager } from './ErrorRecoveryManager';
export type {
  ErrorRecoveryStats,
  ErrorRecoveryMetrics,
  FallbackResult
} from './ErrorRecoveryManager';