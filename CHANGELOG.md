# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.4] - 2025-08-21

### Fixed
- **HTML Report Generation**: Fixed RestifiedHtmlReporter to properly capture request/response data, assertions, and error stack traces
- **Scaffold BaseURL Issue**: Fixed scaffold command `-u` parameter to properly apply baseURL to all generated configuration files and .env templates
- **ConfigLoader Integration**: Fixed missing `findConfigFile` method in generated ConfigLoader causing TypeScript compilation errors
- **Mocha Reporter Compatibility**: Enhanced RestifiedHtmlReporter with proper Mocha event integration while maintaining backward compatibility

### Enhanced
- **Rich HTML Reports**: Reports now include complete request/response details, assertion breakdowns, and error information (3.4x more data)
- **GraphQL/WebSocket URL Configuration**: Scaffold command now properly configures GraphQL and WebSocket endpoints based on provided baseURL
- **Environment Variable Templates**: Generated .env files now reflect the provided API endpoints across all service configurations

## [2.0.3] - 2025-08-21

### Added
- **Production-Ready HTML Reporting**: Enhanced RestifiedHtmlReporter with enterprise-grade features
- **Interactive Report UI**: Clickable test items, expandable sections, and status filtering
- **Comprehensive Test Data**: Complete request/response capture with assertions and error details

## [2.0.2] - 2025-08-17

### Added
- **Enhanced CLI Commands**: New `scaffold` command replaces `create-test` with improved usability
- **Smart Directory Management**: Project name automatically creates appropriately named folders
- **Enterprise ConfigLoader**: Advanced configuration management with validation and smart defaults
- **Comprehensive Environment Variables**: 50+ new environment variables for complete framework customization
- **Enhanced Authentication**: Support for enterprise authentication modes, compliance levels, and security configurations
- **Improved Type Definitions**: Added missing TypeScript interfaces for GraphQL, WebSocket, and fixtures configurations

### Changed
- **BREAKING**: `create-test` command renamed to `scaffold` for better clarity
- **Enhanced**: ConfigLoader now includes enterprise-grade features with validation and fallbacks
- **Updated**: Environment template includes all framework-supported variables
- **Improved**: Reporter wrapper now uses direct exports for better npm package compatibility

### Fixed
- **CLI Generation**: Fixed TypeScript compilation errors in generated projects
- **Package Dependencies**: Resolved npm package import issues for end users
- **Reporter Integration**: Fixed RestifiedHtmlReporter export and import paths
- **Configuration Validation**: Added proper TypeScript interface validation for all config options

## [2.0.1] - 2025-08-16

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