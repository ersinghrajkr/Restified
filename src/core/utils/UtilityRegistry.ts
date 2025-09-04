import {
  UtilityFunction,
  UtilityCategory,
  CustomUtilityPlugin,
  UtilityExecutionContext,
  UtilityResult,
  UtilityRegistrationOptions,
  UtilityResolver,
  UtilityMetadata
} from './UtilityTypes';

export class UtilityRegistry {
  private static instance: UtilityRegistry;
  private categories: Map<string, UtilityCategory> = new Map();
  private plugins: Map<string, CustomUtilityPlugin> = new Map();
  private customResolvers: Map<string, UtilityResolver> = new Map();
  private cache: Map<string, { value: any; timestamp: number; ttl: number }> = new Map();
  private metadata: Map<string, UtilityMetadata> = new Map();
  private executionLog: Array<{ function: string; args: any[]; result: any; timestamp: number; executionTime: number }> = [];

  private constructor() {
    this.initializeBuiltInCategories();
  }

  static getInstance(): UtilityRegistry {
    if (!UtilityRegistry.instance) {
      UtilityRegistry.instance = new UtilityRegistry();
    }
    return UtilityRegistry.instance;
  }

  private initializeBuiltInCategories(): void {
    const categories = [
      { name: 'string', description: 'String manipulation utilities' },
      { name: 'data', description: 'Data transformation utilities' },
      { name: 'crypto', description: 'Cryptographic utilities' },
      { name: 'validation', description: 'Data validation utilities' },
      { name: 'encoding', description: 'Encoding and decoding utilities' },
      { name: 'file', description: 'File system utilities' },
      { name: 'network', description: 'Network and HTTP utilities' },
      { name: 'date', description: 'Date and time utilities' },
      { name: 'math', description: 'Mathematical utilities' },
      { name: 'random', description: 'Random generation utilities' },
      { name: 'format', description: 'Data formatting utilities' },
      { name: 'security', description: 'Security and authentication utilities' }
    ];

    categories.forEach(cat => {
      this.categories.set(cat.name, {
        name: cat.name,
        description: cat.description,
        functions: new Map()
      });
    });
  }

  registerFunction(
    categoryName: string,
    functionName: string,
    func: UtilityFunction,
    options: UtilityRegistrationOptions = {}
  ): void {
    const category = this.getOrCreateCategory(categoryName);
    
    if (category.functions.has(functionName) && !options.overwriteExisting) {
      throw new Error(`Function '${functionName}' already exists in category '${categoryName}'`);
    }

    if (options.validateParameters && func.parameters) {
      this.validateFunctionParameters(func);
    }

    category.functions.set(functionName, func);
    this.updateMetadata(functionName, func);
  }

  registerCategory(categoryName: string, description: string): void {
    if (!this.categories.has(categoryName)) {
      this.categories.set(categoryName, {
        name: categoryName,
        description,
        functions: new Map()
      });
    }
  }

  registerPlugin(plugin: CustomUtilityPlugin, options: UtilityRegistrationOptions = {}): void {
    if (this.plugins.has(plugin.name) && !options.overwriteExisting) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }

    // Register plugin categories and functions
    plugin.categories.forEach(category => {
      this.registerCategory(category.name, category.description);
      category.functions.forEach((func, funcName) => {
        this.registerFunction(category.name, funcName, func, options);
      });
    });

    this.plugins.set(plugin.name, plugin);

    // Initialize plugin if it has an initialization function
    if (plugin.initialize) {
      plugin.initialize();
    }
  }

  registerCustomResolver(pattern: string, resolver: UtilityResolver): void {
    this.customResolvers.set(pattern, resolver);
  }

  execute(functionPath: string, args: any[] = [], context: UtilityExecutionContext): UtilityResult {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(functionPath, args);
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return {
          success: true,
          value: cached,
          executionTime: 0,
          metadata: { fromCache: true }
        };
      }

      // Try custom resolvers first
      for (const [pattern, resolver] of this.customResolvers.entries()) {
        if (functionPath.match(pattern)) {
          const result = resolver(functionPath, args, context);
          this.logExecution(functionPath, args, result, Date.now() - startTime);
          return result;
        }
      }

      // Parse function path (category.function)
      const [categoryName, functionName] = functionPath.split('.');
      if (!categoryName || !functionName) {
        throw new Error(`Invalid function path: ${functionPath}`);
      }

      const category = this.categories.get(categoryName);
      if (!category) {
        throw new Error(`Category '${categoryName}' not found`);
      }

      const func = category.functions.get(functionName);
      if (!func) {
        throw new Error(`Function '${functionName}' not found in category '${categoryName}'`);
      }

      // Validate parameters if defined
      if (func.parameters) {
        this.validateArguments(func, args);
      }

      // Execute function
      const result = func.isAsync 
        ? func.execute(...args)
        : func.execute(...args);

      const executionTime = Date.now() - startTime;
      this.updateExecutionMetadata(functionPath, executionTime);

      const utilityResult: UtilityResult = {
        success: true,
        value: result,
        executionTime
      };

      // Cache result if applicable
      this.cacheResult(cacheKey, result);
      this.logExecution(functionPath, args, utilityResult, executionTime);

      return utilityResult;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const utilityResult: UtilityResult = {
        success: false,
        error: error.message,
        executionTime
      };

      this.logExecution(functionPath, args, utilityResult, executionTime);
      return utilityResult;
    }
  }

  async executeAsync(functionPath: string, args: any[] = [], context: UtilityExecutionContext): Promise<UtilityResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(functionPath, args);
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return {
          success: true,
          value: cached,
          executionTime: 0,
          metadata: { fromCache: true }
        };
      }

      // Parse function path
      const [categoryName, functionName] = functionPath.split('.');
      const category = this.categories.get(categoryName);
      const func = category?.functions.get(functionName);

      if (!func) {
        throw new Error(`Function '${functionPath}' not found`);
      }

      // Validate parameters
      if (func.parameters) {
        this.validateArguments(func, args);
      }

      // Execute async function
      const result = await func.execute(...args);
      const executionTime = Date.now() - startTime;

      const utilityResult: UtilityResult = {
        success: true,
        value: result,
        executionTime
      };

      this.cacheResult(cacheKey, result);
      this.logExecution(functionPath, args, utilityResult, executionTime);

      return utilityResult;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const utilityResult: UtilityResult = {
        success: false,
        error: error.message,
        executionTime
      };

      this.logExecution(functionPath, args, utilityResult, executionTime);
      return utilityResult;
    }
  }

  getAvailableFunctions(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    this.categories.forEach((category, categoryName) => {
      result[categoryName] = Array.from(category.functions.keys());
    });
    
    return result;
  }

  getFunctionDocumentation(categoryName: string, functionName?: string): any {
    if (!functionName) {
      // Return all functions in category
      const category = this.categories.get(categoryName);
      if (!category) return null;
      
      const docs: any = {
        category: categoryName,
        description: category.description,
        functions: {}
      };
      
      category.functions.forEach((func, name) => {
        docs.functions[name] = {
          description: func.description,
          parameters: func.parameters || [],
          isAsync: func.isAsync || false
        };
      });
      
      return docs;
    }
    
    // Return specific function
    const category = this.categories.get(categoryName);
    const func = category?.functions.get(functionName);
    
    if (!func) return null;
    
    return {
      name: functionName,
      category: categoryName,
      description: func.description,
      parameters: func.parameters || [],
      isAsync: func.isAsync || false,
      metadata: this.metadata.get(functionName)
    };
  }

  listCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  unregisterFunction(categoryName: string, functionName: string): void {
    const category = this.categories.get(categoryName);
    if (category) {
      category.functions.delete(functionName);
      this.metadata.delete(functionName);
    }
  }

  unregisterPlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      // Clean up plugin functions
      plugin.categories.forEach(category => {
        category.functions.forEach((_, funcName) => {
          this.unregisterFunction(category.name, funcName);
        });
      });
      
      // Run cleanup if defined
      if (plugin.cleanup) {
        plugin.cleanup();
      }
      
      this.plugins.delete(pluginName);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getExecutionLog(): typeof this.executionLog {
    return [...this.executionLog];
  }

  clearExecutionLog(): void {
    this.executionLog = [];
  }

  getMetadata(functionName?: string): any {
    if (functionName) {
      return this.metadata.get(functionName);
    }
    return Object.fromEntries(this.metadata.entries());
  }

  private getOrCreateCategory(categoryName: string): UtilityCategory {
    if (!this.categories.has(categoryName)) {
      this.categories.set(categoryName, {
        name: categoryName,
        description: `Custom category: ${categoryName}`,
        functions: new Map()
      });
    }
    return this.categories.get(categoryName)!;
  }

  private validateFunctionParameters(func: UtilityFunction): void {
    if (!func.parameters) return;
    
    for (const param of func.parameters) {
      if (!param.name || !param.type) {
        throw new Error(`Invalid parameter definition in function '${func.name}'`);
      }
    }
  }

  private validateArguments(func: UtilityFunction, args: any[]): void {
    if (!func.parameters) return;
    
    const requiredParams = func.parameters.filter(p => p.required);
    if (args.length < requiredParams.length) {
      throw new Error(`Function '${func.name}' requires ${requiredParams.length} arguments, got ${args.length}`);
    }
    
    func.parameters.forEach((param, index) => {
      if (index < args.length) {
        const arg = args[index];
        if (param.type !== 'any' && !this.isValidType(arg, param.type)) {
          throw new Error(`Argument ${index + 1} for '${func.name}' must be of type ${param.type}`);
        }
      }
    });
  }

  private isValidType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'object': return typeof value === 'object' && value !== null;
      case 'array': return Array.isArray(value);
      case 'any': return true;
      default: return false;
    }
  }

  private generateCacheKey(functionPath: string, args: any[]): string {
    return `${functionPath}:${JSON.stringify(args)}`;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  private cacheResult(key: string, value: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  private updateMetadata(functionName: string, func: UtilityFunction): void {
    this.metadata.set(functionName, {
      version: '1.0.0',
      lastModified: new Date(),
      usageCount: 0,
      averageExecutionTime: 0,
      tags: [func.category]
    });
  }

  private updateExecutionMetadata(functionName: string, executionTime: number): void {
    const [, funcName] = functionName.split('.');
    const metadata = this.metadata.get(funcName);
    if (metadata) {
      metadata.usageCount++;
      metadata.averageExecutionTime = 
        (metadata.averageExecutionTime * (metadata.usageCount - 1) + executionTime) / metadata.usageCount;
    }
  }

  private logExecution(functionPath: string, args: any[], result: UtilityResult, executionTime: number): void {
    this.executionLog.push({
      function: functionPath,
      args,
      result,
      timestamp: Date.now(),
      executionTime
    });
    
    // Keep only last 1000 logs
    if (this.executionLog.length > 1000) {
      this.executionLog = this.executionLog.slice(-1000);
    }
  }
}