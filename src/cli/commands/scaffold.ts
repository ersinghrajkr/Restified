/**
 * CLI Command: Create Test Suite
 * 
 * Enterprise-grade scaffold command with modular architecture
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ScaffoldOrchestrator } from '../core/ScaffoldOrchestrator';
import { ScaffoldOptions, ValidationError } from '../types/ScaffoldTypes';
import { ValidationUtils } from '../utils/ValidationUtils';

export const scaffoldCommand = new Command('scaffold')
  .description('Scaffold test suite with progressive complexity options')
  .option('-n, --name <name>', 'Test suite name', 'MyAPI')
  .option('-t, --types <types>', 'Test types (api,auth,database,performance,security,graphql,websocket)', 'api,auth')
  .option('-u, --url <url>', 'Base API URL', 'https://jsonplaceholder.typicode.com')
  .option('-o, --output <dir>', 'Output directory (defaults to project name)')
  .option('-c, --complexity <level>', 'Configuration complexity: minimal|standard|enterprise', 'minimal')
  .option('-f, --force', 'Overwrite existing files', false)
  .action(async (options) => {
    try {
      // Parse and validate options
      const sanitizedName = ValidationUtils.validateProjectName(options.name);
      const sanitizedUrl = ValidationUtils.validateUrl(options.url);
      const types = options.types.split(',').map((t: string) => t.trim());
      
      // Validate test types
      const validTypes = ['api', 'auth', 'database', 'performance', 'security', 'graphql', 'websocket'];
      for (const type of types) {
        if (!validTypes.includes(type)) {
          throw new ValidationError(`Invalid test type '${type}'. Valid types: ${validTypes.join(', ')}`, 'types');
        }
      }
      
      // Validate complexity level
      const validComplexity = ['minimal', 'standard', 'enterprise'];
      if (!validComplexity.includes(options.complexity)) {
        throw new ValidationError(`Invalid complexity level '${options.complexity}'. Valid levels: ${validComplexity.join(', ')}`, 'complexity');
      }
      
      const scaffoldOptions: ScaffoldOptions = {
        name: sanitizedName,
        types: types,
        url: sanitizedUrl,
        output: options.output ? ValidationUtils.validateProjectName(options.output) : undefined,
        complexity: options.complexity || 'minimal',
        force: options.force
      };

      // Create and execute orchestrator
      const orchestrator = new ScaffoldOrchestrator(scaffoldOptions);
      const result = await orchestrator.execute();

      // Handle result
      if (result.success) {
        console.log(chalk.green(`\n🎉 ${result.message}`));
        return; // Success - no need to exit
      } else {
        throw new Error(result.message); // Throw error instead of exit
      }

    } catch (error) {
      if (error instanceof ValidationError) {
        console.log(chalk.red(`\n❌ Configuration Error: ${error.message}`));
        
        if (error.context?.validation?.errors) {
          error.context.validation.errors.forEach((err: string) => {
            console.log(chalk.red(`   • ${err}`));
          });
        }
        
        if (error.context?.validation?.warnings) {
          error.context.validation.warnings.forEach((warning: string) => {
            console.log(chalk.yellow(`   ⚠️  ${warning}`));
          });
        }
      } else {
        console.log(chalk.red(`\n❌ Unexpected error: ${(error as Error).message}`));
      }
      
      throw error; // Re-throw instead of process.exit
    }
  });

// Add help examples
scaffoldCommand.addHelpText('after', `
Examples:
  # Minimal setup (perfect for beginners)
  $ restifiedts scaffold -n "UserAPI" -u "https://api.example.com" -c "minimal"
  
  # Standard setup with multiple test types
  $ restifiedts scaffold -n "EcommerceAPI" -t "api,auth,database" -c "standard"
  
  # Enterprise setup with all features
  $ restifiedts scaffold -n "PaymentAPI" -t "api,auth,security,performance" -c "enterprise" -f
  
  # Custom output directory
  $ restifiedts scaffold -n "GraphQLAPI" -t "api,auth,graphql,websocket" -o "./my-tests"

Complexity Levels:
  minimal     - 15-line config, basic setup (recommended for new users)
  standard    - Moderate configuration with common features
  enterprise  - Full-featured configuration for complex scenarios

Test Types:
  api         - REST API testing (always included)
  auth        - Authentication and authorization testing
  database    - Database integration and validation testing
  performance - Load and performance testing with K6/Artillery
  security    - Security testing with OWASP ZAP integration
  graphql     - GraphQL API testing
  websocket   - WebSocket real-time communication testing
`);