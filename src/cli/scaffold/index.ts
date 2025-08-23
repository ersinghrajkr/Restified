/**
 * Scaffold Module Exports
 * 
 * Centralized exports for the new CLI scaffold architecture
 */

// Core components
export { ScaffoldConfig } from '../core/ScaffoldConfig';
export { ScaffoldOrchestrator } from '../core/ScaffoldOrchestrator';
export { TemplateEngine } from '../core/TemplateEngine';
export { FileSystemManager } from '../core/FileSystemManager';

// Base classes
export { BaseGenerator } from '../generators/BaseGenerator';

// Concrete generators
export { ConfigGenerator } from '../generators/ConfigGenerator';

// Types
export * from '../types/ScaffoldTypes';

// Commands
export { scaffoldCommand } from '../commands/scaffold';