import { VariableContext } from '../../RestifiedTypes';

export class VariableStore {
  private globalVariables: Record<string, any> = {};
  private localVariables: Record<string, any> = {};
  private extractedVariables: Record<string, any> = {};
  private environmentVariables: Record<string, any> = {};

  constructor() {
    this.loadEnvironmentVariables();
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
}