import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';

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

      const args = [
        '-r', 'ts-node/register',
        options.pattern
      ];

      if (options.report) {
        args.push('--reporter', 'mochawesome');
        args.push('--reporter-options', 'reportDir=reports,reportFilename=index,quiet=true,overwrite=true,html=true,json=true');
      } else {
        args.push('--reporter', options.reporter);
      }

      args.push('--timeout', options.timeout);

      const mocha = spawn('npx', ['mocha', ...args], {
        stdio: 'inherit',
        shell: true
      });

      mocha.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✅ Tests completed successfully!'));
          if (options.report) {
            console.log(chalk.yellow('📊 Report generated in reports/index.html'));
          }
        } else {
          console.error(chalk.red('❌ Tests failed!'));
          process.exit(code || 1);
        }
      });

      mocha.on('error', (error) => {
        console.error(chalk.red('Error running tests:'), error.message);
        process.exit(1);
      });

    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }
}