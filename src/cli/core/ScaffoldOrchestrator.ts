/**
 * Scaffold Orchestrator
 * 
 * Main coordinator that manages the scaffolding process using generators
 */

import chalk from 'chalk';
import { 
  ScaffoldOptions,
  ScaffoldContext, 
  GenerationResult,
  ValidationResult,
  OperationResult
} from '../types/ScaffoldTypes';
import { ScaffoldConfig } from './ScaffoldConfig';
import { TemplateEngine } from './TemplateEngine';
import { FileSystemManager } from './FileSystemManager';
import { BaseGenerator } from '../generators/BaseGenerator';
import { ConfigGenerator } from '../generators/ConfigGenerator';
import { PackageGenerator } from '../generators/PackageGenerator';
import { TestFileGenerator } from '../generators/TestFileGenerator';

export class ScaffoldOrchestrator {
  private config: ScaffoldConfig;
  private templateEngine: TemplateEngine;
  private fileManager: FileSystemManager;
  private generators: Map<string, BaseGenerator>;
  private executedGenerators: string[] = [];

  constructor(options: ScaffoldOptions) {
    this.config = ScaffoldConfig.create(options);
    this.templateEngine = new TemplateEngine();
    this.fileManager = new FileSystemManager(this.config.getContext().outputDirectory);
    this.generators = new Map();
    
    this.initializeGenerators();
  }

  /**
   * Execute the complete scaffolding process
   */
  async execute(): Promise<OperationResult> {
    console.log(chalk.cyan('\n🚀 === RestifiedTS Test Suite Scaffolder ===\n'));
    
    try {
      // Validate overall configuration
      const validation = this.validateConfiguration();
      if (!validation.isValid) {
        return {
          success: false,
          message: `Configuration validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Display warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          console.log(chalk.yellow(`⚠️  ${warning}`));
        });
      }

      // Create base directory structure
      await this.createDirectoryStructure();

      // Execute generators in order
      const generationResults = await this.executeGenerators();

      // Execute all file operations
      const fileResults = await this.fileManager.executeOperations();

      // Collect results
      const totalFilesCreated = generationResults.reduce(
        (total, result) => total + result.filesCreated.length, 
        0
      );

      // Display success message
      this.displaySuccessMessage(generationResults, totalFilesCreated);

      return {
        success: true,
        message: `Successfully scaffolded ${totalFilesCreated} files`,
        data: {
          generationResults,
          fileResults,
          context: this.config.getContext()
        }
      };

    } catch (error) {
      const message = `Scaffolding failed: ${(error as Error).message}`;
      console.log(chalk.red(`\n❌ ${message}`));
      
      // Attempt rollback
      await this.rollback();
      
      return {
        success: false,
        message,
        data: { error }
      };
    }
  }

  /**
   * Initialize all generators based on configuration
   */
  private initializeGenerators(): void {
    const context = this.config.getContext();

    // Always include core generators
    this.generators.set('config', new ConfigGenerator(context, this.templateEngine, this.fileManager));
    this.generators.set('package', new PackageGenerator(context, this.templateEngine, this.fileManager));
    this.generators.set('testfiles', new TestFileGenerator(context, this.templateEngine, this.fileManager));

    console.log(`📦 Initialized ${this.generators.size} generators`);
  }

  /**
   * Validate overall configuration
   */
  private validateConfiguration(): ValidationResult {
    const configValidation = this.config.validate();
    if (!configValidation.isValid) {
      return configValidation;
    }

    // Additional orchestrator-level validations can go here
    return configValidation;
  }

  /**
   * Create base directory structure
   */
  private async createDirectoryStructure(): Promise<void> {
    const context = this.config.getContext();
    const outputDir = context.outputDirectory;

    console.log(`📁 Creating directory structure in ${outputDir}...`);

    // Create main directories
    FileSystemManager.ensureDirectory(outputDir);
    FileSystemManager.ensureDirectory(`${outputDir}/setup`);
    FileSystemManager.ensureDirectory(`${outputDir}/tests`);
    FileSystemManager.ensureDirectory(`${outputDir}/config`);
    FileSystemManager.ensureDirectory(`${outputDir}/reports`);

    console.log('✅ Directory structure created');
  }

  /**
   * Execute all generators in sequence
   */
  private async executeGenerators(): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    
    console.log(`🔧 Executing ${this.generators.size} generators...`);

    for (const [name, generator] of this.generators) {
      console.log(`\n📋 Running ${name} generator...`);
      
      try {
        const result = await generator.execute();
        results.push(result);
        
        if (result.success) {
          console.log(chalk.green(`✅ ${name} generator completed successfully`));
          console.log(`   Generated: ${result.filesCreated.join(', ')}`);
          this.executedGenerators.push(name);
        } else {
          console.log(chalk.red(`❌ ${name} generator failed`));
          if (result.errors) {
            result.errors.forEach(error => console.log(chalk.red(`   Error: ${error}`)));
          }
          throw new Error(`Generator ${name} failed: ${result.errors?.join(', ')}`);
        }

        // Display warnings
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            console.log(chalk.yellow(`   ⚠️  ${warning}`));
          });
        }

      } catch (error) {
        const message = `Generator ${name} execution failed: ${(error as Error).message}`;
        console.log(chalk.red(`❌ ${message}`));
        
        results.push({
          success: false,
          filesCreated: [],
          errors: [message]
        });
        
        throw error;
      }
    }

    return results;
  }

  /**
   * Display success message with created files
   */
  private displaySuccessMessage(results: GenerationResult[], totalFilesCreated: number): void {
    const context = this.config.getContext();
    
    console.log(chalk.green('\n✅ Test suite scaffolded successfully!'));
    console.log(chalk.white('\n📁 Created files:'));
    console.log(chalk.gray(`   📁 ${context.outputDirectory}/`));
    
    // Show generated files
    results.forEach(result => {
      if (result.success && result.filesCreated.length > 0) {
        result.filesCreated.forEach(file => {
          console.log(chalk.gray(`   ├── 📄 ${file}`));
        });
      }
    });
    
    console.log(chalk.gray('   └── 📁 reports/ (generated after tests)'));
    
    console.log(chalk.white('\n🚀 Next steps:'));
    console.log(chalk.cyan(`   1. cd ${context.outputDirectory}`));
    console.log(chalk.cyan('   2. cp .env.example .env'));
    console.log(chalk.cyan('   3. npm install'));
    console.log(chalk.cyan('   4. npm test'));
    
    console.log(chalk.white(`\n📊 Summary: ${totalFilesCreated} files generated successfully`));
  }

  /**
   * Rollback all operations
   */
  private async rollback(): Promise<void> {
    console.log(chalk.yellow('\n🔄 Rolling back changes...'));
    
    try {
      // Rollback file operations
      await this.fileManager.rollback();
      
      // Rollback generators in reverse order
      for (let i = this.executedGenerators.length - 1; i >= 0; i--) {
        const generatorName = this.executedGenerators[i];
        const generator = this.generators.get(generatorName);
        if (generator) {
          await generator.rollback();
        }
      }
      
      console.log(chalk.green('✅ Rollback completed'));
    } catch (rollbackError) {
      console.log(chalk.red(`❌ Rollback failed: ${(rollbackError as Error).message}`));
    }
  }

  /**
   * Get scaffold configuration
   */
  getConfig(): ScaffoldConfig {
    return this.config;
  }

  /**
   * Get available generators
   */
  getGenerators(): string[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Add a custom generator
   */
  addGenerator(name: string, generator: BaseGenerator): void {
    this.generators.set(name, generator);
  }

  /**
   * Remove a generator
   */
  removeGenerator(name: string): boolean {
    return this.generators.delete(name);
  }
}