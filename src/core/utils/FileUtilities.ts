import { UtilityFunction } from './UtilityTypes';
import * as fs from 'fs';
import * as path from 'path';

export class FileUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('readFile', {
      name: 'readFile',
      description: 'Reads file content as string',
      category: 'file',
      isAsync: true,
      execute: async (filePath: string, encoding: BufferEncoding = 'utf8') => {
        try {
          return await fs.promises.readFile(filePath, encoding);
        } catch (error: any) {
          throw new Error(`Failed to read file: ${error.message}`);
        }
      },
      parameters: [
        { name: 'filePath', type: 'string', required: true, description: 'Path to the file' },
        { name: 'encoding', type: 'string', required: false, defaultValue: 'utf8', description: 'File encoding' }
      ]
    });

    functions.set('writeFile', {
      name: 'writeFile',
      description: 'Writes content to file',
      category: 'file',
      isAsync: true,
      execute: async (filePath: string, content: string, encoding: BufferEncoding = 'utf8') => {
        try {
          // Ensure directory exists
          const dir = path.dirname(filePath);
          await fs.promises.mkdir(dir, { recursive: true });
          
          await fs.promises.writeFile(filePath, content, encoding);
          return { success: true, path: filePath };
        } catch (error: any) {
          throw new Error(`Failed to write file: ${error.message}`);
        }
      },
      parameters: [
        { name: 'filePath', type: 'string', required: true, description: 'Path to the file' },
        { name: 'content', type: 'string', required: true, description: 'Content to write' },
        { name: 'encoding', type: 'string', required: false, defaultValue: 'utf8', description: 'File encoding' }
      ]
    });

    functions.set('appendFile', {
      name: 'appendFile',
      description: 'Appends content to file',
      category: 'file',
      isAsync: true,
      execute: async (filePath: string, content: string, encoding: BufferEncoding = 'utf8') => {
        try {
          await fs.promises.appendFile(filePath, content, encoding);
          return { success: true, path: filePath };
        } catch (error: any) {
          throw new Error(`Failed to append to file: ${error.message}`);
        }
      },
      parameters: [
        { name: 'filePath', type: 'string', required: true, description: 'Path to the file' },
        { name: 'content', type: 'string', required: true, description: 'Content to append' },
        { name: 'encoding', type: 'string', required: false, defaultValue: 'utf8', description: 'File encoding' }
      ]
    });

    functions.set('fileExists', {
      name: 'fileExists',
      description: 'Checks if file exists',
      category: 'file',
      execute: (filePath: string) => {
        try {
          return fs.existsSync(filePath);
        } catch {
          return false;
        }
      },
      parameters: [
        { name: 'filePath', type: 'string', required: true, description: 'Path to the file' }
      ]
    });

    functions.set('deleteFile', {
      name: 'deleteFile',
      description: 'Deletes a file',
      category: 'file',
      isAsync: true,
      execute: async (filePath: string) => {
        try {
          await fs.promises.unlink(filePath);
          return { success: true, path: filePath };
        } catch (error: any) {
          throw new Error(`Failed to delete file: ${error.message}`);
        }
      },
      parameters: [
        { name: 'filePath', type: 'string', required: true, description: 'Path to the file' }
      ]
    });

    functions.set('copyFile', {
      name: 'copyFile',
      description: 'Copies a file to destination',
      category: 'file',
      isAsync: true,
      execute: async (sourcePath: string, destPath: string) => {
        try {
          // Ensure destination directory exists
          const destDir = path.dirname(destPath);
          await fs.promises.mkdir(destDir, { recursive: true });
          
          await fs.promises.copyFile(sourcePath, destPath);
          return { success: true, source: sourcePath, destination: destPath };
        } catch (error: any) {
          throw new Error(`Failed to copy file: ${error.message}`);
        }
      },
      parameters: [
        { name: 'sourcePath', type: 'string', required: true, description: 'Source file path' },
        { name: 'destPath', type: 'string', required: true, description: 'Destination file path' }
      ]
    });

    functions.set('moveFile', {
      name: 'moveFile',
      description: 'Moves/renames a file',
      category: 'file',
      isAsync: true,
      execute: async (sourcePath: string, destPath: string) => {
        try {
          // Ensure destination directory exists
          const destDir = path.dirname(destPath);
          await fs.promises.mkdir(destDir, { recursive: true });
          
          await fs.promises.rename(sourcePath, destPath);
          return { success: true, source: sourcePath, destination: destPath };
        } catch (error: any) {
          throw new Error(`Failed to move file: ${error.message}`);
        }
      },
      parameters: [
        { name: 'sourcePath', type: 'string', required: true, description: 'Source file path' },
        { name: 'destPath', type: 'string', required: true, description: 'Destination file path' }
      ]
    });

    functions.set('getFileStats', {
      name: 'getFileStats',
      description: 'Gets file statistics (size, dates, etc.)',
      category: 'file',
      isAsync: true,
      execute: async (filePath: string) => {
        try {
          const stats = await fs.promises.stat(filePath);
          return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            permissions: stats.mode
          };
        } catch (error: any) {
          throw new Error(`Failed to get file stats: ${error.message}`);
        }
      },
      parameters: [
        { name: 'filePath', type: 'string', required: true, description: 'Path to the file' }
      ]
    });

    functions.set('listDirectory', {
      name: 'listDirectory',
      description: 'Lists files and directories in a directory',
      category: 'file',
      isAsync: true,
      execute: async (dirPath: string, includeHidden: boolean = false) => {
        try {
          const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
          
          return items
            .filter(item => includeHidden || !item.name.startsWith('.'))
            .map(item => ({
              name: item.name,
              type: item.isFile() ? 'file' : item.isDirectory() ? 'directory' : 'other',
              path: path.join(dirPath, item.name)
            }));
        } catch (error: any) {
          throw new Error(`Failed to list directory: ${error.message}`);
        }
      },
      parameters: [
        { name: 'dirPath', type: 'string', required: true, description: 'Directory path' },
        { name: 'includeHidden', type: 'boolean', required: false, defaultValue: false, description: 'Include hidden files' }
      ]
    });

    functions.set('createDirectory', {
      name: 'createDirectory',
      description: 'Creates directory (with parent directories if needed)',
      category: 'file',
      isAsync: true,
      execute: async (dirPath: string, recursive: boolean = true) => {
        try {
          await fs.promises.mkdir(dirPath, { recursive });
          return { success: true, path: dirPath };
        } catch (error: any) {
          throw new Error(`Failed to create directory: ${error.message}`);
        }
      },
      parameters: [
        { name: 'dirPath', type: 'string', required: true, description: 'Directory path' },
        { name: 'recursive', type: 'boolean', required: false, defaultValue: true, description: 'Create parent directories' }
      ]
    });

    functions.set('deleteDirectory', {
      name: 'deleteDirectory',
      description: 'Deletes directory and its contents',
      category: 'file',
      isAsync: true,
      execute: async (dirPath: string, recursive: boolean = false) => {
        try {
          await fs.promises.rmdir(dirPath, { recursive });
          return { success: true, path: dirPath };
        } catch (error: any) {
          throw new Error(`Failed to delete directory: ${error.message}`);
        }
      },
      parameters: [
        { name: 'dirPath', type: 'string', required: true, description: 'Directory path' },
        { name: 'recursive', type: 'boolean', required: false, defaultValue: false, description: 'Delete contents recursively' }
      ]
    });

    functions.set('searchFiles', {
      name: 'searchFiles',
      description: 'Searches for files matching pattern in directory',
      category: 'file',
      isAsync: true,
      execute: async (dirPath: string, pattern: string, recursive: boolean = false) => {
        const results: string[] = [];
        
        const searchRecursive = async (currentPath: string) => {
          try {
            const items = await fs.promises.readdir(currentPath, { withFileTypes: true });
            
            for (const item of items) {
              const fullPath = path.join(currentPath, item.name);
              
              if (item.isFile()) {
                // Check if file name matches pattern (simple glob-like matching)
                const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
                if (regex.test(item.name)) {
                  results.push(fullPath);
                }
              } else if (item.isDirectory() && recursive) {
                await searchRecursive(fullPath);
              }
            }
          } catch (error) {
            // Ignore access errors and continue
          }
        };
        
        await searchRecursive(dirPath);
        return results;
      },
      parameters: [
        { name: 'dirPath', type: 'string', required: true, description: 'Directory to search in' },
        { name: 'pattern', type: 'string', required: true, description: 'File name pattern (supports * and ?)' },
        { name: 'recursive', type: 'boolean', required: false, defaultValue: false, description: 'Search subdirectories' }
      ]
    });

    return functions;
  }
}

export class EncodingUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('base64Encode', {
      name: 'base64Encode',
      description: 'Encodes string to Base64',
      category: 'encoding',
      execute: (input: string) => {
        return Buffer.from(input, 'utf8').toString('base64');
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'String to encode' }
      ]
    });

    functions.set('base64Decode', {
      name: 'base64Decode',
      description: 'Decodes Base64 string',
      category: 'encoding',
      execute: (input: string) => {
        try {
          return Buffer.from(input, 'base64').toString('utf8');
        } catch (error: any) {
          throw new Error(`Invalid Base64 string: ${error.message}`);
        }
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'Base64 string to decode' }
      ]
    });

    functions.set('urlEncode', {
      name: 'urlEncode',
      description: 'URL encodes string',
      category: 'encoding',
      execute: (input: string) => {
        return encodeURIComponent(input);
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'String to URL encode' }
      ]
    });

    functions.set('urlDecode', {
      name: 'urlDecode',
      description: 'URL decodes string',
      category: 'encoding',
      execute: (input: string) => {
        try {
          return decodeURIComponent(input);
        } catch (error: any) {
          throw new Error(`Invalid URL encoded string: ${error.message}`);
        }
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'URL encoded string to decode' }
      ]
    });

    functions.set('hexEncode', {
      name: 'hexEncode',
      description: 'Encodes string to hexadecimal',
      category: 'encoding',
      execute: (input: string) => {
        return Buffer.from(input, 'utf8').toString('hex');
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'String to encode' }
      ]
    });

    functions.set('hexDecode', {
      name: 'hexDecode',
      description: 'Decodes hexadecimal string',
      category: 'encoding',
      execute: (input: string) => {
        try {
          return Buffer.from(input, 'hex').toString('utf8');
        } catch (error: any) {
          throw new Error(`Invalid hexadecimal string: ${error.message}`);
        }
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'Hexadecimal string to decode' }
      ]
    });

    functions.set('htmlEncode', {
      name: 'htmlEncode',
      description: 'HTML encodes string (escapes HTML entities)',
      category: 'encoding',
      execute: (input: string) => {
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'String to HTML encode' }
      ]
    });

    functions.set('htmlDecode', {
      name: 'htmlDecode',
      description: 'HTML decodes string (unescapes HTML entities)',
      category: 'encoding',
      execute: (input: string) => {
        return input
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/');
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'HTML encoded string to decode' }
      ]
    });

    functions.set('base32Encode', {
      name: 'base32Encode',
      description: 'Encodes string to Base32',
      category: 'encoding',
      execute: (input: string) => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const bytes = Buffer.from(input, 'utf8');
        let bits = '';
        
        // Convert bytes to binary string
        for (let i = 0; i < bytes.length; i++) {
          bits += bytes[i].toString(2).padStart(8, '0');
        }
        
        // Pad to multiple of 5
        while (bits.length % 5 !== 0) {
          bits += '0';
        }
        
        // Convert 5-bit groups to base32
        let result = '';
        for (let i = 0; i < bits.length; i += 5) {
          const chunk = bits.substr(i, 5);
          result += alphabet[parseInt(chunk, 2)];
        }
        
        // Add padding
        while (result.length % 8 !== 0) {
          result += '=';
        }
        
        return result;
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'String to encode' }
      ]
    });

    functions.set('base32Decode', {
      name: 'base32Decode',
      description: 'Decodes Base32 string',
      category: 'encoding',
      execute: (input: string) => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const cleanInput = input.replace(/=/g, '').toUpperCase();
        let bits = '';
        
        // Convert base32 to binary
        for (let i = 0; i < cleanInput.length; i++) {
          const index = alphabet.indexOf(cleanInput[i]);
          if (index === -1) {
            throw new Error(`Invalid Base32 character: ${cleanInput[i]}`);
          }
          bits += index.toString(2).padStart(5, '0');
        }
        
        // Convert binary to bytes
        const bytes: number[] = [];
        for (let i = 0; i < bits.length; i += 8) {
          if (i + 8 <= bits.length) {
            const byte = parseInt(bits.substr(i, 8), 2);
            bytes.push(byte);
          }
        }
        
        return Buffer.from(bytes).toString('utf8');
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'Base32 string to decode' }
      ]
    });

    return functions;
  }
}

export class NetworkUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('parseUrl', {
      name: 'parseUrl',
      description: 'Parses URL into components',
      category: 'network',
      execute: (url: string) => {
        try {
          const parsed = new URL(url);
          return {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port,
            pathname: parsed.pathname,
            search: parsed.search,
            hash: parsed.hash,
            origin: parsed.origin,
            href: parsed.href
          };
        } catch (error: any) {
          throw new Error(`Invalid URL: ${error.message}`);
        }
      },
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'URL to parse' }
      ]
    });

    functions.set('buildUrl', {
      name: 'buildUrl',
      description: 'Builds URL from components',
      category: 'network',
      execute: (base: string, params?: Record<string, any>) => {
        try {
          const url = new URL(base);
          
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
              }
            });
          }
          
          return url.toString();
        } catch (error: any) {
          throw new Error(`Failed to build URL: ${error.message}`);
        }
      },
      parameters: [
        { name: 'base', type: 'string', required: true, description: 'Base URL' },
        { name: 'params', type: 'object', required: false, description: 'Query parameters object' }
      ]
    });

    functions.set('extractDomain', {
      name: 'extractDomain',
      description: 'Extracts domain from URL',
      category: 'network',
      execute: (url: string) => {
        try {
          const parsed = new URL(url);
          return parsed.hostname;
        } catch (error: any) {
          throw new Error(`Invalid URL: ${error.message}`);
        }
      },
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'URL to extract domain from' }
      ]
    });

    functions.set('isValidIP', {
      name: 'isValidIP',
      description: 'Validates if string is a valid IP address',
      category: 'network',
      execute: (ip: string, version?: 4 | 6) => {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
        
        if (version === 4) {
          return ipv4Regex.test(ip);
        } else if (version === 6) {
          return ipv6Regex.test(ip);
        } else {
          return ipv4Regex.test(ip) || ipv6Regex.test(ip);
        }
      },
      parameters: [
        { name: 'ip', type: 'string', required: true, description: 'IP address to validate' },
        { name: 'version', type: 'number', required: false, description: 'IP version (4 or 6)' }
      ]
    });

    return functions;
  }
}