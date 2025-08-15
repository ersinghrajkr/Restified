import { UtilityRegistry } from './UtilityRegistry';
import { UtilityExecutionContext, UtilityResult, CustomUtilityPlugin } from './UtilityTypes';
import { StringUtilities, DateUtilities, MathUtilities, RandomUtilities, ValidationUtilities } from './CoreUtilities';
import { DataTransformationUtilities } from './DataUtilities';
import { CryptographicUtilities, SecurityUtilities } from './SecurityUtilities';
import { FileUtilities, EncodingUtilities, NetworkUtilities } from './FileUtilities';

export class UtilityManager {
  private registry: UtilityRegistry;
  private context: UtilityExecutionContext;
  private static instance: UtilityManager;

  private constructor(context: UtilityExecutionContext) {
    this.registry = UtilityRegistry.getInstance();
    this.context = context;
    this.initializeBuiltInUtilities();
  }

  static getInstance(context?: UtilityExecutionContext): UtilityManager {
    if (!UtilityManager.instance) {
      if (!context) {
        throw new Error('UtilityManager requires context on first initialization');
      }
      UtilityManager.instance = new UtilityManager(context);
    }
    return UtilityManager.instance;
  }

  static create(context: UtilityExecutionContext): UtilityManager {
    return new UtilityManager(context);
  }

  updateContext(context: Partial<UtilityExecutionContext>): void {
    this.context = { ...this.context, ...context };
  }

  private initializeBuiltInUtilities(): void {
    // Register all built-in utility categories
    const utilityCategories = [
      { name: 'string', utilities: StringUtilities },
      { name: 'date', utilities: DateUtilities },
      { name: 'math', utilities: MathUtilities },
      { name: 'random', utilities: RandomUtilities },
      { name: 'validation', utilities: ValidationUtilities },
      { name: 'data', utilities: DataTransformationUtilities },
      { name: 'crypto', utilities: CryptographicUtilities },
      { name: 'security', utilities: SecurityUtilities },
      { name: 'file', utilities: FileUtilities },
      { name: 'encoding', utilities: EncodingUtilities },
      { name: 'network', utilities: NetworkUtilities }
    ];

    utilityCategories.forEach(({ name, utilities }) => {
      this.registry.registerCategory(name, `${name} utilities`);
      const functions = utilities.getFunctions();
      
      functions.forEach((func, funcName) => {
        this.registry.registerFunction(name, funcName, func, { overwriteExisting: true });
      });
    });
  }

  // Core execution methods
  execute(functionPath: string, ...args: any[]): UtilityResult {
    return this.registry.execute(functionPath, args, this.context);
  }

  async executeAsync(functionPath: string, ...args: any[]): Promise<UtilityResult> {
    return this.registry.executeAsync(functionPath, args, this.context);
  }

  // Convenience methods for common operations
  string(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`string.${functionName}`, ...args);
  }

  date(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`date.${functionName}`, ...args);
  }

  math(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`math.${functionName}`, ...args);
  }

  random(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`random.${functionName}`, ...args);
  }

  validation(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`validation.${functionName}`, ...args);
  }

  data(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`data.${functionName}`, ...args);
  }

  crypto(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`crypto.${functionName}`, ...args);
  }

  security(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`security.${functionName}`, ...args);
  }

  async file(functionName: string, ...args: any[]): Promise<UtilityResult> {
    return this.executeAsync(`file.${functionName}`, ...args);
  }

  encoding(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`encoding.${functionName}`, ...args);
  }

  network(functionName: string, ...args: any[]): UtilityResult {
    return this.execute(`network.${functionName}`, ...args);
  }

  // Plugin management
  registerPlugin(plugin: CustomUtilityPlugin): void {
    this.registry.registerPlugin(plugin, { overwriteExisting: true });
  }

  unregisterPlugin(pluginName: string): void {
    this.registry.unregisterPlugin(pluginName);
  }

  // Custom function registration
  registerFunction(category: string, name: string, execute: (...args: any[]) => any, options?: {
    description?: string;
    parameters?: Array<{ name: string; type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'; required: boolean; description: string }>;
    isAsync?: boolean;
  }): void {
    this.registry.registerFunction(category, name, {
      name,
      description: options?.description || `Custom function: ${name}`,
      category,
      execute,
      isAsync: options?.isAsync || false,
      parameters: options?.parameters || []
    }, { overwriteExisting: true });
  }

  // Utility information and management
  listCategories(): string[] {
    return this.registry.listCategories();
  }

  listFunctions(category?: string): Record<string, string[]> | string[] {
    const allFunctions = this.registry.getAvailableFunctions();
    
    if (category) {
      return allFunctions[category] || [];
    }
    
    return allFunctions;
  }

  getFunctionDocumentation(category: string, functionName?: string): any {
    return this.registry.getFunctionDocumentation(category, functionName);
  }

  getExecutionLog(): any[] {
    return this.registry.getExecutionLog();
  }

  clearExecutionLog(): void {
    this.registry.clearExecutionLog();
  }

  clearCache(): void {
    this.registry.clearCache();
  }

  // Batch execution methods
  executeBatch(operations: Array<{ function: string; args: any[] }>): Array<UtilityResult> {
    return operations.map(op => this.execute(op.function, ...op.args));
  }

  async executeBatchAsync(operations: Array<{ function: string; args: any[] }>): Promise<Array<UtilityResult>> {
    const promises = operations.map(op => this.executeAsync(op.function, ...op.args));
    return Promise.all(promises);
  }

  // Pipeline execution - chain multiple utilities
  executePipeline(input: any, operations: Array<{ function: string; args?: any[] }>): UtilityResult {
    let current = input;
    let lastResult: UtilityResult = { success: true, value: current };

    for (const operation of operations) {
      const args = [current, ...(operation.args || [])];
      lastResult = this.execute(operation.function, ...args);
      
      if (!lastResult.success) {
        break;
      }
      
      current = lastResult.value;
    }

    return lastResult;
  }

  async executePipelineAsync(input: any, operations: Array<{ function: string; args?: any[] }>): Promise<UtilityResult> {
    let current = input;
    let lastResult: UtilityResult = { success: true, value: current };

    for (const operation of operations) {
      const args = [current, ...(operation.args || [])];
      lastResult = await this.executeAsync(operation.function, ...args);
      
      if (!lastResult.success) {
        break;
      }
      
      current = lastResult.value;
    }

    return lastResult;
  }

  // Conditional execution
  executeIf(condition: boolean | (() => boolean), functionPath: string, ...args: any[]): UtilityResult | null {
    const shouldExecute = typeof condition === 'function' ? condition() : condition;
    
    if (shouldExecute) {
      return this.execute(functionPath, ...args);
    }
    
    return null;
  }

  // Safe execution with fallback
  executeSafe(functionPath: string, fallbackValue: any, ...args: any[]): any {
    try {
      const result = this.execute(functionPath, ...args);
      return result.success ? result.value : fallbackValue;
    } catch {
      return fallbackValue;
    }
  }

  // Helper method to create a scoped utility manager for a specific context
  createScoped(additionalContext: Partial<UtilityExecutionContext>): UtilityManager {
    const scopedContext = { ...this.context, ...additionalContext };
    return UtilityManager.create(scopedContext);
  }

  // Export utilities configuration for sharing/backup
  exportConfiguration(): any {
    return {
      categories: this.listCategories(),
      functions: this.listFunctions(),
      plugins: this.registry.listPlugins(),
      metadata: this.registry.getMetadata()
    };
  }

  // Performance monitoring
  getPerformanceMetrics(): any {
    const log = this.getExecutionLog();
    const functionCounts: Record<string, number> = {};
    const avgExecutionTimes: Record<string, number> = {};
    const totalExecutions = log.length;
    
    log.forEach(entry => {
      const func = entry.function;
      functionCounts[func] = (functionCounts[func] || 0) + 1;
      
      if (!avgExecutionTimes[func]) {
        avgExecutionTimes[func] = 0;
      }
      avgExecutionTimes[func] = (avgExecutionTimes[func] * (functionCounts[func] - 1) + entry.executionTime) / functionCounts[func];
    });

    return {
      totalExecutions,
      functionCounts,
      averageExecutionTimes: avgExecutionTimes,
      lastExecutions: log.slice(-10) // Last 10 executions
    };
  }

  // Utility health check
  healthCheck(): { status: 'healthy' | 'degraded' | 'unhealthy'; issues: string[]; metrics: any } {
    const issues: string[] = [];
    const metrics = this.getPerformanceMetrics();
    
    // Check for functions with high failure rates
    const log = this.getExecutionLog();
    const recentFailures = log.slice(-100).filter(entry => !entry.result.success);
    
    if (recentFailures.length > 10) {
      issues.push(`High failure rate: ${recentFailures.length}/100 recent executions failed`);
    }
    
    // Check for slow functions
    Object.entries(metrics.averageExecutionTimes).forEach(([func, avgTime]: [string, any]) => {
      if (avgTime > 1000) { // 1 second threshold
        issues.push(`Slow function detected: ${func} averages ${avgTime}ms`);
      }
    });
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 5 ? 'unhealthy' : 'degraded';
    }
    
    return { status, issues, metrics };
  }
}