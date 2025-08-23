/**
 * Configuration Generator
 * 
 * Generates configuration files including restified.config.ts, tsconfig.json, .env.example
 */

import { BaseGenerator } from './BaseGenerator';
import { 
  GenerationResult, 
  ValidationResult,
  GeneratorConfig
} from '../types/ScaffoldTypes';

export class ConfigGenerator extends BaseGenerator {
  /**
   * Generate configuration files
   */
  async generate(): Promise<GenerationResult> {
    const filesCreated: string[] = [];

    try {
      // Generate restified.config.ts based on complexity
      const configTemplate = this.getConfigTemplate();
      await this.renderAndQueue(
        this.getTemplatePath('config', configTemplate),
        'restified.config.ts'
      );
      filesCreated.push('restified.config.ts');

      // Generate tsconfig.json
      await this.renderAndQueue(
        this.getTemplatePath('config', 'tsconfig.json.fixed.hbs'),
        'tsconfig.json'
      );
      filesCreated.push('tsconfig.json');

      // Generate .env.example based on complexity
      const envTemplate = this.getEnvTemplate();
      await this.renderAndQueue(
        this.getTemplatePath('config', envTemplate),
        '.env.example'
      );
      filesCreated.push('.env.example');

      // Generate mocha reporter wrapper
      await this.renderAndQueue(
        this.getTemplatePath('config', 'mocha-reporter-wrapper.js.hbs'),
        'mocha-reporter-wrapper.js'
      );
      filesCreated.push('mocha-reporter-wrapper.js');

      this.log(`Generated ${filesCreated.length} configuration files`);
      
      return this.createSuccessResult(filesCreated);
    } catch (error) {
      const message = `Failed to generate configuration files: ${(error as Error).message}`;
      this.log(message, 'error');
      return this.createFailureResult([message], filesCreated);
    }
  }

  /**
   * Validate configuration generation prerequisites
   */
  async validate(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required templates exist
    const requiredTemplates = [
      'config/restified.config.hbs',
      'config/tsconfig.json.hbs',
      'config/.env.example.hbs',
      'config/mocha-reporter-wrapper.js.hbs'
    ];

    const templateValidation = await this.validateTemplates(requiredTemplates);
    if (!templateValidation.isValid) {
      errors.push(...templateValidation.errors);
    }

    // Check for potential conflicts
    const configFiles = [
      'restified.config.ts',
      'tsconfig.json',
      '.env.example',
      'mocha-reporter-wrapper.js'
    ];

    for (const file of configFiles) {
      const filePath = this.getOutputPath(file);
      if (require('fs').existsSync(filePath) && !this.context.force) {
        warnings.push(`Configuration file ${file} already exists and will be overwritten`);
      }
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Get generator configuration
   */
  getConfig(): GeneratorConfig {
    return {
      name: 'config',
      description: 'Generate configuration files (restified.config.ts, tsconfig.json, .env.example)',
      templates: [
        'config/restified.config.hbs',
        'config/tsconfig.json.hbs', 
        'config/.env.example.hbs',
        'config/mocha-reporter-wrapper.js.hbs'
      ],
      dependencies: [],
      devDependencies: []
    };
  }

  /**
   * Get configuration template based on complexity level
   */
  private getConfigTemplate(): string {
    switch (this.context.complexity) {
      case 'minimal':
        return 'restified.config.minimal.hbs';
      case 'standard':
        return 'restified.config.standard.hbs';
      case 'enterprise':
        return 'restified.config.fixed.hbs';
      default:
        return 'restified.config.minimal.hbs';
    }
  }

  /**
   * Get environment template based on complexity level  
   */
  private getEnvTemplate(): string {
    switch (this.context.complexity) {
      case 'minimal':
        return '.env.minimal.hbs';
      case 'standard':
        return '.env.example.fixed.hbs';
      case 'enterprise':
        return '.env.example.fixed.hbs';
      default:
        return '.env.minimal.hbs';
    }
  }
}