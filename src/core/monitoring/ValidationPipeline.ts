import { EventEmitter } from 'events';

export interface ValidationConfig {
  enabled?: boolean;
  enableRequestValidation?: boolean;
  enableResponseValidation?: boolean;
  enableSecurityChecks?: boolean;
  enablePerformanceChecks?: boolean;
  failFast?: boolean;
  logValidationErrors?: boolean;
  customValidators?: CustomValidator[];
  securityRules?: SecurityRule[];
  performanceThresholds?: PerformanceThresholds;
}

export interface ValidationRule {
  id: string;
  name: string;
  type: 'request' | 'response' | 'security' | 'performance';
  enabled?: boolean;
  priority?: number;
  description?: string;
  validator: (data: any, context: ValidationContext) => ValidationResult;
}

export interface CustomValidator {
  id: string;
  name: string;
  type: 'sync' | 'async';
  validate: (data: any, context: ValidationContext) => ValidationResult | Promise<ValidationResult>;
}

export interface SecurityRule {
  id: string;
  name: string;
  pattern?: RegExp;
  blockedHeaders?: string[];
  blockedQueryParams?: string[];
  maxBodySize?: number;
  allowedMethods?: string[];
  requireAuth?: boolean;
  rateLimiting?: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface PerformanceThresholds {
  maxResponseTime?: number;
  maxPayloadSize?: number;
  maxHeaderCount?: number;
  maxHeaderSize?: number;
  maxUrlLength?: number;
}

export interface ValidationContext {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body: any;
  timestamp: Date;
  clientIp?: string;
  userAgent?: string;
  requestId: string;
}

export interface ValidationResult {
  valid: boolean;
  ruleId: string;
  ruleName: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: any;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface PipelineResult {
  valid: boolean;
  results: ValidationResult[];
  errors: ValidationResult[];
  warnings: ValidationResult[];
  executionTime: number;
  timestamp: Date;
  context: ValidationContext;
}

export interface ValidationMetrics {
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  averageExecutionTime: number;
  ruleExecutionStats: Record<string, {
    executions: number;
    failures: number;
    averageTime: number;
  }>;
  securityViolations: number;
  performanceViolations: number;
}

export class ValidationPipeline extends EventEmitter {
  private config: Required<ValidationConfig>;
  private rules: Map<string, ValidationRule> = new Map();
  private requestLimiter: Map<string, { count: number; resetTime: number }> = new Map();
  private metrics: ValidationMetrics = {
    totalValidations: 0,
    passedValidations: 0,
    failedValidations: 0,
    averageExecutionTime: 0,
    ruleExecutionStats: {},
    securityViolations: 0,
    performanceViolations: 0
  };

  constructor(config: ValidationConfig = {}) {
    super();
    
    this.config = {
      enabled: true,
      enableRequestValidation: true,
      enableResponseValidation: true,
      enableSecurityChecks: true,
      enablePerformanceChecks: true,
      failFast: false,
      logValidationErrors: true,
      customValidators: [],
      securityRules: [],
      performanceThresholds: {
        maxResponseTime: 30000,
        maxPayloadSize: 10 * 1024 * 1024,
        maxHeaderCount: 50,
        maxHeaderSize: 8192,
        maxUrlLength: 2048
      },
      ...config
    };

    this.initializeDefaultRules();
    this.initializeCustomValidators();
  }

  private initializeDefaultRules(): void {
    this.addRule({
      id: 'required_headers',
      name: 'Required Headers Validation',
      type: 'request',
      priority: 1,
      description: 'Validates presence of required headers',
      validator: (data: any, context: ValidationContext): ValidationResult => {
        const requiredHeaders = ['content-type', 'user-agent'];
        const missing: string[] = [];
        
        requiredHeaders.forEach(header => {
          if (!context.headers[header] && !context.headers[header.toLowerCase()]) {
            missing.push(header);
          }
        });
        
        return {
          valid: missing.length === 0,
          ruleId: 'required_headers',
          ruleName: 'Required Headers Validation',
          severity: missing.length > 0 ? 'warning' : 'info',
          message: missing.length > 0 
            ? `Missing required headers: ${missing.join(', ')}` 
            : 'All required headers present',
          details: { missingHeaders: missing },
          suggestions: missing.length > 0 ? [`Add missing headers: ${missing.join(', ')}`] : []
        };
      }
    });

    this.addRule({
      id: 'json_structure',
      name: 'JSON Structure Validation',
      type: 'request',
      priority: 2,
      description: 'Validates JSON structure and syntax',
      validator: (data: any, context: ValidationContext): ValidationResult => {
        const contentType = context.headers['content-type'] || context.headers['Content-Type'] || '';
        
        if (!contentType.includes('application/json')) {
          return {
            valid: true,
            ruleId: 'json_structure',
            ruleName: 'JSON Structure Validation',
            severity: 'info',
            message: 'Not a JSON request, skipping validation'
          };
        }

        try {
          if (typeof context.body === 'string') {
            JSON.parse(context.body);
          }
          return {
            valid: true,
            ruleId: 'json_structure',
            ruleName: 'JSON Structure Validation',
            severity: 'info',
            message: 'Valid JSON structure'
          };
        } catch (error: any) {
          return {
            valid: false,
            ruleId: 'json_structure',
            ruleName: 'JSON Structure Validation',
            severity: 'error',
            message: `Invalid JSON structure: ${error.message}`,
            suggestions: ['Ensure request body contains valid JSON']
          };
        }
      }
    });

    this.addRule({
      id: 'payload_size',
      name: 'Payload Size Validation',
      type: 'performance',
      priority: 1,
      description: 'Validates request payload size limits',
      validator: (data: any, context: ValidationContext): ValidationResult => {
        const maxSize = this.config.performanceThresholds.maxPayloadSize!;
        let bodySize = 0;
        
        if (context.body) {
          bodySize = typeof context.body === 'string' 
            ? Buffer.byteLength(context.body, 'utf8')
            : JSON.stringify(context.body).length;
        }
        
        const valid = bodySize <= maxSize;
        
        return {
          valid,
          ruleId: 'payload_size',
          ruleName: 'Payload Size Validation',
          severity: valid ? 'info' : 'warning',
          message: valid 
            ? `Payload size acceptable: ${bodySize} bytes`
            : `Payload size exceeds limit: ${bodySize} bytes > ${maxSize} bytes`,
          details: { payloadSize: bodySize, maxSize },
          suggestions: valid ? [] : [`Reduce payload size to under ${maxSize} bytes`]
        };
      }
    });

    this.addRule({
      id: 'security_headers',
      name: 'Security Headers Check',
      type: 'security',
      priority: 1,
      description: 'Validates security-related headers',
      validator: (data: any, context: ValidationContext): ValidationResult => {
        const securityHeaders = ['authorization', 'x-api-key', 'x-csrf-token'];
        const warnings: string[] = [];
        const found: string[] = [];
        
        securityHeaders.forEach(header => {
          const headerValue = context.headers[header] || context.headers[header.toLowerCase()];
          if (headerValue) {
            found.push(header);
            
            if (header === 'authorization' && !headerValue.startsWith('Bearer ') && !headerValue.startsWith('Basic ')) {
              warnings.push(`Authorization header format may be incorrect: ${header}`);
            }
          }
        });
        
        return {
          valid: warnings.length === 0,
          ruleId: 'security_headers',
          ruleName: 'Security Headers Check',
          severity: warnings.length > 0 ? 'warning' : 'info',
          message: warnings.length > 0 
            ? `Security header issues found: ${warnings.join(', ')}` 
            : `Security headers present: ${found.join(', ')}`,
          details: { foundHeaders: found, warnings },
          suggestions: warnings.length > 0 ? ['Review security header formats'] : []
        };
      }
    });

    this.addRule({
      id: 'url_length',
      name: 'URL Length Validation',
      type: 'performance',
      priority: 2,
      description: 'Validates URL length limits',
      validator: (data: any, context: ValidationContext): ValidationResult => {
        const maxLength = this.config.performanceThresholds.maxUrlLength!;
        const urlLength = context.endpoint.length;
        const valid = urlLength <= maxLength;
        
        return {
          valid,
          ruleId: 'url_length',
          ruleName: 'URL Length Validation',
          severity: valid ? 'info' : 'warning',
          message: valid 
            ? `URL length acceptable: ${urlLength} characters`
            : `URL length exceeds limit: ${urlLength} > ${maxLength} characters`,
          details: { urlLength, maxLength },
          suggestions: valid ? [] : ['Consider shortening the URL or using POST with body parameters']
        };
      }
    });

    this.addRule({
      id: 'response_structure',
      name: 'Response Structure Validation',
      type: 'response',
      priority: 1,
      description: 'Validates response structure and content',
      validator: (data: any, context: ValidationContext): ValidationResult => {
        if (!data || typeof data !== 'object') {
          return {
            valid: false,
            ruleId: 'response_structure',
            ruleName: 'Response Structure Validation',
            severity: 'error',
            message: 'Response is not a valid object',
            suggestions: ['Ensure API returns structured data']
          };
        }
        
        const hasErrorField = 'error' in data;
        const hasDataField = 'data' in data || 'result' in data || 'results' in data;
        
        return {
          valid: true,
          ruleId: 'response_structure',
          ruleName: 'Response Structure Validation',
          severity: 'info',
          message: `Response structure validated - Error field: ${hasErrorField}, Data field: ${hasDataField}`,
          details: { hasErrorField, hasDataField }
        };
      }
    });

    if (this.config.enableSecurityChecks) {
      this.initializeSecurityRules();
    }
  }

  private initializeSecurityRules(): void {
    this.config.securityRules.forEach(rule => {
      this.addRule({
        id: `security_${rule.id}`,
        name: `Security Rule: ${rule.name}`,
        type: 'security',
        priority: 1,
        description: `Custom security rule: ${rule.name}`,
        validator: (data: any, context: ValidationContext): ValidationResult => {
          return this.validateSecurityRule(rule, context);
        }
      });
    });
  }

  private validateSecurityRule(rule: SecurityRule, context: ValidationContext): ValidationResult {
    const violations: string[] = [];
    
    if (rule.pattern && !rule.pattern.test(context.endpoint)) {
      violations.push(`Endpoint does not match required pattern: ${rule.pattern}`);
    }
    
    if (rule.blockedHeaders) {
      const blockedFound = rule.blockedHeaders.filter(header => 
        context.headers[header] || context.headers[header.toLowerCase()]
      );
      if (blockedFound.length > 0) {
        violations.push(`Blocked headers found: ${blockedFound.join(', ')}`);
      }
    }
    
    if (rule.allowedMethods && !rule.allowedMethods.includes(context.method)) {
      violations.push(`Method ${context.method} not allowed. Allowed: ${rule.allowedMethods.join(', ')}`);
    }
    
    if (rule.requireAuth) {
      const hasAuth = context.headers['authorization'] || context.headers['x-api-key'];
      if (!hasAuth) {
        violations.push('Authentication required but not provided');
      }
    }
    
    if (rule.rateLimiting && context.clientIp) {
      const rateLimitViolation = this.checkRateLimit(rule, context.clientIp);
      if (rateLimitViolation) {
        violations.push(rateLimitViolation);
      }
    }
    
    return {
      valid: violations.length === 0,
      ruleId: `security_${rule.id}`,
      ruleName: `Security Rule: ${rule.name}`,
      severity: violations.length > 0 ? 'critical' : 'info',
      message: violations.length > 0 
        ? `Security violations: ${violations.join('; ')}` 
        : 'Security rule passed',
      details: { violations },
      suggestions: violations.length > 0 ? ['Review security requirements'] : []
    };
  }

  private checkRateLimit(rule: SecurityRule, clientIp: string): string | null {
    if (!rule.rateLimiting) return null;
    
    const key = `${rule.id}_${clientIp}`;
    const now = Date.now();
    const limiter = this.requestLimiter.get(key);
    
    if (!limiter || now > limiter.resetTime) {
      this.requestLimiter.set(key, {
        count: 1,
        resetTime: now + rule.rateLimiting.windowMs
      });
      return null;
    }
    
    limiter.count++;
    
    if (limiter.count > rule.rateLimiting.maxRequests) {
      return `Rate limit exceeded: ${limiter.count} > ${rule.rateLimiting.maxRequests} requests`;
    }
    
    return null;
  }

  private initializeCustomValidators(): void {
    this.config.customValidators.forEach(validator => {
      this.addRule({
        id: `custom_${validator.id}`,
        name: `Custom Validator: ${validator.name}`,
        type: 'request',
        priority: 5,
        description: `Custom validation: ${validator.name}`,
        validator: (data: any, context: ValidationContext): ValidationResult => {
          if (validator.type === 'async') {
            throw new Error('Async validators not supported in sync pipeline');
          }
          return validator.validate(data, context) as ValidationResult;
        }
      });
    });
  }

  public addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
    
    if (!this.metrics.ruleExecutionStats[rule.id]) {
      this.metrics.ruleExecutionStats[rule.id] = {
        executions: 0,
        failures: 0,
        averageTime: 0
      };
    }
  }

  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    delete this.metrics.ruleExecutionStats[ruleId];
  }

  public enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  public disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  public async validateRequest(context: ValidationContext): Promise<PipelineResult> {
    if (!this.config.enabled || !this.config.enableRequestValidation) {
      return this.createSkippedResult(context, 'Request validation disabled');
    }

    return this.executeValidation(context, ['request', 'security', 'performance']);
  }

  public async validateResponse(data: any, context: ValidationContext): Promise<PipelineResult> {
    if (!this.config.enabled || !this.config.enableResponseValidation) {
      return this.createSkippedResult(context, 'Response validation disabled');
    }

    return this.executeValidation({ ...context, body: data }, ['response']);
  }

  private createSkippedResult(context: ValidationContext, reason: string): PipelineResult {
    return {
      valid: true,
      results: [{
        valid: true,
        ruleId: 'skipped',
        ruleName: 'Validation Skipped',
        severity: 'info',
        message: reason
      }],
      errors: [],
      warnings: [],
      executionTime: 0,
      timestamp: new Date(),
      context
    };
  }

  private async executeValidation(context: ValidationContext, types: string[]): Promise<PipelineResult> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];
    const errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];

    this.metrics.totalValidations++;

    const applicableRules = Array.from(this.rules.values())
      .filter(rule => 
        rule.enabled !== false && 
        types.includes(rule.type)
      )
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (const rule of applicableRules) {
      const ruleStartTime = Date.now();
      
      try {
        const result = rule.validator(context.body, context);
        results.push(result);
        
        if (!result.valid) {
          if (result.severity === 'error' || result.severity === 'critical') {
            errors.push(result);
          } else if (result.severity === 'warning') {
            warnings.push(result);
          }
          
          this.metrics.ruleExecutionStats[rule.id].failures++;
          
          if (rule.type === 'security') {
            this.metrics.securityViolations++;
          } else if (rule.type === 'performance') {
            this.metrics.performanceViolations++;
          }
        }
        
        const ruleExecutionTime = Date.now() - ruleStartTime;
        this.updateRuleStats(rule.id, ruleExecutionTime);
        
        if (this.config.failFast && errors.length > 0) {
          break;
        }
        
      } catch (error: any) {
        const errorResult: ValidationResult = {
          valid: false,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: 'error',
          message: `Validation rule error: ${error.message}`,
          details: { error: error.message }
        };
        
        results.push(errorResult);
        errors.push(errorResult);
        this.metrics.ruleExecutionStats[rule.id].failures++;
        
        if (this.config.logValidationErrors) {
          console.error(`Validation rule ${rule.id} failed:`, error);
        }
      }
    }

    const executionTime = Date.now() - startTime;
    const isValid = errors.length === 0;
    
    if (isValid) {
      this.metrics.passedValidations++;
    } else {
      this.metrics.failedValidations++;
    }
    
    this.updateAverageExecutionTime(executionTime);

    const pipelineResult: PipelineResult = {
      valid: isValid,
      results,
      errors,
      warnings,
      executionTime,
      timestamp: new Date(),
      context
    };

    this.emit('validationCompleted', pipelineResult);
    
    if (!isValid) {
      this.emit('validationFailed', pipelineResult);
    }

    return pipelineResult;
  }

  private updateRuleStats(ruleId: string, executionTime: number): void {
    const stats = this.metrics.ruleExecutionStats[ruleId];
    stats.executions++;
    
    const totalTime = stats.averageTime * (stats.executions - 1) + executionTime;
    stats.averageTime = Math.round(totalTime / stats.executions);
  }

  private updateAverageExecutionTime(executionTime: number): void {
    const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalValidations - 1) + executionTime;
    this.metrics.averageExecutionTime = Math.round(totalTime / this.metrics.totalValidations);
  }

  public getMetrics(): ValidationMetrics {
    return { ...this.metrics };
  }

  public getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  public getRule(ruleId: string): ValidationRule | undefined {
    return this.rules.get(ruleId);
  }

  public clearMetrics(): void {
    this.metrics = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      averageExecutionTime: 0,
      ruleExecutionStats: {},
      securityViolations: 0,
      performanceViolations: 0
    };

    this.rules.forEach(rule => {
      this.metrics.ruleExecutionStats[rule.id] = {
        executions: 0,
        failures: 0,
        averageTime: 0
      };
    });
  }

  public exportReport(): {
    configuration: ValidationConfig;
    metrics: ValidationMetrics;
    rules: ValidationRule[];
    summary: {
      totalRules: number;
      enabledRules: number;
      validationSuccessRate: number;
      averageExecutionTime: number;
      topFailingRules: Array<{ ruleId: string; ruleName: string; failureRate: number }>;
      recommendations: string[];
    };
  } {
    const enabledRules = Array.from(this.rules.values()).filter(rule => rule.enabled !== false);
    const topFailingRules = Object.entries(this.metrics.ruleExecutionStats)
      .map(([ruleId, stats]) => ({
        ruleId,
        ruleName: this.rules.get(ruleId)?.name || 'Unknown',
        failureRate: stats.executions > 0 ? stats.failures / stats.executions : 0
      }))
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 5);

    const recommendations: string[] = [];
    
    if (this.metrics.averageExecutionTime > 100) {
      recommendations.push('High validation execution time - consider optimizing or reducing validation rules');
    }
    
    if (this.metrics.securityViolations > 0) {
      recommendations.push('Security violations detected - review security rules and client behavior');
    }
    
    if (this.metrics.failedValidations / this.metrics.totalValidations > 0.1) {
      recommendations.push('High validation failure rate - review validation rules or client requests');
    }
    
    topFailingRules.forEach(rule => {
      if (rule.failureRate > 0.5) {
        recommendations.push(`Rule "${rule.ruleName}" has high failure rate (${(rule.failureRate * 100).toFixed(1)}%) - review rule logic`);
      }
    });

    return {
      configuration: this.config,
      metrics: this.metrics,
      rules: Array.from(this.rules.values()),
      summary: {
        totalRules: this.rules.size,
        enabledRules: enabledRules.length,
        validationSuccessRate: this.metrics.totalValidations > 0 
          ? this.metrics.passedValidations / this.metrics.totalValidations 
          : 0,
        averageExecutionTime: this.metrics.averageExecutionTime,
        topFailingRules,
        recommendations
      }
    };
  }

  public updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.customValidators) {
      this.initializeCustomValidators();
    }
    
    if (newConfig.securityRules) {
      this.initializeSecurityRules();
    }
  }

  public static create(config?: ValidationConfig): ValidationPipeline {
    return new ValidationPipeline(config);
  }
}

export const globalValidationPipeline = ValidationPipeline.create();