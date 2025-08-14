// Core framework exports
export { Restified, restified } from '@core/Restified';

// DSL exports
export { GivenStep } from '@core/dsl/given.core';
export { WhenStep } from '@core/dsl/when.core';
export { ThenStep } from '@core/dsl/then.core';

// Authentication providers
export { BearerAuth } from '@core/auth/bearer.auth';
export { BasicAuth } from '@core/auth/basic.auth';
export { ApiKeyAuth } from '@core/auth/apikey.auth';
export { OAuth2Auth } from '@core/auth/oauth2.auth';

// Stores
export { VariableStore } from '@core/stores/variable.core';
export { ResponseStore } from '@core/stores/response.core';

// Configuration
export { ConfigManager, configManager } from '@core/config/config.core';

// Types
export * from './RestifiedTypes';
export * from '@core/auth/AuthTypes';

// Utilities (to be implemented)
// export * from './utils';

// Default export for convenience  
export { restified as default } from '@core/Restified';