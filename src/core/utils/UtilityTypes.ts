export interface UtilityFunction {
  name: string;
  description: string;
  category: string;
  execute: (...args: any[]) => any;
  isAsync?: boolean;
  parameters?: UtilityParameter[];
}

export interface UtilityParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required: boolean;
  defaultValue?: any;
  description: string;
}

export interface UtilityCategory {
  name: string;
  description: string;
  functions: Map<string, UtilityFunction>;
}

export interface CustomUtilityPlugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  categories: UtilityCategory[];
  initialize?: () => void | Promise<void>;
  cleanup?: () => void | Promise<void>;
}

export interface UtilityExecutionContext {
  variableStore: any;
  currentRequest?: any;
  currentResponse?: any;
  globalConfig?: any;
}

export interface UtilityResult<T = any> {
  success: boolean;
  value?: T;
  error?: string;
  executionTime?: number;
  metadata?: Record<string, any>;
}

export interface UtilityRegistrationOptions {
  overwriteExisting?: boolean;
  validateParameters?: boolean;
  logExecution?: boolean;
}

export type UtilityResolver = (functionName: string, args: any[], context: UtilityExecutionContext) => UtilityResult;

export interface CacheableUtility {
  cacheKey?: string;
  cacheTTL?: number;
  useCache?: boolean;
}

export interface SecurityUtility {
  requiresSecureContext?: boolean;
  sensitiveOutput?: boolean;
  allowedOrigins?: string[];
}

export interface PerformanceUtility {
  maxExecutionTime?: number;
  resourceLimits?: {
    memory?: number;
    cpu?: number;
  };
}

export interface ValidationRule {
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
  options?: any;
}

export interface UtilityMetadata {
  version: string;
  lastModified: Date;
  usageCount: number;
  averageExecutionTime: number;
  tags: string[];
}