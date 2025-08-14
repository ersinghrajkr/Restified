# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure and core framework implementation
- Fluent DSL with `given().when().then()` pattern
- HTTP client with Axios integration and retry logic
- Authentication providers (Bearer, Basic, API Key, OAuth2)
- Variable management system (global, local, extracted, environment)
- Response storage and history management
- Configuration system with multi-environment support
- CLI tools for project initialization and test running
- TypeScript support with strict type checking
- Comprehensive type definitions for all APIs

### Core Features
- **DSL Components**
  - `GivenStep`: Test setup with headers, auth, variables, timeouts
  - `WhenStep`: HTTP request execution (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
  - `ThenStep`: Response assertions with JSONPath, schema validation, custom assertions

- **Authentication System**
  - Bearer token authentication
  - Basic authentication with credential encoding
  - API key authentication (header/query parameter)
  - OAuth2 authentication with client credentials and refresh token flows

- **Variable System**
  - Global variables shared across tests
  - Local variables scoped to test suites
  - Environment variable integration
  - Variable extraction from responses
  - Template variable resolution with `{{variable}}` syntax

- **Configuration Management**
  - Multi-environment configuration loading
  - `.env` file support with hierarchical loading
  - Client configuration for multi-service testing
  - Global hooks for setup/teardown operations

- **CLI Tools**
  - `restifiedts init` - Interactive project scaffolding
  - `restifiedts test` - Test runner with reporting options
  - `restifiedts generate` - Template generation
  - `restifiedts config` - Configuration management

### Technical Implementation
- TypeScript-first architecture with comprehensive type safety
- Modular design with clean separation of concerns
- Axios-based HTTP client with interceptors and retry logic
- AJV schema validation for response verification
- JSONPath support for data extraction and assertions
- Factory pattern for authentication providers
- Singleton pattern for configuration management

## [1.0.0] - TBD

### Added
- Initial public release
- Core API testing framework
- CLI tools and project scaffolding
- Comprehensive documentation

---

## Types of changes

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.