/**
 * Scaffold Configuration Management
 * 
 * Centralized configuration handling with validation and context generation
 */

import * as path from 'path';
import { 
  ScaffoldOptions, 
  ScaffoldContext, 
  TemplateContext, 
  ValidationResult,
  ValidationError 
} from '../types/ScaffoldTypes';

export class ScaffoldConfig {
  private context: ScaffoldContext;

  constructor(private options: ScaffoldOptions) {
    this.context = this.createContext();
  }

  /**
   * Validate the scaffold configuration
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate project name
    if (!this.options.name || this.options.name.trim() === '') {
      errors.push('Project name is required');
    } else if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(this.options.name)) {
      errors.push('Project name must start with a letter and contain only letters, numbers, hyphens, and underscores');
    }

    // Validate base URL
    if (!this.isValidUrl(this.options.url)) {
      errors.push('Invalid base URL format. Must be a valid HTTP/HTTPS URL');
    }

    // Validate test types
    const validTestTypes = ['api', 'auth', 'database', 'performance', 'security', 'graphql', 'websocket'];
    const invalidTypes = this.options.types.filter(type => !validTestTypes.includes(type));
    if (invalidTypes.length > 0) {
      errors.push(`Invalid test types: ${invalidTypes.join(', ')}. Valid types are: ${validTestTypes.join(', ')}`);
    }

    // Validate output directory
    if (this.options.output) {
      const outputPath = path.resolve(this.options.output);
      if (path.basename(outputPath) !== outputPath && !path.isAbsolute(this.options.output)) {
        warnings.push('Output path should be absolute or a simple directory name');
      }
    }

    // Check for common naming conflicts
    const reservedNames = ['test', 'tests', 'spec', 'node_modules', 'src', 'lib', 'dist'];
    if (reservedNames.includes(this.options.name.toLowerCase())) {
      warnings.push(`Project name '${this.options.name}' conflicts with common directory names`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Get the scaffold context for template rendering
   */
  getContext(): ScaffoldContext {
    return this.context;
  }

  /**
   * Get template context with additional computed properties
   */
  getTemplateContext(additionalContext?: Record<string, any>): TemplateContext {
    return {
      ...this.context,
      ...additionalContext,
      // Template helpers
      hasTestType: (type: string) => this.context.testTypes.includes(type),
      isMultiClient: this.context.testTypes.length > 1,
      needsDatabase: this.context.testTypes.includes('database'),
      needsAuth: this.context.testTypes.includes('auth'),
      needsPerformance: this.context.testTypes.includes('performance'),
      needsSecurity: this.context.testTypes.includes('security'),
    };
  }

  /**
   * Get generators needed for the selected test types
   */
  getRequiredGenerators(): string[] {
    const generators = new Set<string>([
      'config',
      'package',
      'setup',
      'documentation'
    ]);

    // Add test-specific generators
    this.options.types.forEach(type => {
      generators.add(`${type}-test`);
    });

    // Add conditional generators
    if (this.options.types.includes('database')) {
      generators.add('database-config');
    }

    if (this.options.types.includes('performance')) {
      generators.add('performance-config');
    }

    return Array.from(generators);
  }

  /**
   * Get npm dependencies based on test types
   */
  getDependencies(): { dependencies: Record<string, string>; devDependencies: Record<string, string> } {
    const baseDeps = {
      "restifiedts": "^2.0.6"
    };

    const baseDevDeps = {
      "@types/chai": "^4.3.8",
      "@types/mocha": "^10.0.10",
      "@types/node": "^20.8.0",
      "chai": "^4.3.10",
      "mocha": "^10.2.0",
      "mochawesome": "^7.1.3",
      "nyc": "^15.1.0",
      "dotenv": "^17.2.1",
      "rimraf": "^5.0.0",
      "ts-node": "^10.9.0",
      "tsconfig-paths": "^4.2.0",
      "typescript": "^5.2.0"
    };

    // Add test-type specific dependencies
    const typeSpecificDeps: Record<string, Record<string, string>> = {
      graphql: {
        "graphql": "^16.8.0",
        "@graphql-tools/schema": "^10.0.0"
      },
      websocket: {
        "ws": "^8.18.0",
        "@types/ws": "^8.5.8"
      },
      performance: {
        "k6": "^0.47.0",
        "artillery": "^2.0.0"
      },
      security: {
        "owasp-zap-api": "^0.2.0"
      }
    };

    const additionalDevDeps: Record<string, string> = {};
    
    this.options.types.forEach(type => {
      if (typeSpecificDeps[type]) {
        Object.assign(additionalDevDeps, typeSpecificDeps[type]);
      }
    });

    return {
      dependencies: baseDeps,
      devDependencies: { ...baseDevDeps, ...additionalDevDeps }
    };
  }

  /**
   * Create scaffold context from options
   */
  private createContext(): ScaffoldContext {
    const sanitizedName = this.sanitizeName(this.options.name);
    const outputDir = this.options.output || `./${sanitizedName}`;

    return {
      projectName: this.options.name,
      baseUrl: this.options.url,
      testTypes: this.options.types,
      outputDirectory: path.resolve(outputDir),
      force: this.options.force,
      complexity: this.options.complexity || 'minimal',
      timestamp: new Date().toISOString(),
      sanitizedName,
      packageName: this.createPackageName(sanitizedName),
      className: this.createClassName(sanitizedName)
    };
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Sanitize project name for file system use
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Create npm package name
   */
  private createPackageName(sanitizedName: string): string {
    return `${sanitizedName}-api-tests`;
  }

  /**
   * Create class name from project name
   */
  private createClassName(sanitizedName: string): string {
    return sanitizedName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Static factory method with validation
   */
  static create(options: ScaffoldOptions): ScaffoldConfig {
    const config = new ScaffoldConfig(options);
    const validation = config.validate();
    
    if (!validation.isValid) {
      throw new ValidationError(
        `Configuration validation failed: ${validation.errors.join(', ')}`,
        { validation, options }
      );
    }

    return config;
  }
}