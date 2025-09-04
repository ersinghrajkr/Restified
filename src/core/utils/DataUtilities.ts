import { UtilityFunction } from './UtilityTypes';

export class DataTransformationUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('jsonParse', {
      name: 'jsonParse',
      description: 'Parses JSON string into object',
      category: 'data',
      execute: (jsonString: string) => {
        try {
          return JSON.parse(jsonString);
        } catch (error: any) {
          throw new Error(`Invalid JSON: ${error.message}`);
        }
      },
      parameters: [
        { name: 'jsonString', type: 'string', required: true, description: 'JSON string to parse' }
      ]
    });

    functions.set('jsonStringify', {
      name: 'jsonStringify',
      description: 'Converts object to JSON string',
      category: 'data',
      execute: (obj: any, pretty: boolean = false) => {
        try {
          return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
        } catch (error: any) {
          throw new Error(`Failed to stringify object: ${error.message}`);
        }
      },
      parameters: [
        { name: 'obj', type: 'any', required: true, description: 'Object to stringify' },
        { name: 'pretty', type: 'boolean', required: false, defaultValue: false, description: 'Pretty print JSON' }
      ]
    });

    functions.set('csvParse', {
      name: 'csvParse',
      description: 'Parses CSV string into array of objects',
      category: 'data',
      execute: (csvString: string, delimiter: string = ',', hasHeaders: boolean = true) => {
        const lines = csvString.trim().split('\n');
        if (lines.length === 0) return [];

        const headers = hasHeaders ? lines[0].split(delimiter).map(h => h.trim()) : null;
        const dataLines = hasHeaders ? lines.slice(1) : lines;

        return dataLines.map((line, index) => {
          const values = line.split(delimiter).map(v => v.trim());
          
          if (headers) {
            const obj: any = {};
            headers.forEach((header, i) => {
              obj[header] = values[i] || '';
            });
            return obj;
          } else {
            return values;
          }
        });
      },
      parameters: [
        { name: 'csvString', type: 'string', required: true, description: 'CSV string to parse' },
        { name: 'delimiter', type: 'string', required: false, defaultValue: ',', description: 'CSV delimiter' },
        { name: 'hasHeaders', type: 'boolean', required: false, defaultValue: true, description: 'First row contains headers' }
      ]
    });

    functions.set('csvStringify', {
      name: 'csvStringify',
      description: 'Converts array of objects to CSV string',
      category: 'data',
      execute: (data: any[], delimiter: string = ',', includeHeaders: boolean = true) => {
        if (!Array.isArray(data) || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvLines: string[] = [];

        if (includeHeaders) {
          csvLines.push(headers.join(delimiter));
        }

        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            // Escape values that contain delimiter or quotes
            if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvLines.push(values.join(delimiter));
        });

        return csvLines.join('\n');
      },
      parameters: [
        { name: 'data', type: 'array', required: true, description: 'Array of objects to convert' },
        { name: 'delimiter', type: 'string', required: false, defaultValue: ',', description: 'CSV delimiter' },
        { name: 'includeHeaders', type: 'boolean', required: false, defaultValue: true, description: 'Include headers in output' }
      ]
    });

    functions.set('xmlParse', {
      name: 'xmlParse',
      description: 'Basic XML parsing to JavaScript object (simple implementation)',
      category: 'data',
      execute: (xmlString: string) => {
        // Simple XML parser - for production use a proper XML library
        const parseXmlNode = (xml: string): any => {
          const result: any = {};
          
          // Remove XML declaration and root whitespace
          xml = xml.replace(/<\?xml[^>]*\?>/g, '').trim();
          
          // Find all elements
          const elementRegex = /<([^\/\s>]+)([^>]*)>(.*?)<\/\1>/gs;
          let match;
          
          while ((match = elementRegex.exec(xml)) !== null) {
            const tagName = match[1];
            const attributes = match[2];
            const content = match[3].trim();
            
            // Parse attributes
            const attrs: any = {};
            const attrRegex = /(\w+)=["']([^"']+)["']/g;
            let attrMatch;
            while ((attrMatch = attrRegex.exec(attributes)) !== null) {
              attrs[attrMatch[1]] = attrMatch[2];
            }
            
            // Check if content has nested elements
            if (content.includes('<')) {
              result[tagName] = {
                ...attrs,
                ...parseXmlNode(content)
              };
            } else {
              result[tagName] = Object.keys(attrs).length > 0 
                ? { ...attrs, _text: content }
                : content;
            }
          }
          
          return result;
        };
        
        try {
          return parseXmlNode(xmlString);
        } catch (error: any) {
          throw new Error(`XML parsing failed: ${error.message}`);
        }
      },
      parameters: [
        { name: 'xmlString', type: 'string', required: true, description: 'XML string to parse' }
      ]
    });

    functions.set('xmlStringify', {
      name: 'xmlStringify',
      description: 'Converts JavaScript object to XML string (simple implementation)',
      category: 'data',
      execute: (obj: any, rootElement: string = 'root', pretty: boolean = false) => {
        const indent = pretty ? '  ' : '';
        const newline = pretty ? '\n' : '';
        
        const objectToXml = (data: any, tagName: string, depth: number = 0): string => {
          const indentStr = indent.repeat(depth);
          const nextIndentStr = indent.repeat(depth + 1);
          
          if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
            return `${indentStr}<${tagName}>${data}</${tagName}>`;
          }
          
          if (Array.isArray(data)) {
            return data.map(item => objectToXml(item, tagName, depth)).join(newline);
          }
          
          if (typeof data === 'object' && data !== null) {
            const attrs: string[] = [];
            const elements: string[] = [];
            
            Object.entries(data).forEach(([key, value]) => {
              if (key.startsWith('_')) {
                // Treat as attribute (remove underscore)
                attrs.push(`${key.substring(1)}="${value}"`);
              } else if (key === '_text') {
                // Text content
                return;
              } else {
                elements.push(objectToXml(value, key, depth + 1));
              }
            });
            
            const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
            const textContent = data._text || '';
            
            if (elements.length > 0) {
              return `${indentStr}<${tagName}${attrStr}>${newline}${elements.join(newline)}${newline}${indentStr}</${tagName}>`;
            } else {
              return `${indentStr}<${tagName}${attrStr}>${textContent}</${tagName}>`;
            }
          }
          
          return '';
        };
        
        const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
        const content = objectToXml(obj, rootElement);
        
        return pretty 
          ? `${xmlDeclaration}\n${content}`
          : `${xmlDeclaration}${content}`;
      },
      parameters: [
        { name: 'obj', type: 'object', required: true, description: 'Object to convert to XML' },
        { name: 'rootElement', type: 'string', required: false, defaultValue: 'root', description: 'Root element name' },
        { name: 'pretty', type: 'boolean', required: false, defaultValue: false, description: 'Pretty print XML' }
      ]
    });

    functions.set('objectPath', {
      name: 'objectPath',
      description: 'Gets value from object using dot notation path',
      category: 'data',
      execute: (obj: any, path: string, defaultValue?: any) => {
        if (!obj || typeof path !== 'string') return defaultValue;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
          if (current === null || current === undefined || !(key in current)) {
            return defaultValue;
          }
          current = current[key];
        }
        
        return current;
      },
      parameters: [
        { name: 'obj', type: 'object', required: true, description: 'Source object' },
        { name: 'path', type: 'string', required: true, description: 'Dot notation path (e.g., "user.profile.name")' },
        { name: 'defaultValue', type: 'any', required: false, description: 'Default value if path not found' }
      ]
    });

    functions.set('objectSetPath', {
      name: 'objectSetPath',
      description: 'Sets value in object using dot notation path',
      category: 'data',
      execute: (obj: any, path: string, value: any) => {
        if (!obj || typeof path !== 'string') return obj;
        
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
          }
          current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
        return obj;
      },
      parameters: [
        { name: 'obj', type: 'object', required: true, description: 'Target object' },
        { name: 'path', type: 'string', required: true, description: 'Dot notation path' },
        { name: 'value', type: 'any', required: true, description: 'Value to set' }
      ]
    });

    functions.set('deepClone', {
      name: 'deepClone',
      description: 'Creates deep clone of object',
      category: 'data',
      execute: (obj: any) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => DataTransformationUtilities.getFunctions().get('deepClone')!.execute(item));
        
        const cloned: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = DataTransformationUtilities.getFunctions().get('deepClone')!.execute(obj[key]);
          }
        }
        return cloned;
      },
      parameters: [
        { name: 'obj', type: 'any', required: true, description: 'Object to clone' }
      ]
    });

    functions.set('merge', {
      name: 'merge',
      description: 'Deep merges multiple objects',
      category: 'data',
      execute: (...objects: any[]) => {
        const isObject = (obj: any) => obj && typeof obj === 'object' && !Array.isArray(obj);
        
        return objects.reduce((prev, obj) => {
          Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];
            
            if (Array.isArray(pVal) && Array.isArray(oVal)) {
              prev[key] = pVal.concat(...oVal);
            } else if (isObject(pVal) && isObject(oVal)) {
              prev[key] = DataTransformationUtilities.getFunctions().get('merge')!.execute(pVal, oVal);
            } else {
              prev[key] = oVal;
            }
          });
          
          return prev;
        }, {});
      },
      parameters: [
        { name: 'objects', type: 'any', required: true, description: 'Objects to merge (spread parameter)' }
      ]
    });

    functions.set('flatten', {
      name: 'flatten',
      description: 'Flattens nested object into single level with dot notation keys',
      category: 'data',
      execute: (obj: any, prefix: string = '') => {
        const flattened: any = {};
        
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;
          
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(flattened, DataTransformationUtilities.getFunctions().get('flatten')!.execute(value, newKey));
          } else {
            flattened[newKey] = value;
          }
        });
        
        return flattened;
      },
      parameters: [
        { name: 'obj', type: 'object', required: true, description: 'Object to flatten' },
        { name: 'prefix', type: 'string', required: false, defaultValue: '', description: 'Key prefix' }
      ]
    });

    functions.set('unflatten', {
      name: 'unflatten',
      description: 'Converts flattened object back to nested structure',
      category: 'data',
      execute: (obj: any) => {
        const result: any = {};
        
        Object.keys(obj).forEach(key => {
          const keys = key.split('.');
          let current = result;
          
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current)) {
              current[k] = {};
            }
            current = current[k];
          }
          
          current[keys[keys.length - 1]] = obj[key];
        });
        
        return result;
      },
      parameters: [
        { name: 'obj', type: 'object', required: true, description: 'Flattened object to unflatten' }
      ]
    });

    return functions;
  }
}