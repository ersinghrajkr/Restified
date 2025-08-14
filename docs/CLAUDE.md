# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository is in the initial planning phase for **Restified** - a production-grade TypeScript API testing framework with fluent DSL, complete scaffolding, and optional performance/security modules. Currently contains comprehensive specifications and roadmap documentation.

## Project Vision and Architecture

### Core Framework Goals
- TypeScript-first API testing framework with fluent `given().when().then()` DSL
- Support for REST, GraphQL, and WebSocket testing
- Multi-service testing capabilities with centralized configuration
- Production-ready scaffolding via CLI tools

### Planned Architecture Layers

**DSL Layer**: Fluent interface for test authoring
- `given()` - Test setup (headers, auth, variables, timeouts)
- `when()` - HTTP request execution  
- `then()` - Response assertions and data extraction

**Configuration System**: 
- Centralized `restified.config.ts` for multi-environment support
- Environment variable loading (`.env`, `.env.local`)
- Multi-project awareness for testing different services

**Integration Features**:
- Authentication: Bearer, Basic, API Key, OAuth2
- Schema validation: Joi, Zod, AJV
- Database state validation (SQL/NoSQL)
- Dynamic payloads with Faker.js integration

**Advanced Capabilities**:
- Global setup/teardown hooks
- Request/response lifecycle hooks
- Variable sharing across test suites
- Parallel and batch execution

## Planned Development Stages

### Stage 1: Core Framework
- TypeScript build system (Nx/Turborepo consideration)
- ESM + CJS output support
- Basic CLI (`restifiedts`) for running tests and initialization
- Mocha integration as default test runner

### Stage 2: CLI Generator & Scaffolding
- `npx restified init my-api-tests` command
- Complete project scaffolding with working examples
- Pre-configured NPM scripts and TypeScript configs
- Sample test suites demonstrating all features

### Stage 3: Reporting & Analytics
- Mochawesome integration with zero configuration
- Interactive HTML reports with expand/collapse UI
- Request/response payload capture
- Performance metrics and flow tracking

### Stage 4-7: Advanced Features
- Role-based testing and endpoint discovery
- Database integration and state validation
- Performance testing module (K6 TypeScript integration)
- Security testing module (OWASP ZAP integration)

## Planned CLI Commands

### Primary Commands
```bash
npx restified init my-api-tests    # Interactive project scaffolding
restifiedts test                   # Run test suites
restifiedts test:report           # Generate HTML/JSON reports
restifiedts config-init           # Interactive configuration setup
```

### Environment-specific Testing
```bash
npm run test:env:staging          # Run tests against staging
npm run test:env:prod            # Run tests against production
```

## Generated Project Structure (Planned)

```
my-api-tests/
├── restified.config.ts       # Central configuration
├── .env / .env.local        # Environment variables
├── src/
│   ├── hooks/               # Global and lifecycle hooks
│   ├── tests/               # Test suites with numbered execution order
│   ├── utils/               # Database clients and data generators
│   └── types/               # TypeScript definitions
├── reports/                 # Generated HTML/JSON reports
└── package.json            # Pre-configured scripts and dependencies
```

## Key Design Principles

### Variable Management System
- **Global variables**: Shared across all test suites
- **Local variables**: Suite-specific storage
- **Environment variables**: From `.env` files and system
- **Dynamic payloads**: Faker.js integration with template syntax

### Multi-Client Architecture
Support for testing multiple services:
```typescript
restified.config({
  clients: {
    authService: { baseURL: 'https://auth.example.com' },
    userService: { baseURL: 'https://users.example.com' }
  }
});
```

### Test Lifecycle Integration
- Global setup/teardown for data preparation
- Request/response hooks for logging and mutation
- Automatic capture for reporting without manual instrumentation

## TypeScript Configuration Approach
- Strict TypeScript settings with explicit return types
- Path mapping for clean imports (`@tests/*`, `@hooks/*`, `@utils/*`)
- Dual configs: production build and test execution
- Support for experimental decorators and ESNext features

## Development Guidelines for Implementation

### When Building Core Framework
1. Follow layered architecture (DSL → Service → Data → Infrastructure)
2. Implement comprehensive error handling with custom error types
3. Use async/await patterns throughout
4. Include TypeScript types for all public APIs
5. Design for extensibility and plugin architecture

### Testing Strategy for Framework Development
- Use Mocha with ts-node for development testing
- Create integration tests using the framework's own DSL
- Mock external dependencies in unit tests
- Include cleanup patterns to prevent hanging processes

### Code Organization Patterns
- Separate concerns between DSL, HTTP clients, and storage systems  
- Use dependency injection for testability
- Implement proper interface segregation
- Follow single responsibility principle for each class/module

## Integration Requirements

### Test Runner Integration
- Primary support for Mocha with automatic request/response capture
- Reporter integration (Mochawesome) without configuration
- Support for test tagging and categorization
- Parallel execution capabilities

### Database Integration Support
- Generic database client management
- Before/after state validation patterns
- Transaction isolation for test independence
- Support for both SQL and NoSQL databases

### Performance Testing Integration
- K6 TypeScript execution (v0.52+)
- Artillery as fallback option
- Multiple load testing scenarios (smoke, load, stress, spike, soak)
- Performance metrics collection and reporting

## Security Considerations
- No hardcoded credentials or API keys
- Support for secure credential management
- HTTPS enforcement validation
- Integration with security scanning tools (OWASP ZAP)

## Current Status
Repository is in documentation/planning phase. Implementation should begin with:
1. Project structure setup (package.json, TypeScript config)
2. Core DSL interface definitions
3. Basic HTTP client implementation
4. Simple configuration system
5. Initial test runner integration

## Important Notes
- This framework aims to compete with RestAssured (Java) but for TypeScript/Node.js
- Emphasis on zero-configuration experience after scaffolding
- Must support enterprise features like multi-service testing and role-based access
- CLI tooling is crucial for adoption - should generate working projects immediately