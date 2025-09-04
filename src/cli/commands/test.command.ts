import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { ValidationUtils, ValidationError } from '../utils/ValidationUtils';

export class TestCommand {
  getCommand(): Command {
    return new Command('test')
      .description('Run Restified tests')
      .option('-p, --pattern <pattern>', 'Test file pattern', 'src/tests/**/*.spec.ts')
      .option('-r, --reporter <reporter>', 'Test reporter', 'spec')
      .option('-t, --timeout <ms>', 'Test timeout in milliseconds', '30000')
      .option('--report', 'Generate HTML report')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  private async execute(options: any): Promise<void> {
    try {
      console.log(chalk.blue('🧪 Running Restified tests...'));

      // Validate inputs to prevent command injection
      const safePattern = ValidationUtils.validateTestPattern(options.pattern);
      const safeReporter = ValidationUtils.validateReporter(options.reporter);
      const safeTimeout = ValidationUtils.validateTimeout(options.timeout);

      const args = [
        '-r', 'ts-node/register',
        safePattern
      ];

      if (options.report) {
        args.push('--reporter', 'mochawesome');
        args.push('--reporter-options', 'reportDir=reports,reportFilename=index,quiet=true,overwrite=true,html=true,json=true');
      } else {
        args.push('--reporter', safeReporter);
      }

      args.push('--timeout', safeTimeout.toString());

      // Remove shell: true to prevent command injection
      const mocha = spawn('npx', ['mocha', ...args], {
        stdio: 'inherit'
      });

      return new Promise<void>((resolve, reject) => {
        mocha.on('close', (code) => {
          if (code === 0) {
            console.log(chalk.green('✅ Tests completed successfully!'));
            if (options.report) {
              console.log(chalk.yellow('📊 Report generated in reports/index.html'));
            }
            resolve();
          } else {
            const error = new Error(`Tests failed with exit code ${code}`);
            reject(error);
          }
        });

        mocha.on('error', (error) => {
          reject(new Error(`Error running tests: ${error.message}`));
        });
      });

    } catch (error: any) {
      if (error instanceof ValidationError) {
        console.error(chalk.red('Validation Error:'), error.message);
        if (error.field) {
          console.error(chalk.yellow(`Field: ${error.field}`));
        }
      } else {
        console.error(chalk.red('Error:'), error.message);
      }
      throw error; // Re-throw instead of process.exit
    }
  }
}