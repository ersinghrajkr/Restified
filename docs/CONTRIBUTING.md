# Contributing to Restified

We love your input! We want to make contributing to Restified as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ersinghrajkr/Restified.git
   cd Restified
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
src/
├── index.ts              # Main entry point
├── RestifiedTypes.ts     # TypeScript type definitions
├── core/
│   ├── Restified.ts     # Main framework class
│   ├── dsl/             # Fluent DSL implementation
│   ├── stores/          # Variable and response management
│   ├── auth/            # Authentication providers
│   └── config/          # Configuration management
├── cli/                 # Command-line interface
└── examples/            # Usage examples
```

## Code Style

We use ESLint and Prettier for code formatting. Please run:

```bash
npm run lint:fix
npm run format
```

## Testing

- Write tests for new features
- Ensure existing tests pass
- Include both unit and integration tests
- Use the framework's own DSL for integration tests

### Test Structure

```
tests/
├── unit/          # Unit tests for individual components
├── integration/   # Integration tests using the full framework
└── fixtures/      # Test data and mock servers
```

## Commit Messages

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Maintenance tasks

Example:
```
feat: add OAuth2 authentication provider
fix: resolve variable resolution in nested objects
docs: update API documentation for new endpoints
```

## Issue Reporting

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/ersinghrajkr/Restified/issues).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists or is planned
2. Open an issue with the `feature request` label
3. Provide a clear description of the problem you're trying to solve
4. Include examples of how you'd like to use the feature

## Areas for Contribution

We're particularly interested in contributions for:

- **New Authentication Methods**: SAML, JWT verification, custom auth
- **Database Integrations**: MongoDB, PostgreSQL, Redis connectors
- **Performance Testing**: K6 integration improvements
- **Security Testing**: OWASP ZAP integration
- **Reporting**: New report formats and visualizations
- **Documentation**: API docs, tutorials, examples
- **CLI Enhancements**: New commands and generators

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Getting Help

- 📖 [Documentation](README.md)
- 💬 [Discussions](https://github.com/ersinghrajkr/Restified/discussions)
- 🐛 [Issues](https://github.com/ersinghrajkr/Restified/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes for significant contributions
- GitHub contributors page

Thank you for contributing to Restified! 🚀