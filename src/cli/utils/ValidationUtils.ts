/**
 * Validation and Sanitization Utilities
 * 
 * Provides secure input validation and path sanitization for CLI operations
 */

import * as path from 'path';
import * as fs from 'fs';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ValidationUtils {
  /**
   * Sanitize and validate project name
   */
  static validateProjectName(name: string): string {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Project name is required', 'projectName');
    }

    const sanitized = name.trim();
    
    if (sanitized.length === 0) {
      throw new ValidationError('Project name cannot be empty', 'projectName');
    }

    if (sanitized.length > 100) {
      throw new ValidationError('Project name cannot exceed 100 characters', 'projectName');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(sanitized)) {
      throw new ValidationError('Project name contains invalid characters', 'projectName');
    }

    // Check for path traversal attempts
    const pathTraversalPattern = /\.\.[\\/]|[\\/]\.\./;
    if (pathTraversalPattern.test(sanitized)) {
      throw new ValidationError('Project name cannot contain path traversal sequences', 'projectName');
    }

    // Check for reserved names (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reservedNames.test(sanitized)) {
      throw new ValidationError('Project name cannot be a reserved system name', 'projectName');
    }

    // Check for leading/trailing periods or spaces
    if (sanitized.startsWith('.') || sanitized.endsWith('.') || 
        sanitized.startsWith(' ') || sanitized.endsWith(' ')) {
      throw new ValidationError('Project name cannot start or end with dots or spaces', 'projectName');
    }

    return sanitized;
  }

  /**
   * Validate and create safe project path
   */
  static createSafeProjectPath(baseDir: string, projectName: string): string {
    const sanitizedName = this.validateProjectName(projectName);
    const projectPath = path.resolve(baseDir, sanitizedName);
    
    // Ensure the project path is within the base directory
    if (!projectPath.startsWith(path.resolve(baseDir))) {
      throw new ValidationError('Project path must be within the current directory', 'projectPath');
    }

    return projectPath;
  }

  /**
   * Validate URL format
   */
  static validateUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      throw new ValidationError('URL is required', 'url');
    }

    const sanitized = url.trim();
    
    try {
      const urlObj = new URL(sanitized);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new ValidationError('URL must use http or https protocol', 'url');
      }

      return sanitized;
    } catch (error) {
      throw new ValidationError('Invalid URL format', 'url');
    }
  }

  /**
   * Validate file path for safety
   */
  static validateFilePath(filePath: string, baseDir?: string): string {
    if (!filePath || typeof filePath !== 'string') {
      throw new ValidationError('File path is required', 'filePath');
    }

    const sanitized = path.normalize(filePath);
    
    // Check for path traversal
    if (sanitized.includes('..')) {
      throw new ValidationError('File path cannot contain parent directory references', 'filePath');
    }

    // If baseDir provided, ensure path is within it
    if (baseDir) {
      const resolvedPath = path.resolve(baseDir, sanitized);
      if (!resolvedPath.startsWith(path.resolve(baseDir))) {
        throw new ValidationError('File path must be within the base directory', 'filePath');
      }
      return resolvedPath;
    }

    return sanitized;
  }

  /**
   * Validate test pattern for mocha
   */
  static validateTestPattern(pattern: string): string {
    if (!pattern || typeof pattern !== 'string') {
      throw new ValidationError('Test pattern is required', 'pattern');
    }

    const sanitized = pattern.trim();
    
    // Check for command injection attempts
    const dangerousChars = /[;&|`$(){}[\]]/;
    if (dangerousChars.test(sanitized)) {
      throw new ValidationError('Test pattern contains potentially dangerous characters', 'pattern');
    }

    // Ensure it's a valid glob pattern for test files
    if (!sanitized.includes('*') && !sanitized.endsWith('.ts') && !sanitized.endsWith('.js')) {
      throw new ValidationError('Test pattern must be a valid glob pattern or file extension', 'pattern');
    }

    return sanitized;
  }

  /**
   * Validate reporter name
   */
  static validateReporter(reporter: string): string {
    if (!reporter || typeof reporter !== 'string') {
      throw new ValidationError('Reporter is required', 'reporter');
    }

    const sanitized = reporter.trim();
    
    // Allow only alphanumeric characters, hyphens, and underscores
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(sanitized)) {
      throw new ValidationError('Reporter name can only contain letters, numbers, hyphens, and underscores', 'reporter');
    }

    // Check against known safe reporters
    const safeReporters = [
      'spec', 'json', 'html', 'tap', 'landing', 'dot', 'nyan', 'progress',
      'min', 'json-stream', 'markdown', 'xunit', 'mochawesome'
    ];

    if (!safeReporters.includes(sanitized)) {
      throw new ValidationError(`Reporter '${sanitized}' is not in the list of safe reporters`, 'reporter');
    }

    return sanitized;
  }

  /**
   * Validate timeout value
   */
  static validateTimeout(timeout: string | number): number {
    let timeoutNum: number;

    if (typeof timeout === 'string') {
      timeoutNum = parseInt(timeout, 10);
      if (isNaN(timeoutNum)) {
        throw new ValidationError('Timeout must be a valid number', 'timeout');
      }
    } else if (typeof timeout === 'number') {
      timeoutNum = timeout;
    } else {
      throw new ValidationError('Timeout must be a number', 'timeout');
    }

    if (timeoutNum < 1000) {
      throw new ValidationError('Timeout must be at least 1000ms', 'timeout');
    }

    if (timeoutNum > 600000) { // 10 minutes max
      throw new ValidationError('Timeout cannot exceed 600000ms (10 minutes)', 'timeout');
    }

    return timeoutNum;
  }

  /**
   * Check if directory exists and is writable
   */
  static async validateDirectoryAccess(dirPath: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(dirPath);
      if (!stats.isDirectory()) {
        throw new ValidationError(`Path is not a directory: ${dirPath}`, 'directory');
      }

      // Try to create a test file to verify write access
      const testFile = path.join(dirPath, '.write-test');
      await fs.promises.writeFile(testFile, '');
      await fs.promises.unlink(testFile);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new ValidationError(`Directory does not exist: ${dirPath}`, 'directory');
      } else if (error.code === 'EACCES' || error.code === 'EPERM') {
        throw new ValidationError(`No write permission for directory: ${dirPath}`, 'directory');
      } else if (error instanceof ValidationError) {
        throw error;
      } else {
        throw new ValidationError(`Cannot access directory: ${dirPath}`, 'directory');
      }
    }
  }

  /**
   * Sanitize environment variable value
   */
  static sanitizeEnvValue(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters but preserve normal punctuation
    return value.replace(/[`$();|&]/g, '');
  }
}