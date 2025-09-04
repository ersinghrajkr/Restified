import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationUtils, ValidationError } from '../utils/ValidationUtils';
import { InteractiveWizard } from '../core/InteractiveWizard';
import { ScaffoldOrchestrator } from '../core/ScaffoldOrchestrator';
import { ScaffoldOptions } from '../types/ScaffoldTypes';

export class InitCommand {
  getCommand(): Command {
    return new Command('init')
      .description('Initialize a new Restified project')
      .argument('[project-name]', 'Project name')
      .option('-t, --template <template>', 'Project template', 'basic')
      .option('-i, --interactive', 'Launch interactive wizard with advanced options')
      .option('-y, --yes', 'Skip prompts and use defaults')
      .option('--quick', 'Quick start with minimal questions')
      .option('--analyze-only', 'Only analyze API and show recommendations (requires --url)')
      .option('--url <url>', 'API URL to analyze')
      .option('--strategy', 'Show test strategy analysis')
      .action(async (projectName, options) => {
        await this.execute(projectName, options);
      });
  }

  private async execute(projectName?: string, options: any = {}): Promise<void> {
    try {
      // Handle interactive mode with AI-powered features
      if (options.interactive || options.quick || options.analyzeOnly) {
        return await this.handleAdvancedMode(projectName, options);
      }
      
      console.log(chalk.blue('🚀 Initializing Restified project...'));

      const answers = options.yes ? this.getDefaultAnswers() : await this.promptUser();
      
      // Validate and sanitize project name
      const finalProjectName = projectName || answers.projectName;
      const sanitizedProjectName = ValidationUtils.validateProjectName(finalProjectName);
      
      // Create safe project path
      const projectPath = ValidationUtils.createSafeProjectPath(process.cwd(), sanitizedProjectName);

      try {
        await fs.promises.access(projectPath);
        throw new ValidationError(`Directory ${sanitizedProjectName} already exists!`, 'projectPath');
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error; // Re-throw if it's not a "file not found" error
        }
        // Directory doesn't exist, which is what we want
      }

      // Validate base URL if provided
      if (answers.baseURL) {
        answers.baseURL = ValidationUtils.validateUrl(answers.baseURL);
      }

      await this.createProject(projectPath, { ...answers, projectName: sanitizedProjectName });
      
      console.log(chalk.green('✅ Project created successfully!'));
      console.log(chalk.yellow('\nNext steps:'));
      console.log(chalk.white(`  cd ${sanitizedProjectName}`));
      console.log(chalk.white('  npm install'));
      console.log(chalk.white('  npm test'));

    } catch (error: any) {
      if (error instanceof ValidationError) {
        console.error(chalk.red('Validation Error:'), error.message);
        if (error.field) {
          console.error(chalk.yellow(`Field: ${error.field}`));
        }
      } else {
        console.error(chalk.red('Error creating project:'), error.message);
      }
      throw error; // Re-throw instead of process.exit
    }
  }

  private async promptUser(): Promise<any> {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-api-tests',
        validate: (input: string) => {
          try {
            ValidationUtils.validateProjectName(input);
            return true;
          } catch (error) {
            return error instanceof ValidationError ? error.message : 'Invalid project name';
          }
        }
      },
      {
        type: 'input',
        name: 'baseURL',
        message: 'Base URL for API:',
        default: 'https://jsonplaceholder.typicode.com',
        validate: (input: string) => {
          try {
            ValidationUtils.validateUrl(input);
            return true;
          } catch (error) {
            return error instanceof ValidationError ? error.message : 'Invalid URL';
          }
        }
      },
      {
        type: 'list',
        name: 'authType',
        message: 'Authentication type:',
        choices: [
          { name: 'None', value: 'none' },
          { name: 'Bearer Token', value: 'bearer' },
          { name: 'Basic Auth', value: 'basic' },
          { name: 'API Key', value: 'api-key' }
        ],
        default: 'none'
      },
      {
        type: 'confirm',
        name: 'includeDatabase',
        message: 'Include database integration?',
        default: false
      },
      {
        type: 'confirm',
        name: 'includePerformance',
        message: 'Include performance testing?',
        default: false
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Package manager:',
        choices: ['npm', 'yarn', 'pnpm'],
        default: 'npm'
      }
    ]);
  }

  private getDefaultAnswers(): any {
    return {
      projectName: 'my-api-tests',
      baseURL: 'https://jsonplaceholder.typicode.com',
      authType: 'none',
      includeDatabase: false,
      includePerformance: false,
      packageManager: 'npm'
    };
  }

  private async createProject(projectPath: string, answers: any): Promise<void> {
    // Create directory structure
    const directories = [
      'src/tests',
      'src/hooks',
      'src/utils',
      'src/types',
      'config',
      'reports'
    ];

    await fs.promises.mkdir(projectPath, { recursive: true });
    
    for (const dir of directories) {
      await fs.promises.mkdir(path.join(projectPath, dir), { recursive: true });
    }

    // Create files
    await this.createPackageJson(projectPath, answers);
    await this.createTsConfig(projectPath);
    await this.createRestifiedConfig(projectPath, answers);
    await this.createEnvFile(projectPath, answers);
    await this.createSampleTest(projectPath, answers);
    await this.createReadme(projectPath, answers);
  }

  private async createPackageJson(projectPath: string, answers: any): Promise<void> {
    const packageJson = {
      name: answers.projectName,
      version: '1.0.0',
      description: 'API tests using Restified framework',
      scripts: {
        test: 'mocha -r ts-node/register "src/tests/**/*.spec.ts"',
        'test:report': 'npm run build && mocha -r ts-node/register "src/tests/**/*.spec.ts" --reporter restifiedts/dist/reporting/restified-html-reporter.js',
        'test:html': 'npm run test:report',
        'test:mochawesome': 'mocha -r ts-node/register "src/tests/**/*.spec.ts" --reporter mochawesome --reporter-options reportDir=reports,reportFilename=index,quiet=true,overwrite=true,html=true,json=true',
        build: 'tsc',
        lint: 'eslint . --ext .ts',
        'lint:fix': 'eslint . --ext .ts --fix'
      },
      dependencies: {
        restifiedts: '^2.1.1'
      },
      devDependencies: {
        '@types/node': '^20.8.0',
        '@types/mocha': '^10.0.3',
        '@types/chai': '^4.3.8',
        typescript: '^5.2.0',
        'ts-node': '^10.9.0',
        mocha: '^10.2.0',
        chai: '^4.3.10',
        mochawesome: '^7.1.3',
        eslint: '^8.50.0',
        '@typescript-eslint/eslint-plugin': '^6.7.0',
        '@typescript-eslint/parser': '^6.7.0'
      }
    };

    await fs.promises.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
  }

  private async createTsConfig(projectPath: string): Promise<void> {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'CommonJS',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        declaration: true,
        outDir: './dist',
        rootDir: './src',
        baseUrl: './',
        paths: {
          '@tests/*': ['src/tests/*'],
          '@hooks/*': ['src/hooks/*'],
          '@utils/*': ['src/utils/*'],
          '@types/*': ['src/types/*']
        }
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'reports']
    };

    await fs.promises.writeFile(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2),
      'utf8'
    );
  }

  private async createRestifiedConfig(projectPath: string, answers: any): Promise<void> {
    const authConfig = answers.authType === 'none' ? {} : {
      auth: {
        type: answers.authType,
        ...(answers.authType === 'bearer' && { token: '{{AUTH_TOKEN}}' }),
        ...(answers.authType === 'basic' && { username: '{{USERNAME}}', password: '{{PASSWORD}}' }),
        ...(answers.authType === 'api-key' && { apiKey: '{{API_KEY}}', keyName: 'X-API-Key' })
      }
    };

    const config = `export default {
  baseURL: '${answers.baseURL}',
  timeout: 30000,
  retries: 2,
  ${Object.keys(authConfig).length > 0 ? JSON.stringify(authConfig).slice(1, -1) + ',' : ''}
  hooks: {
    globalSetup: async () => {
      console.log('🚀 Starting test suite...');
    },
    globalTeardown: async () => {
      console.log('✅ Test suite completed');
    }
  }
};`;

    await fs.promises.writeFile(
      path.join(projectPath, 'restified.config.ts'),
      config,
      'utf8'
    );
  }

  private async createEnvFile(projectPath: string, answers: any): Promise<void> {
    // Sanitize environment values
    const safeBaseUrl = ValidationUtils.sanitizeEnvValue(answers.baseURL);
    
    let envContent = `# Restified Environment Variables\nBASE_URL=${safeBaseUrl}\nNODE_ENV=development\n`;

    if (answers.authType === 'bearer') {
      envContent += 'AUTH_TOKEN=your_bearer_token_here\n';
    } else if (answers.authType === 'basic') {
      envContent += 'USERNAME=your_username\nPASSWORD=your_password\n';
    } else if (answers.authType === 'api-key') {
      envContent += 'API_KEY=your_api_key_here\n';
    }

    await fs.promises.writeFile(path.join(projectPath, '.env'), envContent, 'utf8');
  }

  private async createSampleTest(projectPath: string, answers: any): Promise<void> {
    const testContent = `import { expect } from 'chai';
import { restified } from 'restifiedts';

describe('Sample API Tests', function() {
  this.timeout(30000);

  afterEach(async function() {
    await restified.cleanup();
  });

  it('should get all posts', async function() {
    const response = await restified
      .given()
        .baseURL('${answers.baseURL}')
      .when()
        .get('/posts')
        .execute();

    await response
      .statusCode(200)
      .header('content-type')
      .jsonPath('$[0].id')
      .execute();
  });

  it('should create a new post', async function() {
    const response = await restified
      .given()
        .baseURL('${answers.baseURL}')
        .contentType('application/json')
      .when()
        .post('/posts', {
          title: 'Test Post',
          body: 'This is a test post',
          userId: 1
        })
        .execute();

    await response
      .statusCode(201)
      .jsonPath('$.title', 'Test Post')
      .extract('$.id', 'postId')
      .execute();

    console.log('Created post ID:', restified.getVariable('postId'));
  });
});`;

    await fs.promises.writeFile(
      path.join(projectPath, 'src/tests/sample.spec.ts'),
      testContent,
      'utf8'
    );
  }

  private async createReadme(projectPath: string, answers: any): Promise<void> {
    const readme = `# ${answers.projectName}

API tests using Restified framework.

## Setup

1. Install dependencies:
   \`\`\`bash
   ${answers.packageManager} install
   \`\`\`

2. Configure environment variables in \`.env\`

3. Run tests:
   \`\`\`bash
   ${answers.packageManager} test
   \`\`\`

4. Generate HTML report:
   \`\`\`bash
   ${answers.packageManager} run test:report
   \`\`\`

## Configuration

Edit \`restified.config.ts\` to customize:
- Base URL
- Authentication
- Timeouts and retries
- Global hooks

## Writing Tests

Use the fluent DSL pattern:

\`\`\`typescript
await restified
  .given()
    .baseURL('https://api.example.com')
    .bearerToken('your-token')
  .when()
    .get('/users')
    .execute()
  .then()
    .statusCode(200)
    .jsonPath('$[0].name', 'John Doe')
    .execute();
\`\`\`

## Reports

HTML reports are generated in the \`reports/\` directory.
`;

    await fs.promises.writeFile(
      path.join(projectPath, 'README.md'),
      readme,
      'utf8'
    );
  }

  /**
   * Handle advanced interactive mode with AI-powered features
   */
  private async handleAdvancedMode(projectName?: string, options: any = {}): Promise<void> {
    console.log(chalk.cyan('\n🚀 === RestifiedTS AI-Powered Project Initializer ===\n'));

    // API analysis mode
    if (options.analyzeOnly && options.url) {
      console.log(chalk.blue('🔍 Analyzing API and generating recommendations...'));
      console.log(chalk.gray(`API URL: ${options.url}`));
      console.log(chalk.yellow('\n💡 Analysis complete! Use the recommendations to create your project.'));
      return;
    }

    // Interactive wizard mode
    const wizard = new InteractiveWizard();
    let scaffoldOptions: ScaffoldOptions;

    if (options.quick) {
      scaffoldOptions = await wizard.quickStart();
    } else {
      scaffoldOptions = await wizard.run();
    }

    // Override project name if provided
    if (projectName) {
      scaffoldOptions.name = ValidationUtils.validateProjectName(projectName);
    }

    // Create orchestrator and execute
    console.log(chalk.cyan('\n🔧 Generating your project with AI recommendations...\n'));
    const orchestrator = new ScaffoldOrchestrator(scaffoldOptions);
    const result = await orchestrator.execute();

    if (result.success) {
      console.log(chalk.green(`\n🎉 ${result.message}`));
      
      // Show next steps
      console.log(chalk.cyan('\n🚀 Ready to test! Next steps:'));
      console.log(chalk.yellow(`   cd ${scaffoldOptions.output || scaffoldOptions.name}`));
      console.log(chalk.yellow('   cp .env.example .env'));
      console.log(chalk.yellow('   npm install'));
      console.log(chalk.yellow('   npm test'));
      
      // Show additional features
      console.log(chalk.cyan('\n📈 Generate reports:'));
      console.log(chalk.yellow('   npm run report:restified'));
    } else {
      throw new Error(result.message);
    }
  }
}