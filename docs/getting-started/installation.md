# Installation Guide

This guide will help you install and set up Restified in your project.

## Prerequisites

Before installing Restified, ensure you have:

- **Node.js**: Version 16.0.0 or higher
- **npm** or **yarn**: Package manager for Node.js
- **TypeScript**: Version 5.0 or higher (recommended)

Check your versions:
```bash
node --version    # Should be >= 16.0.0
npm --version     # Any recent version
npx tsc --version # Should be >= 5.0.0
```

## Installation Methods

### Method 1: NPM Package (Recommended)

Once published, install from npm:

```bash
npm install restified
```

### Method 2: Development Installation

For development or testing the latest features:

```bash
# Clone the repository
git clone https://github.com/ersinghrajkr/Restified.git
cd Restified

# Install dependencies
npm install

# Build the project
npm run build
```

## Project Setup

### 1. Initialize TypeScript Project

If you don't have a TypeScript project yet:

```bash
# Create project directory
mkdir my-api-tests
cd my-api-tests

# Initialize npm project
npm init -y

# Install TypeScript
npm install -D typescript @types/node

# Initialize TypeScript config
npx tsc --init
```

### 2. Install Testing Dependencies

Install Mocha and Chai for testing:

```bash
npm install -D mocha @types/mocha chai @types/chai ts-node
```

### 3. Install Restified

```bash
npm install restified
```

### 4. Configure TypeScript

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5. Configure Package.json Scripts

Add test scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "test": "mocha -r ts-node/register 'tests/**/*.spec.ts'",
    "test:watch": "mocha -r ts-node/register 'tests/**/*.spec.ts' --watch",
    "clean": "rimraf dist"
  }
}
```

## Project Structure

Create the recommended directory structure:

```
my-api-tests/
├── src/                     # Source code (if any)
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── setup.ts            # Test setup file
├── config/                 # Configuration files
│   ├── default.json        # Default config
│   └── test.json           # Test environment config
├── .env.example            # Environment variables template
├── package.json
└── tsconfig.json
```

## Verification

Create a simple test to verify installation:

**tests/verification.spec.ts:**
```typescript
import { restified } from 'restified';

describe('Installation Verification', function() {
  this.timeout(10000);

  it('should make a simple GET request', async function() {
    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/posts/1')
        .execute();

    await response
      .statusCode(200)
      .jsonPath('$.id', 1)
      .execute();
  });

  afterAll(async function() {
    await restified.cleanup();
  });
});
```

Run the verification test:

```bash
npm test
```

If you see a passing test, Restified is correctly installed!

## IDE Setup

### Visual Studio Code

For the best TypeScript experience with VS Code:

1. Install the TypeScript extension (usually pre-installed)
2. Install the Mocha Test Explorer extension (optional)
3. Configure settings in `.vscode/settings.json`:

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### IntelliJ/WebStorm

- Enable TypeScript support in project settings
- Configure Node.js interpreter to use your project's Node version
- Set up run configurations for Mocha tests

## Environment Configuration

### 1. Create Environment File

Create `.env` file for environment variables:

```bash
# .env
BASE_URL=https://api.example.com
API_TOKEN=your-token-here
TIMEOUT=10000
```

### 2. Create Environment Template

Create `.env.example` for team sharing:

```bash
# .env.example
BASE_URL=https://api.example.com
API_TOKEN=your-token-here
TIMEOUT=10000
```

### 3. Load Environment Variables

In your test setup file:

```typescript
// tests/setup.ts
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Global test configuration
export const config = {
  baseURL: process.env.BASE_URL || 'https://api.example.com',
  timeout: parseInt(process.env.TIMEOUT || '5000'),
  apiToken: process.env.API_TOKEN
};
```

## Troubleshooting

### Common Issues

**TypeScript compilation errors:**
- Ensure TypeScript version is >= 5.0.0
- Check `tsconfig.json` configuration matches requirements
- Install required `@types/*` packages

**Module not found errors:**
- Verify Restified is installed: `npm list restified`
- Check import syntax: `import { restified } from 'restified'`
- Rebuild the project: `npm run build`

**Test execution fails:**
- Ensure Mocha and ts-node are installed
- Check test file naming (should end with `.spec.ts` or `.test.ts`)
- Verify network connectivity for API tests

**Path resolution issues:**
- Use absolute paths in `tsconfig.json`
- Check `baseUrl` and `paths` configuration
- Restart TypeScript language service in IDE

### Getting Help

If you encounter issues:

1. Check the [troubleshooting guide](../advanced/troubleshooting.md)
2. Search [existing issues](https://github.com/ersinghrajkr/Restified/issues)
3. Create a new issue with:
   - Node.js and npm versions
   - TypeScript version
   - Complete error messages
   - Minimal reproduction example

## Next Steps

Once Restified is installed:

1. 🚀 [Quick Start Tutorial](quick-start.md) - Create your first test
2. 🧠 [Basic Concepts](basic-concepts.md) - Understand core concepts
3. 📖 [Examples](../../examples/) - See working examples
4. 🎯 [Fluent DSL Guide](../guides/fluent-dsl.md) - Master the DSL syntax