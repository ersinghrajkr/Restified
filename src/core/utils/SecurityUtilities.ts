import { UtilityFunction } from './UtilityTypes';
import * as crypto from 'crypto';

export class CryptographicUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('md5', {
      name: 'md5',
      description: 'Generates MD5 hash of input string',
      category: 'crypto',
      execute: (input: string) => {
        return crypto.createHash('md5').update(input).digest('hex');
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'String to hash' }
      ]
    });

    functions.set('sha1', {
      name: 'sha1',
      description: 'Generates SHA1 hash of input string',
      category: 'crypto',
      execute: (input: string) => {
        return crypto.createHash('sha1').update(input).digest('hex');
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'String to hash' }
      ]
    });

    functions.set('sha256', {
      name: 'sha256',
      description: 'Generates SHA256 hash of input string',
      category: 'crypto',
      execute: (input: string) => {
        return crypto.createHash('sha256').update(input).digest('hex');
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'String to hash' }
      ]
    });

    functions.set('sha512', {
      name: 'sha512',
      description: 'Generates SHA512 hash of input string',
      category: 'crypto',
      execute: (input: string) => {
        return crypto.createHash('sha512').update(input).digest('hex');
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'String to hash' }
      ]
    });

    functions.set('hmacSha256', {
      name: 'hmacSha256',
      description: 'Generates HMAC-SHA256 signature',
      category: 'crypto',
      execute: (data: string, secret: string, encoding: 'hex' | 'base64' = 'hex') => {
        return crypto.createHmac('sha256', secret).update(data).digest(encoding);
      },
      parameters: [
        { name: 'data', type: 'string', required: true, description: 'Data to sign' },
        { name: 'secret', type: 'string', required: true, description: 'Secret key' },
        { name: 'encoding', type: 'string', required: false, defaultValue: 'hex', description: 'Output encoding (hex or base64)' }
      ]
    });

    functions.set('hmacSha512', {
      name: 'hmacSha512',
      description: 'Generates HMAC-SHA512 signature',
      category: 'crypto',
      execute: (data: string, secret: string, encoding: 'hex' | 'base64' = 'hex') => {
        return crypto.createHmac('sha512', secret).update(data).digest(encoding);
      },
      parameters: [
        { name: 'data', type: 'string', required: true, description: 'Data to sign' },
        { name: 'secret', type: 'string', required: true, description: 'Secret key' },
        { name: 'encoding', type: 'string', required: false, defaultValue: 'hex', description: 'Output encoding (hex or base64)' }
      ]
    });

    functions.set('pbkdf2', {
      name: 'pbkdf2',
      description: 'Generates PBKDF2 hash for password storage',
      category: 'crypto',
      execute: (password: string, salt?: string, iterations: number = 10000, keyLength: number = 64) => {
        const actualSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, actualSalt, iterations, keyLength, 'sha512').toString('hex');
        return {
          hash,
          salt: actualSalt,
          iterations,
          keyLength
        };
      },
      parameters: [
        { name: 'password', type: 'string', required: true, description: 'Password to hash' },
        { name: 'salt', type: 'string', required: false, description: 'Salt (auto-generated if not provided)' },
        { name: 'iterations', type: 'number', required: false, defaultValue: 10000, description: 'Number of iterations' },
        { name: 'keyLength', type: 'number', required: false, defaultValue: 64, description: 'Key length in bytes' }
      ]
    });

    functions.set('verifyPbkdf2', {
      name: 'verifyPbkdf2',
      description: 'Verifies password against PBKDF2 hash',
      category: 'crypto',
      execute: (password: string, hash: string, salt: string, iterations: number = 10000, keyLength: number = 64) => {
        const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha512').toString('hex');
        return derivedKey === hash;
      },
      parameters: [
        { name: 'password', type: 'string', required: true, description: 'Password to verify' },
        { name: 'hash', type: 'string', required: true, description: 'Stored hash' },
        { name: 'salt', type: 'string', required: true, description: 'Salt used for hashing' },
        { name: 'iterations', type: 'number', required: false, defaultValue: 10000, description: 'Number of iterations' },
        { name: 'keyLength', type: 'number', required: false, defaultValue: 64, description: 'Key length in bytes' }
      ]
    });

    functions.set('encrypt', {
      name: 'encrypt',
      description: 'Encrypts text using AES-256-GCM',
      category: 'crypto',
      execute: (text: string, password: string) => {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(password, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
          encrypted,
          iv: iv.toString('hex'),
          tag: cipher.getAuthTag?.()?.toString('hex') || ''
        };
      },
      parameters: [
        { name: 'text', type: 'string', required: true, description: 'Text to encrypt' },
        { name: 'password', type: 'string', required: true, description: 'Encryption password' }
      ]
    });

    functions.set('decrypt', {
      name: 'decrypt',
      description: 'Decrypts text using AES-256-GCM',
      category: 'crypto',
      execute: (encryptedData: any, password: string) => {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(password, 'salt', 32);
        const decipher = crypto.createDecipher(algorithm, key);
        
        if (encryptedData.tag) {
          decipher.setAuthTag?.(Buffer.from(encryptedData.tag, 'hex'));
        }
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
      },
      parameters: [
        { name: 'encryptedData', type: 'object', required: true, description: 'Encrypted data object from encrypt function' },
        { name: 'password', type: 'string', required: true, description: 'Decryption password' }
      ]
    });

    functions.set('randomBytes', {
      name: 'randomBytes',
      description: 'Generates cryptographically secure random bytes',
      category: 'crypto',
      execute: (size: number, encoding: 'hex' | 'base64' | 'binary' = 'hex') => {
        return crypto.randomBytes(size).toString(encoding);
      },
      parameters: [
        { name: 'size', type: 'number', required: true, description: 'Number of bytes to generate' },
        { name: 'encoding', type: 'string', required: false, defaultValue: 'hex', description: 'Output encoding' }
      ]
    });

    functions.set('generateKeyPair', {
      name: 'generateKeyPair',
      description: 'Generates RSA key pair',
      category: 'crypto',
      execute: (keySize: number = 2048) => {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
          modulusLength: keySize,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });
        
        return { publicKey, privateKey };
      },
      parameters: [
        { name: 'keySize', type: 'number', required: false, defaultValue: 2048, description: 'Key size in bits' }
      ]
    });

    functions.set('signRSA', {
      name: 'signRSA',
      description: 'Signs data with RSA private key',
      category: 'crypto',
      execute: (data: string, privateKey: string, algorithm: string = 'sha256') => {
        const sign = crypto.createSign(algorithm);
        sign.update(data);
        return sign.sign(privateKey, 'base64');
      },
      parameters: [
        { name: 'data', type: 'string', required: true, description: 'Data to sign' },
        { name: 'privateKey', type: 'string', required: true, description: 'RSA private key in PEM format' },
        { name: 'algorithm', type: 'string', required: false, defaultValue: 'sha256', description: 'Signing algorithm' }
      ]
    });

    functions.set('verifyRSA', {
      name: 'verifyRSA',
      description: 'Verifies RSA signature',
      category: 'crypto',
      execute: (data: string, signature: string, publicKey: string, algorithm: string = 'sha256') => {
        const verify = crypto.createVerify(algorithm);
        verify.update(data);
        return verify.verify(publicKey, signature, 'base64');
      },
      parameters: [
        { name: 'data', type: 'string', required: true, description: 'Original data' },
        { name: 'signature', type: 'string', required: true, description: 'Base64 signature' },
        { name: 'publicKey', type: 'string', required: true, description: 'RSA public key in PEM format' },
        { name: 'algorithm', type: 'string', required: false, defaultValue: 'sha256', description: 'Signing algorithm' }
      ]
    });

    return functions;
  }
}

export class SecurityUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('generateJWT', {
      name: 'generateJWT',
      description: 'Generates a simple JWT token (basic implementation)',
      category: 'security',
      execute: (payload: any, secret: string, expiresIn: number = 3600) => {
        const header = {
          alg: 'HS256',
          typ: 'JWT'
        };
        
        const now = Math.floor(Date.now() / 1000);
        const claims = {
          ...payload,
          iat: now,
          exp: now + expiresIn
        };
        
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url');
        const signature = crypto.createHmac('sha256', secret)
          .update(`${encodedHeader}.${encodedPayload}`)
          .digest('base64url');
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
      },
      parameters: [
        { name: 'payload', type: 'object', required: true, description: 'JWT payload claims' },
        { name: 'secret', type: 'string', required: true, description: 'Signing secret' },
        { name: 'expiresIn', type: 'number', required: false, defaultValue: 3600, description: 'Expiration time in seconds' }
      ]
    });

    functions.set('verifyJWT', {
      name: 'verifyJWT',
      description: 'Verifies and decodes JWT token (basic implementation)',
      category: 'security',
      execute: (token: string, secret: string) => {
        try {
          const parts = token.split('.');
          if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
          }
          
          const [encodedHeader, encodedPayload, signature] = parts;
          
          // Verify signature
          const expectedSignature = crypto.createHmac('sha256', secret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');
          
          if (signature !== expectedSignature) {
            throw new Error('Invalid JWT signature');
          }
          
          // Decode payload
          const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
          
          // Check expiration
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            throw new Error('JWT token expired');
          }
          
          return {
            valid: true,
            payload,
            header: JSON.parse(Buffer.from(encodedHeader, 'base64url').toString())
          };
        } catch (error: any) {
          return {
            valid: false,
            error: error.message
          };
        }
      },
      parameters: [
        { name: 'token', type: 'string', required: true, description: 'JWT token to verify' },
        { name: 'secret', type: 'string', required: true, description: 'Signing secret' }
      ]
    });

    functions.set('generateApiKey', {
      name: 'generateApiKey',
      description: 'Generates secure API key',
      category: 'security',
      execute: (length: number = 32, prefix?: string) => {
        const key = crypto.randomBytes(length).toString('hex');
        return prefix ? `${prefix}_${key}` : key;
      },
      parameters: [
        { name: 'length', type: 'number', required: false, defaultValue: 32, description: 'Key length in bytes' },
        { name: 'prefix', type: 'string', required: false, description: 'Optional key prefix' }
      ]
    });

    functions.set('maskSensitiveData', {
      name: 'maskSensitiveData',
      description: 'Masks sensitive data for logging/display',
      category: 'security',
      execute: (data: string, visibleChars: number = 4, maskChar: string = '*') => {
        if (!data || data.length <= visibleChars) {
          return maskChar.repeat(data?.length || 8);
        }
        
        const visible = data.slice(-visibleChars);
        const masked = maskChar.repeat(data.length - visibleChars);
        return masked + visible;
      },
      parameters: [
        { name: 'data', type: 'string', required: true, description: 'Sensitive data to mask' },
        { name: 'visibleChars', type: 'number', required: false, defaultValue: 4, description: 'Number of characters to show' },
        { name: 'maskChar', type: 'string', required: false, defaultValue: '*', description: 'Masking character' }
      ]
    });

    functions.set('sanitizeInput', {
      name: 'sanitizeInput',
      description: 'Sanitizes input to prevent basic injection attacks',
      category: 'security',
      execute: (input: string, allowHtml: boolean = false) => {
        if (!input) return '';
        
        let sanitized = input.trim();
        
        // Remove null bytes
        sanitized = sanitized.replace(/\0/g, '');
        
        // Basic SQL injection prevention
        sanitized = sanitized.replace(/['";\\]/g, '');
        
        // Basic XSS prevention
        if (!allowHtml) {
          sanitized = sanitized
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        }
        
        return sanitized;
      },
      parameters: [
        { name: 'input', type: 'string', required: true, description: 'Input to sanitize' },
        { name: 'allowHtml', type: 'boolean', required: false, defaultValue: false, description: 'Allow HTML tags' }
      ]
    });

    functions.set('generateCSRFToken', {
      name: 'generateCSRFToken',
      description: 'Generates CSRF token',
      category: 'security',
      execute: () => {
        return crypto.randomBytes(32).toString('hex');
      },
      parameters: []
    });

    functions.set('generateSecurePassword', {
      name: 'generateSecurePassword',
      description: 'Generates cryptographically secure password',
      category: 'security',
      execute: (length: number = 16, includeSymbols: boolean = true) => {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let chars = uppercase + lowercase + numbers;
        if (includeSymbols) {
          chars += symbols;
        }
        
        let password = '';
        
        // Ensure at least one character from each category
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        
        if (includeSymbols) {
          password += symbols[Math.floor(Math.random() * symbols.length)];
        }
        
        // Fill the rest randomly
        for (let i = password.length; i < length; i++) {
          password += chars[Math.floor(Math.random() * chars.length)];
        }
        
        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
      },
      parameters: [
        { name: 'length', type: 'number', required: false, defaultValue: 16, description: 'Password length' },
        { name: 'includeSymbols', type: 'boolean', required: false, defaultValue: true, description: 'Include special symbols' }
      ]
    });

    return functions;
  }
}