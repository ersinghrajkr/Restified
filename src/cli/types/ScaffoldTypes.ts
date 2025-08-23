/**
 * Scaffold Types and Interfaces
 * 
 * Core type definitions for the CLI scaffold system
 */

export interface ScaffoldOptions {
  name: string;
  types: string[];
  url: string;
  output?: string;
  complexity?: 'minimal' | 'standard' | 'enterprise';
  force: boolean;
}

export interface ScaffoldContext {
  projectName: string;
  baseUrl: string;
  testTypes: string[];
  outputDirectory: string;
  force: boolean;
  complexity: 'minimal' | 'standard' | 'enterprise';
  timestamp: string;
  // Computed properties
  sanitizedName: string;
  packageName: string;
  className: string;
}

export interface TemplateContext extends ScaffoldContext {
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface GenerationResult {
  success: boolean;
  filesCreated: string[];
  errors?: string[];
  warnings?: string[];
}

export interface OperationResult {
  success: boolean;
  message?: string;
  data?: any;
}

// Generator-specific interfaces
export interface GeneratorConfig {
  name: string;
  description: string;
  templates: string[];
  dependencies?: string[];
  devDependencies?: string[];
}

// File operation interfaces
export interface FileOperation {
  type: 'create' | 'update' | 'delete' | 'copy';
  source?: string;
  destination: string;
  content?: string;
  backup?: boolean;
}

// Template-related types
export type TemplateFormat = 'handlebars' | 'mustache' | 'plain';

export interface TemplateConfig {
  path: string;
  format: TemplateFormat;
  context: Record<string, any>;
  outputPath: string;
}

// Error types
export class ScaffoldError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'ScaffoldError';
  }
}

export class ValidationError extends ScaffoldError {
  constructor(message: string, context?: any) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class FileSystemError extends ScaffoldError {
  constructor(message: string, context?: any) {
    super(message, 'FILESYSTEM_ERROR', context);
    this.name = 'FileSystemError';
  }
}

export class TemplateError extends ScaffoldError {
  constructor(message: string, context?: any) {
    super(message, 'TEMPLATE_ERROR', context);
    this.name = 'TemplateError';
  }
}