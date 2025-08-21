#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { InitCommand } from './commands/init.command';
import { TestCommand } from './commands/test.command';
import { ConfigCommand } from './commands/config.command';
import { GenerateCommand } from './commands/generate.command';
import { reportCommand } from './commands/report';
import { initConfigCommand } from './commands/init-config';
import { scaffoldCommand } from './commands/scaffold';

const program = new Command();

program
  .name('restifiedts')
  .description('Restified - Production-grade TypeScript API testing framework')
  .version('1.0.0');

// Add commands
program.addCommand(new InitCommand().getCommand());
program.addCommand(new TestCommand().getCommand());
program.addCommand(new ConfigCommand().getCommand());
program.addCommand(new GenerateCommand().getCommand());
program.addCommand(reportCommand);
program.addCommand(initConfigCommand);
program.addCommand(scaffoldCommand);

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}