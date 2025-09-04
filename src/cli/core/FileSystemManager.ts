/**
 * File System Manager
 * 
 * Abstraction layer for file system operations with backup and rollback capabilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  FileOperation, 
  OperationResult,
  FileSystemError 
} from '../types/ScaffoldTypes';

export class FileSystemManager {
  private operations: FileOperation[] = [];
  private backupDir: string;

  constructor(private baseDir: string) {
    this.backupDir = path.join(baseDir, '.scaffold-backup');
  }

  /**
   * Queue a file operation
   */
  queueOperation(operation: FileOperation): void {
    this.operations.push(operation);
  }

  /**
   * Execute all queued operations
   */
  async executeOperations(): Promise<OperationResult[]> {
    const results: OperationResult[] = [];
    
    try {
      // Create backup directory if needed
      if (this.operations.some(op => op.backup)) {
        await this.ensureBackupDirectory();
      }

      for (const operation of this.operations) {
        const result = await this.executeOperation(operation);
        results.push(result);
        
        if (!result.success) {
          throw new FileSystemError(
            `Operation failed: ${result.message}`,
            { operation, result }
          );
        }
      }

      // Clean up backup directory if all operations succeeded
      await this.cleanupBackup();
      
      return results;
    } catch (error) {
      // Rollback on failure
      await this.rollback();
      throw error;
    }
  }

  /**
   * Execute a single file operation
   */
  private async executeOperation(operation: FileOperation): Promise<OperationResult> {
    try {
      switch (operation.type) {
        case 'create':
          return await this.createFile(operation);
        case 'update':
          return await this.updateFile(operation);
        case 'delete':
          return await this.deleteFile(operation);
        case 'copy':
          return await this.copyFile(operation);
        default:
          throw new Error(`Unknown operation type: ${(operation as any).type}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to ${operation.type} ${operation.destination}: ${(error as Error).message}`,
        data: { operation, error }
      };
    }
  }

  /**
   * Create a new file
   */
  private async createFile(operation: FileOperation): Promise<OperationResult> {
    const { destination, content, backup } = operation;
    const fullPath = path.resolve(this.baseDir, destination);

    // Check if file already exists
    if (fs.existsSync(fullPath)) {
      if (backup) {
        await this.backupFile(fullPath);
      } else {
        return {
          success: false,
          message: `File already exists: ${destination}`
        };
      }
    }

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, content || '', 'utf8');

    return {
      success: true,
      message: `Created file: ${destination}`,
      data: { path: fullPath }
    };
  }

  /**
   * Update an existing file
   */
  private async updateFile(operation: FileOperation): Promise<OperationResult> {
    const { destination, content, backup } = operation;
    const fullPath = path.resolve(this.baseDir, destination);

    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        message: `File does not exist: ${destination}`
      };
    }

    if (backup) {
      await this.backupFile(fullPath);
    }

    fs.writeFileSync(fullPath, content || '', 'utf8');

    return {
      success: true,
      message: `Updated file: ${destination}`,
      data: { path: fullPath }
    };
  }

  /**
   * Delete a file
   */
  private async deleteFile(operation: FileOperation): Promise<OperationResult> {
    const { destination, backup } = operation;
    const fullPath = path.resolve(this.baseDir, destination);

    if (!fs.existsSync(fullPath)) {
      return {
        success: true,
        message: `File already deleted: ${destination}`
      };
    }

    if (backup) {
      await this.backupFile(fullPath);
    }

    fs.unlinkSync(fullPath);

    return {
      success: true,
      message: `Deleted file: ${destination}`,
      data: { path: fullPath }
    };
  }

  /**
   * Copy a file
   */
  private async copyFile(operation: FileOperation): Promise<OperationResult> {
    const { source, destination, backup } = operation;
    
    if (!source) {
      return {
        success: false,
        message: 'Source path is required for copy operation'
      };
    }

    const sourcePath = path.resolve(source);
    const destPath = path.resolve(this.baseDir, destination);

    if (!fs.existsSync(sourcePath)) {
      return {
        success: false,
        message: `Source file does not exist: ${source}`
      };
    }

    // Check if destination exists
    if (fs.existsSync(destPath)) {
      if (backup) {
        await this.backupFile(destPath);
      } else {
        return {
          success: false,
          message: `Destination file already exists: ${destination}`
        };
      }
    }

    // Ensure directory exists
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, destPath);

    return {
      success: true,
      message: `Copied file from ${source} to ${destination}`,
      data: { sourcePath, destPath }
    };
  }

  /**
   * Backup a file before modification
   */
  private async backupFile(filePath: string): Promise<void> {
    const relativePath = path.relative(this.baseDir, filePath);
    const backupPath = path.join(this.backupDir, relativePath);
    
    // Ensure backup directory exists
    const backupDirPath = path.dirname(backupPath);
    if (!fs.existsSync(backupDirPath)) {
      fs.mkdirSync(backupDirPath, { recursive: true });
    }

    fs.copyFileSync(filePath, backupPath);
  }

  /**
   * Rollback all operations using backups
   */
  async rollback(): Promise<void> {
    if (!fs.existsSync(this.backupDir)) {
      return; // Nothing to rollback
    }

    try {
      // Restore backed up files
      const restoreFiles = (dir: string) => {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const backupPath = path.join(dir, item);
          const relativePath = path.relative(this.backupDir, backupPath);
          const originalPath = path.join(this.baseDir, relativePath);
          
          if (fs.statSync(backupPath).isDirectory()) {
            restoreFiles(backupPath);
          } else {
            // Ensure original directory exists
            const originalDir = path.dirname(originalPath);
            if (!fs.existsSync(originalDir)) {
              fs.mkdirSync(originalDir, { recursive: true });
            }
            
            fs.copyFileSync(backupPath, originalPath);
          }
        }
      };

      restoreFiles(this.backupDir);
    } finally {
      await this.cleanupBackup();
    }
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Clean up backup directory
   */
  private async cleanupBackup(): Promise<void> {
    if (fs.existsSync(this.backupDir)) {
      fs.rmSync(this.backupDir, { recursive: true, force: true });
    }
  }

  /**
   * Utility methods for common operations
   */
  static ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  static readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }

  static writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    FileSystemManager.ensureDirectory(dir);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  static deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  static deleteDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }
}