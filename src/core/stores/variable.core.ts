import { VariableContext } from '../../RestifiedTypes';
import { UtilityManager } from '../utils/UtilityManager';

export class VariableStore {
  private globalVariables: Record<string, any> = {};
  private localVariables: Record<string, any> = {};
  private extractedVariables: Record<string, any> = {};
  private environmentVariables: Record<string, any> = {};
  private utilityManager?: UtilityManager;

  constructor() {
    this.loadEnvironmentVariables();
  }

  setUtilityManager(utilityManager: UtilityManager): void {
    this.utilityManager = utilityManager;
  }

  setGlobalVariable(name: string, value: any): void {
    this.globalVariables[name] = value;
  }

  getGlobalVariable(name: string): any {
    return this.globalVariables[name];
  }

  setGlobalVariables(variables: Record<string, any>): void {
    this.globalVariables = { ...this.globalVariables, ...variables };
  }

  getGlobalVariables(): Record<string, any> {
    return { ...this.globalVariables };
  }

  setLocalVariable(name: string, value: any): void {
    this.localVariables[name] = value;
  }

  getLocalVariable(name: string): any {
    return this.localVariables[name];
  }

  setLocalVariables(variables: Record<string, any>): void {
    this.localVariables = { ...this.localVariables, ...variables };
  }

  getLocalVariables(): Record<string, any> {
    return { ...this.localVariables };
  }

  clearLocalVariables(): void {
    this.localVariables = {};
  }

  setExtractedVariable(name: string, value: any): void {
    this.extractedVariables[name] = value;
  }

  getExtractedVariable(name: string): any {
    return this.extractedVariables[name];
  }

  getExtractedVariables(): Record<string, any> {
    return { ...this.extractedVariables };
  }

  clearExtractedVariables(): void {
    this.extractedVariables = {};
  }

  getVariable(name: string): any {
    // Priority: Local > Extracted > Global > Environment
    if (this.localVariables.hasOwnProperty(name)) {
      return this.localVariables[name];
    }
    
    if (this.extractedVariables.hasOwnProperty(name)) {
      return this.extractedVariables[name];
    }
    
    if (this.globalVariables.hasOwnProperty(name)) {
      return this.globalVariables[name];
    }
    
    if (this.environmentVariables.hasOwnProperty(name)) {
      return this.environmentVariables[name];
    }
    
    return undefined;
  }

  hasVariable(name: string): boolean {
    return this.getVariable(name) !== undefined;
  }

  getAllVariables(): VariableContext {
    return {
      global: this.getGlobalVariables(),
      local: this.getLocalVariables(),
      environment: this.getEnvironmentVariables(),
      extracted: this.getExtractedVariables()
    };
  }

  getEnvironmentVariables(): Record<string, any> {
    return { ...this.environmentVariables };
  }

  private loadEnvironmentVariables(): void {
    this.environmentVariables = { ...process.env };
  }

  reloadEnvironmentVariables(): void {
    this.loadEnvironmentVariables();
  }

  dumpVariables(): void {
    console.log('=== Variable Store Dump ===');
    console.log('Global Variables:', this.globalVariables);
    console.log('Local Variables:', this.localVariables);
    console.log('Extracted Variables:', this.extractedVariables);
    console.log('Environment Variables:', Object.keys(this.environmentVariables).length, 'variables');
    console.log('===========================');
  }

  exportVariables(): VariableContext {
    return this.getAllVariables();
  }

  importVariables(context: Partial<VariableContext>): void {
    if (context.global) {
      this.setGlobalVariables(context.global);
    }
    
    if (context.local) {
      this.setLocalVariables(context.local);
    }
    
    if (context.extracted) {
      Object.entries(context.extracted).forEach(([key, value]) => {
        this.setExtractedVariable(key, value);
      });
    }
    
    // Environment variables are not imported as they come from the system
  }

  reset(): void {
    this.globalVariables = {};
    this.localVariables = {};
    this.extractedVariables = {};
    this.loadEnvironmentVariables();
  }

  resetLocal(): void {
    this.localVariables = {};
  }

  resetExtracted(): void {
    this.extractedVariables = {};
  }

  /**
   * Resolve variables in any data type (string, object, array, etc.)
   * Supports {{variableName}} syntax and built-in functions
   * Handles deep object and array traversal for complete fixture resolution
   */
  resolveVariables(data: any): any {
    if (typeof data === 'string') {
      return this.resolveStringTemplate(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.resolveVariables(item));
    }
    
    if (data && typeof data === 'object' && data.constructor === Object) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Resolve both key and value
        const resolvedKey = this.resolveVariables(key);
        resolved[resolvedKey] = this.resolveVariables(value);
      }
      return resolved;
    }
    
    // Return primitive values as-is
    return data;
  }

  /**
   * Resolve variables in a string template
   * Supports {{variableName}} syntax and built-in functions
   */
  private resolveStringTemplate(template: string): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();

      // Handle built-in functions
      if (trimmedName.startsWith('$faker.')) {
        return this.resolveFakerFunction(trimmedName);
      }
      
      if (trimmedName.startsWith('$random.')) {
        return this.resolveRandomFunction(trimmedName);
      }
      
      if (trimmedName.startsWith('$date.')) {
        return this.resolveDateFunction(trimmedName);
      }
      
      if (trimmedName.startsWith('$math.')) {
        return this.resolveMathFunction(trimmedName);
      }
      
      if (trimmedName.startsWith('$env.')) {
        const envVar = trimmedName.substring(5);
        return process.env[envVar] || '';
      }

      if (trimmedName.startsWith('$util.')) {
        return this.resolveUtilFunction(trimmedName);
      }

      // Regular variable lookup (global, local, extracted)
      const value = this.getVariable(trimmedName);
      return value !== undefined ? String(value) : match;
    });
  }

  private resolveFakerFunction(func: string): string {
    try {
      // Dynamic import faker if available
      const faker = require('faker');
      const path = func.substring(7); // Remove '$faker.'
      const parts = path.split('.');
      
      let current = faker;
      for (const part of parts) {
        current = current[part];
        if (!current) break;
      }
      
      return typeof current === 'function' ? current() : String(current || '');
    } catch {
      return '';
    }
  }

  private resolveRandomFunction(func: string): string {
    const funcName = func.substring(8); // Remove '$random.'
    
    switch (funcName) {
      case 'uuid':
        return this.generateUUID();
      case 'number':
        return String(Math.floor(Math.random() * 1000));
      case 'string':
        return Math.random().toString(36).substring(2, 15);
      default:
        if (funcName.startsWith('number(') && funcName.endsWith(')')) {
          const args = funcName.substring(7, funcName.length - 1).split(',');
          const min = parseInt(args[0]) || 0;
          const max = parseInt(args[1]) || 100;
          return String(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return '';
    }
  }

  private resolveDateFunction(func: string): string {
    const funcName = func.substring(6); // Remove '$date.'
    
    switch (funcName) {
      case 'now':
        return new Date().toISOString();
      case 'timestamp':
        return String(Date.now());
      case 'today':
        return new Date().toISOString().split('T')[0];
      default:
        return '';
    }
  }

  private resolveMathFunction(func: string): string {
    const funcName = func.substring(6); // Remove '$math.'
    
    if (funcName.startsWith('random(') && funcName.endsWith(')')) {
      const args = funcName.substring(7, funcName.length - 1).split(',');
      const min = parseFloat(args[0]) || 0;
      const max = parseFloat(args[1]) || 1;
      return String(Math.random() * (max - min) + min);
    }
    
    return '';
  }

  private resolveUtilFunction(func: string): string {
    const funcName = func.substring(6); // Remove '$util.'
    
    // Try utility manager first if available
    if (this.utilityManager) {
      try {
        // Parse function call with parameters
        if (funcName.includes('(') && funcName.endsWith(')')) {
          const [name, paramsStr] = funcName.split('(');
          const params = paramsStr.slice(0, -1).split(',').map(p => p.trim().replace(/['"]/g, ''));
          
          // Try different categories
          const categories = ['string', 'date', 'math', 'random', 'crypto', 'encoding', 'data'];
          for (const category of categories) {
            try {
              const result = this.utilityManager.execute(`${category}.${name}`, ...params);
              if (result.success) {
                return String(result.value);
              }
            } catch {
              // Continue to next category
            }
          }
        } else {
          // Simple function without parameters
          const categories = ['string', 'date', 'math', 'random', 'crypto', 'encoding', 'data'];
          for (const category of categories) {
            try {
              const result = this.utilityManager.execute(`${category}.${funcName}`);
              if (result.success) {
                return String(result.value);
              }
            } catch {
              // Continue to next category
            }
          }
        }
      } catch {
        // Fall back to built-in functions
      }
    }
    
    // Built-in utility functions for backward compatibility
    switch (funcName) {
      case 'base64encode':
        return Buffer.from(String(Math.random())).toString('base64');
      case 'timestamp':
        return String(Date.now());
      case 'isodate':
        return new Date().toISOString();
      case 'guid':
        return this.generateUUID();
      case 'jsonstring':
        return JSON.stringify({ id: this.generateUUID(), timestamp: Date.now() });
      default:
        if (funcName.startsWith('base64encode(') && funcName.endsWith(')')) {
          const content = funcName.substring(13, funcName.length - 1);
          return Buffer.from(content).toString('base64');
        }
        return '';
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Load JSON fixture and resolve all variables
   * Supports loading from file system and resolving nested variables
   */
  loadJsonFixture(fixturePath: string): any {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Resolve relative paths
      const fullPath = path.isAbsolute(fixturePath) 
        ? fixturePath 
        : path.resolve(process.cwd(), fixturePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Fixture file not found: ${fixturePath}`);
      }
      
      const rawContent = fs.readFileSync(fullPath, 'utf8');
      const jsonContent = JSON.parse(rawContent);
      
      // Resolve all variables in the loaded JSON
      return this.resolveVariables(jsonContent);
    } catch (error: any) {
      throw new Error(`Failed to load JSON fixture: ${error.message}`);
    }
  }

  /**
   * Resolve variables in a JSON string and return parsed object
   */
  resolveJsonString(jsonString: string): any {
    try {
      // First resolve variables in the JSON string
      const resolvedString = this.resolveStringTemplate(jsonString);
      const parsedJson = JSON.parse(resolvedString);
      
      // Then resolve any remaining variables in the parsed object
      return this.resolveVariables(parsedJson);
    } catch (error: any) {
      throw new Error(`Failed to resolve JSON string: ${error.message}`);
    }
  }
}