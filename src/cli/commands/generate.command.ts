import { Command } from 'commander';
import chalk from 'chalk';
import { ValidationUtils, ValidationError } from '../utils/ValidationUtils';

export class GenerateCommand {
  getCommand(): Command {
    return new Command('generate')
      .alias('g')
      .description('Generate test files and templates')
      .argument('<type>', 'Type to generate (test, config, auth)')
      .argument('[name]', 'Name for the generated file')
      .option('-p, --path <path>', 'Output path', 'src/tests')
      .action(async (type, name, options) => {
        await this.execute(type, name, options);
      });
  }

  private async execute(type: string, name: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue(`🔧 Generating ${type}...`));
      
      // Validate inputs
      const validTypes = ['test', 'config', 'auth'];
      if (!validTypes.includes(type)) {
        throw new ValidationError(`Unknown type: ${type}. Available types: ${validTypes.join(', ')}`, 'type');
      }
      
      let sanitizedName = '';
      if (name) {
        sanitizedName = ValidationUtils.validateProjectName(name);
      }
      
      if (options.path) {
        ValidationUtils.validateFilePath(options.path);
      }

      switch (type) {
        case 'test':
          await this.generateTest(sanitizedName, options);
          break;
        case 'config':
          await this.generateConfig(sanitizedName, options);
          break;
        case 'auth':
          await this.generateAuthTest(sanitizedName, options);
          break;
      }

      console.log(chalk.green('✅ Generation completed!'));

    } catch (error: any) {
      console.error(chalk.red('Error generating:'), error.message);
      throw error; // Re-throw instead of process.exit
    }
  }

  private async generateTest(name: string, options: any): Promise<void> {
    console.log(chalk.yellow(`Generating test: ${name} in ${options.path}`));
    // Implementation would create a test file template
  }

  private async generateConfig(name: string, options: any): Promise<void> {
    console.log(chalk.yellow(`Generating config: ${name}`));
    // Implementation would create a config file
  }

  private async generateAuthTest(name: string, options: any): Promise<void> {
    console.log(chalk.yellow(`Generating auth test: ${name}`));
    // Implementation would create an auth test template
  }
}