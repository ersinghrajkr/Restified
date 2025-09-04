/**
 * Interactive Wizard
 * 
 * Guided experience for scaffolding API test suites with intelligent defaults
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { ScaffoldOptions, ValidationError } from '../types/ScaffoldTypes';
import { APIDiscovery } from './APIDiscovery';

interface WizardAnswers {
  projectName: string;
  apiUrl: string;
  testTypes: string[];
  authMethod: 'jwt' | 'oauth2' | 'basic' | 'apikey' | 'none';
  databaseType?: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite';
  generateExamples: boolean;
  setupMonitoring: boolean;
  outputDirectory?: string;
  useApiDiscovery: boolean;
}

export class InteractiveWizard {
  private apiDiscovery: APIDiscovery;

  constructor() {
    this.apiDiscovery = new APIDiscovery();
  }

  async run(): Promise<ScaffoldOptions> {
    console.log(chalk.cyan('\n🧙‍♂️ === RestifiedTS Interactive Setup Wizard ===\n'));
    console.log(chalk.gray('Let\'s create your perfect API test suite step by step...\n'));

    try {
      const answers = await this.askQuestions();
      
      // If API discovery is enabled, enhance the configuration
      if (answers.useApiDiscovery) {
        await this.enhanceWithApiDiscovery(answers);
      }

      return this.convertToScaffoldOptions(answers);
    } catch (error) {
      console.log(chalk.red('\n❌ Wizard interrupted:'), (error as Error).message);
      throw error;
    }
  }

  private async askQuestions(): Promise<WizardAnswers> {
    const questions = [
      {
        type: 'input',
        name: 'projectName',
        message: '🏷️  What\'s your project name?',
        default: 'MyAPI',
        validate: (input: string) => {
          if (!input || input.trim() === '') {
            return 'Project name is required';
          }
          if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(input)) {
            return 'Project name must start with a letter and contain only letters, numbers, hyphens, and underscores';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'apiUrl',
        message: '🌐 What\'s your API base URL?',
        default: 'https://jsonplaceholder.typicode.com',
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid HTTP/HTTPS URL';
          }
        }
      },
      {
        type: 'confirm',
        name: 'useApiDiscovery',
        message: '🔍 Would you like me to analyze your API and auto-generate tests?',
        default: true
      },
      {
        type: 'checkbox',
        name: 'testTypes',
        message: '🧪 Select test types to include:',
        choices: [
          { name: 'API Testing (REST endpoints)', value: 'api', checked: true },
          { name: 'Authentication & Authorization', value: 'auth', checked: true },
          { name: 'Database Integration', value: 'database' },
          { name: 'Performance Testing (K6/Artillery)', value: 'performance' },
          { name: 'Security Testing (OWASP ZAP)', value: 'security' },
          { name: 'GraphQL API Testing', value: 'graphql' },
          { name: 'WebSocket Testing', value: 'websocket' }
        ],
        validate: (choices: string[]) => {
          if (choices.length === 0) {
            return 'Please select at least one test type';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'authMethod',
        message: '🔐 What authentication method does your API use?',
        choices: [
          { name: 'JWT (JSON Web Tokens)', value: 'jwt' },
          { name: 'OAuth2 (Authorization Code/Client Credentials)', value: 'oauth2' },
          { name: 'Basic Authentication (Username/Password)', value: 'basic' },
          { name: 'API Key (Header/Query Parameter)', value: 'apikey' },
          { name: 'No Authentication', value: 'none' }
        ],
        default: 'jwt',
        when: (answers: WizardAnswers) => answers.testTypes.includes('auth')
      },
      {
        type: 'list',
        name: 'databaseType',
        message: '🗄️  Which database does your API use?',
        choices: [
          { name: 'PostgreSQL', value: 'postgresql' },
          { name: 'MySQL/MariaDB', value: 'mysql' },
          { name: 'MongoDB', value: 'mongodb' },
          { name: 'Redis', value: 'redis' },
          { name: 'SQLite', value: 'sqlite' },
          { name: 'Skip database setup', value: undefined }
        ],
        when: (answers: WizardAnswers) => answers.testTypes.includes('database')
      },
      {
        type: 'confirm',
        name: 'generateExamples',
        message: '📝 Generate example test data and fixtures?',
        default: true
      },
      {
        type: 'confirm',
        name: 'setupMonitoring',
        message: '📊 Setup monitoring and alerting?',
        default: false
      },
      {
        type: 'input',
        name: 'outputDirectory',
        message: '📁 Output directory (leave blank to use project name):',
        validate: (input: string) => {
          if (input && input.trim() !== '' && !/^[a-zA-Z0-9-_./\\]+$/.test(input)) {
            return 'Directory name contains invalid characters';
          }
          return true;
        }
      }
    ];

    return inquirer.prompt(questions as any) as unknown as Promise<WizardAnswers>;
  }

  private async enhanceWithApiDiscovery(answers: WizardAnswers): Promise<void> {
    console.log(chalk.cyan('\n🔍 Analyzing your API...'));
    
    try {
      const analysis = await this.apiDiscovery.analyzeAPI(answers.apiUrl);
      
      if (analysis.openApiSpec) {
        console.log(chalk.green(`✅ Found OpenAPI specification!`));
        console.log(chalk.gray(`   📊 Discovered ${analysis.endpoints.length} endpoints`));
        console.log(chalk.gray(`   📋 Found ${analysis.resources.length} resources`));
        
        if (analysis.authMethod && analysis.authMethod !== answers.authMethod) {
          const useDetectedAuth = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'useDetected',
              message: `🔐 Detected ${analysis.authMethod} authentication. Use this instead of ${answers.authMethod}?`,
              default: true
            }
          ] as any);
          
          if (useDetectedAuth.useDetected) {
            answers.authMethod = analysis.authMethod as any;
          }
        }

        // Suggest additional test types based on API analysis
        const suggestedTypes = analysis.suggestedTestTypes.filter(
          type => !answers.testTypes.includes(type)
        );
        
        if (suggestedTypes.length > 0) {
          console.log(chalk.yellow(`\n💡 Based on your API analysis, I recommend adding:`));
          suggestedTypes.forEach(type => {
            console.log(chalk.yellow(`   • ${type}`));
          });
          
          const addSuggested = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'additionalTypes',
              message: 'Add recommended test types?',
              choices: suggestedTypes.map(type => ({
                name: this.getTestTypeDescription(type),
                value: type,
                checked: this.isHighPriorityTestType(type, analysis)
              }))
            }
          ] as any);
          
          answers.testTypes.push(...addSuggested.additionalTypes);
        }
        
      } else {
        console.log(chalk.yellow('⚠️  No OpenAPI specification found, but I can still help optimize your setup'));
      }
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  API analysis failed: ${(error as Error).message}`));
      console.log(chalk.gray('   Continuing with manual configuration...'));
    }
  }

  private convertToScaffoldOptions(answers: WizardAnswers): ScaffoldOptions {
    return {
      name: answers.projectName,
      types: answers.testTypes,
      url: answers.apiUrl,
      output: answers.outputDirectory || undefined,
      force: false // Interactive mode is more careful
    };
  }

  private getTestTypeDescription(type: string): string {
    const descriptions = {
      'performance': 'Performance Testing (Load, stress, endurance testing)',
      'security': 'Security Testing (OWASP ZAP integration, vulnerability scanning)',
      'database': 'Database Integration (Data validation, state management)',
      'graphql': 'GraphQL Testing (Queries, mutations, subscriptions)',
      'websocket': 'WebSocket Testing (Real-time communication)'
    };
    
    return descriptions[type as keyof typeof descriptions] || type;
  }

  private isHighPriorityTestType(type: string, analysis: any): boolean {
    // Auto-check high-priority test types based on API analysis
    if (type === 'performance' && analysis.endpoints.length > 10) return true;
    if (type === 'security' && analysis.hasAuthEndpoints) return true;
    if (type === 'database' && analysis.hasCrudOperations) return true;
    return false;
  }

  /**
   * Quick start mode - minimal questions for fast setup
   */
  async quickStart(): Promise<ScaffoldOptions> {
    console.log(chalk.cyan('\n⚡ === RestifiedTS Quick Start ===\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: '🏷️  Project name:',
        default: 'QuickAPI'
      },
      {
        type: 'input',
        name: 'apiUrl',
        message: '🌐 API URL:',
        default: 'https://jsonplaceholder.typicode.com'
      }
    ] as any);

    return {
      name: answers.projectName,
      types: ['api', 'auth'], // Sensible defaults
      url: answers.apiUrl,
      force: false
    };
  }
}