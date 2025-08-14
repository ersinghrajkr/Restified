import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';

export class InitCommand {
  getCommand(): Command {
    return new Command('init')
      .description('Initialize a new Restified project')
      .argument('[project-name]', 'Project name')
      .option('-t, --template <template>', 'Project template', 'basic')
      .option('-y, --yes', 'Skip prompts and use defaults')
      .action(async (projectName, options) => {
        await this.execute(projectName, options);
      });
  }

  private async execute(projectName?: string, options: any = {}): Promise<void> {
    try {
      console.log(chalk.blue('🚀 Initializing Restified project...'));

      const answers = options.yes ? this.getDefaultAnswers() : await this.promptUser();
      
      const finalProjectName = projectName || answers.projectName;
      const projectPath = path.join(process.cwd(), finalProjectName);

      if (fs.existsSync(projectPath)) {
        console.error(chalk.red(`Directory ${finalProjectName} already exists!`));
        process.exit(1);
      }

      await this.createProject(projectPath, answers);
      
      console.log(chalk.green('✅ Project created successfully!'));
      console.log(chalk.yellow('\nNext steps:'));
      console.log(chalk.white(`  cd ${finalProjectName}`));
      console.log(chalk.white('  npm install'));
      console.log(chalk.white('  npm test'));

    } catch (error: any) {
      console.error(chalk.red('Error creating project:'), error.message);
      process.exit(1);
    }
  }

  private async promptUser(): Promise<any> {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-api-tests',
        validate: (input: string) => input.trim().length > 0 || 'Project name is required'
      },
      {
        type: 'input',
        name: 'baseURL',
        message: 'Base URL for API:',
        default: 'https://jsonplaceholder.typicode.com'
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

    fs.mkdirSync(projectPath, { recursive: true });
    
    for (const dir of directories) {
      fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
    }

    // Create files
    this.createPackageJson(projectPath, answers);
    this.createTsConfig(projectPath);
    this.createRestifiedConfig(projectPath, answers);
    this.createEnvFile(projectPath, answers);
    this.createSampleTest(projectPath, answers);
    this.createReadme(projectPath, answers);
  }

  private createPackageJson(projectPath: string, answers: any): void {
    const packageJson = {
      name: answers.projectName,
      version: '1.0.0',
      description: 'API tests using Restified framework',
      scripts: {
        test: 'mocha -r ts-node/register "src/tests/**/*.spec.ts"',
        'test:report': 'mocha -r ts-node/register "src/tests/**/*.spec.ts" --reporter mochawesome --reporter-options reportDir=reports,reportFilename=index,quiet=true,overwrite=true,html=true,json=true',
        build: 'tsc',
        lint: 'eslint . --ext .ts',
        'lint:fix': 'eslint . --ext .ts --fix'
      },
      dependencies: {
        restified: '^1.0.0'
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

    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  private createTsConfig(projectPath: string): void {
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

    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  private createRestifiedConfig(projectPath: string, answers: any): void {
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

    fs.writeFileSync(
      path.join(projectPath, 'restified.config.ts'),
      config
    );
  }

  private createEnvFile(projectPath: string, answers: any): void {
    let envContent = `# Restified Environment Variables
BASE_URL=${answers.baseURL}
NODE_ENV=development
`;

    if (answers.authType === 'bearer') {
      envContent += 'AUTH_TOKEN=your_bearer_token_here\n';
    } else if (answers.authType === 'basic') {
      envContent += 'USERNAME=your_username\nPASSWORD=your_password\n';
    } else if (answers.authType === 'api-key') {
      envContent += 'API_KEY=your_api_key_here\n';
    }

    fs.writeFileSync(path.join(projectPath, '.env'), envContent);
  }

  private createSampleTest(projectPath: string, answers: any): void {
    const testContent = `import { expect } from 'chai';
import { restified } from 'restified';

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

    fs.writeFileSync(
      path.join(projectPath, 'src/tests/sample.spec.ts'),
      testContent
    );
  }

  private createReadme(projectPath: string, answers: any): void {
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

    fs.writeFileSync(
      path.join(projectPath, 'README.md'),
      readme
    );
  }
}