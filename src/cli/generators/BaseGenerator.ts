/**
 * Base Generator Abstract Class
 * 
 * Foundation for all code generators with common functionality
 */

import * as path from 'path';
import { 
  ScaffoldContext, 
  GenerationResult, 
  ValidationResult,
  FileOperation,
  TemplateConfig,
  GeneratorConfig
} from '../types/ScaffoldTypes';
import { TemplateEngine } from '../core/TemplateEngine';
import { FileSystemManager } from '../core/FileSystemManager';

export abstract class BaseGenerator {
  protected templateEngine: TemplateEngine;
  protected fileManager: FileSystemManager;
  protected context: ScaffoldContext;

  constructor(
    context: ScaffoldContext,
    templateEngine: TemplateEngine,
    fileManager: FileSystemManager
  ) {
    this.context = context;
    this.templateEngine = templateEngine;
    this.fileManager = fileManager;
  }

  /**
   * Generate files for this generator
   */
  abstract generate(): Promise<GenerationResult>;

  /**
   * Validate generator prerequisites
   */
  abstract validate(): Promise<ValidationResult>;

  /**
   * Get generator configuration
   */
  abstract getConfig(): GeneratorConfig;

  /**
   * Rollback operations performed by this generator
   */
  async rollback(): Promise<void> {
    // Default implementation - override if custom rollback needed
    console.log(`Rolling back ${this.constructor.name}...`);
  }

  /**
   * Protected helper methods for common operations
   */

  /**
   * Render a template and queue file creation
   */
  protected async renderAndQueue(
    templatePath: string,
    outputPath: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    const templateContext = {
      ...this.context,
      ...additionalContext
    };

    const content = await this.templateEngine.renderTemplate(templatePath, templateContext);
    
    this.fileManager.queueOperation({
      type: 'create',
      destination: outputPath,
      content,
      backup: this.context.force
    });
  }

  /**
   * Queue multiple template renderings
   */
  protected async renderAndQueueMultiple(configs: TemplateConfig[]): Promise<void> {
    for (const config of configs) {
      await this.renderAndQueue(config.path, config.outputPath, config.context);
    }
  }

  /**
   * Create a directory operation
   */
  protected queueDirectoryCreation(dirPath: string): void {
    // Directory creation is handled automatically by FileSystemManager
    // This is here for explicit directory creation if needed
  }

  /**
   * Queue file copy operation
   */
  protected queueFileCopy(sourcePath: string, destPath: string): void {
    this.fileManager.queueOperation({
      type: 'copy',
      source: sourcePath,
      destination: destPath,
      backup: this.context.force
    });
  }

  /**
   * Get output path relative to project root
   */
  protected getOutputPath(...pathSegments: string[]): string {
    return path.join(this.context.outputDirectory, ...pathSegments);
  }

  /**
   * Get template path
   */
  protected getTemplatePath(category: string, templateName: string): string {
    return path.join(category, templateName);
  }

  /**
   * Check if a test type is included
   */
  protected hasTestType(testType: string): boolean {
    return this.context.testTypes.includes(testType);
  }

  /**
   * Get test types as a set for easier checking
   */
  protected getTestTypesSet(): Set<string> {
    return new Set(this.context.testTypes);
  }

  /**
   * Log generator progress
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = `[${this.constructor.name}]`;
    
    switch (level) {
      case 'warn':
        console.warn(`⚠️  ${prefix} ${message}`);
        break;
      case 'error':
        console.error(`❌ ${prefix} ${message}`);
        break;
      default:
        console.log(`ℹ️  ${prefix} ${message}`);
    }
  }

  /**
   * Create a successful generation result
   */
  protected createSuccessResult(filesCreated: string[], message?: string): GenerationResult {
    return {
      success: true,
      filesCreated,
      warnings: message ? [message] : undefined
    };
  }

  /**
   * Create a failed generation result
   */
  protected createFailureResult(errors: string[], filesCreated: string[] = []): GenerationResult {
    return {
      success: false,
      filesCreated,
      errors
    };
  }

  /**
   * Create a validation result
   */
  protected createValidationResult(
    isValid: boolean, 
    errors: string[] = [], 
    warnings: string[] = []
  ): ValidationResult {
    return {
      isValid,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate that required templates exist
   */
  protected async validateTemplates(templatePaths: string[]): Promise<ValidationResult> {
    const errors: string[] = [];
    
    for (const templatePath of templatePaths) {
      const validation = this.templateEngine.validateTemplate(templatePath);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    return this.createValidationResult(errors.length === 0, errors);
  }

  /**
   * Get common template context with generator-specific data
   */
  protected getTemplateContext(additionalContext?: Record<string, any>): Record<string, any> {
    return {
      ...this.context,
      // Generator-specific helpers
      generatorName: this.constructor.name,
      generatedAt: new Date().toISOString(),
      // Custom context
      ...additionalContext
    };
  }

  /**
   * Execute validation and generation in sequence
   */
  async execute(): Promise<GenerationResult> {
    try {
      // Validate first
      const validation = await this.validate();
      if (!validation.isValid) {
        return this.createFailureResult(validation.errors);
      }

      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach(warning => this.log(warning, 'warn'));
      }

      // Generate
      return await this.generate();
    } catch (error) {
      const message = `Generation failed: ${(error as Error).message}`;
      this.log(message, 'error');
      return this.createFailureResult([message]);
    }
  }
}