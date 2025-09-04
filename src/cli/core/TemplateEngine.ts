/**
 * Template Engine
 * 
 * Handlebars-based template processing with custom helpers and inheritance
 */

import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { 
  TemplateContext, 
  TemplateConfig,
  TemplateError 
} from '../types/ScaffoldTypes';

export class TemplateEngine {
  private handlebars: typeof Handlebars;
  private templateCache = new Map<string, Handlebars.TemplateDelegate>();
  private templateDir: string;

  constructor() {
    this.handlebars = Handlebars.create();
    this.templateDir = path.join(__dirname, '..', 'templates');
    this.registerHelpers();
  }

  /**
   * Render a template with context
   */
  async renderTemplate(templatePath: string, context: any): Promise<string> {
    try {
      // Store context for helpers
      this.handlebars.helpers['hasTestType'] = (type: string) => {
        return context.testTypes && context.testTypes.includes(type);
      };
      
      const template = await this.getCompiledTemplate(templatePath);
      return template(context);
    } catch (error) {
      throw new TemplateError(
        `Failed to render template ${templatePath}: ${(error as Error).message}`,
        { templatePath, context, error }
      );
    }
  }

  /**
   * Render multiple templates
   */
  async renderTemplates(configs: TemplateConfig[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    for (const config of configs) {
      const rendered = await this.renderTemplate(config.path, config.context);
      results.set(config.outputPath, rendered);
    }
    
    return results;
  }

  /**
   * Get compiled template (with caching)
   */
  private async getCompiledTemplate(templatePath: string): Promise<Handlebars.TemplateDelegate> {
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }

    const fullPath = path.join(this.templateDir, templatePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new TemplateError(`Template file not found: ${fullPath}`);
    }

    const templateSource = fs.readFileSync(fullPath, 'utf8');
    const compiled = this.handlebars.compile(templateSource);
    
    this.templateCache.set(templatePath, compiled);
    return compiled;
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // JSON helper
    this.handlebars.registerHelper('json', (obj: any) => {
      return new this.handlebars.SafeString(JSON.stringify(obj, null, 2));
    });

    // String manipulation helpers
    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    this.handlebars.registerHelper('uppercase', (str: string) => {
      return str.toUpperCase();
    });

    this.handlebars.registerHelper('lowercase', (str: string) => {
      return str.toLowerCase();
    });

    this.handlebars.registerHelper('camelCase', (str: string) => {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

    this.handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    });

    // Array helpers
    this.handlebars.registerHelper('join', (array: any[], separator: string = ', ') => {
      return array.join(separator);
    });

    this.handlebars.registerHelper('includes', (array: any[], item: any) => {
      return Array.isArray(array) && array.includes(item);
    });

    this.handlebars.registerHelper('length', (array: any[]) => {
      return Array.isArray(array) ? array.length : 0;
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    this.handlebars.registerHelper('ne', (a: any, b: any) => {
      return a !== b;
    });

    this.handlebars.registerHelper('gt', (a: number, b: number) => {
      return a > b;
    });

    this.handlebars.registerHelper('lt', (a: number, b: number) => {
      return a < b;
    });

    this.handlebars.registerHelper('and', (a: any, b: any) => {
      return a && b;
    });

    this.handlebars.registerHelper('or', (a: any, b: any) => {
      return a || b;
    });

    // Date helpers
    this.handlebars.registerHelper('date', (format?: string) => {
      const date = new Date();
      if (format === 'iso') {
        return date.toISOString();
      } else if (format === 'short') {
        return date.toLocaleDateString();
      } else if (format === 'long') {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      return date.toString();
    });

    this.handlebars.registerHelper('year', () => {
      return new Date().getFullYear();
    });

    // Template-specific helpers will be registered dynamically in renderTemplate

    this.handlebars.registerHelper('isFirstItem', (index: number) => {
      return index === 0;
    });

    this.handlebars.registerHelper('isLastItem', (index: number, array: any[]) => {
      return index === array.length - 1;
    });

    // Code generation helpers
    this.handlebars.registerHelper('indent', (text: string, spaces: number = 2) => {
      const indent = ' '.repeat(spaces);
      return text.split('\n').map(line => line ? indent + line : line).join('\n');
    });

    this.handlebars.registerHelper('comment', (text: string, style: 'js' | 'ts' | 'html' = 'js') => {
      switch (style) {
        case 'js':
        case 'ts':
          return `// ${text}`;
        case 'html':
          return `<!-- ${text} -->`;
        default:
          return `// ${text}`;
      }
    });

    // Template inheritance helper (for partials)
    this.handlebars.registerHelper('include', (templatePath: string, context?: any) => {
      try {
        const partialPath = path.join(this.templateDir, 'partials', templatePath);
        if (fs.existsSync(partialPath)) {
          const partialSource = fs.readFileSync(partialPath, 'utf8');
          const compiled = this.handlebars.compile(partialSource);
          return new this.handlebars.SafeString(compiled(context || this));
        }
        return '';
      } catch (error) {
        console.warn(`Failed to include partial ${templatePath}:`, error);
        return '';
      }
    });
  }

  /**
   * Register a custom helper
   */
  registerHelper(name: string, helper: Handlebars.HelperDelegate): void {
    this.handlebars.registerHelper(name, helper);
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, templatePath: string): void {
    const fullPath = path.join(this.templateDir, 'partials', templatePath);
    if (fs.existsSync(fullPath)) {
      const partialSource = fs.readFileSync(fullPath, 'utf8');
      this.handlebars.registerPartial(name, partialSource);
    } else {
      throw new TemplateError(`Partial template not found: ${fullPath}`);
    }
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(category?: string): string[] {
    const templates: string[] = [];
    const searchDir = category ? path.join(this.templateDir, category) : this.templateDir;
    
    const scan = (dir: string, prefix: string = '') => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          scan(itemPath, prefix + item + '/');
        } else if (item.endsWith('.hbs')) {
          templates.push(prefix + item);
        }
      }
    };
    
    scan(searchDir);
    return templates;
  }

  /**
   * Validate template syntax
   */
  validateTemplate(templatePath: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const fullPath = path.join(this.templateDir, templatePath);
      
      if (!fs.existsSync(fullPath)) {
        errors.push(`Template file not found: ${fullPath}`);
        return { isValid: false, errors };
      }

      const templateSource = fs.readFileSync(fullPath, 'utf8');
      this.handlebars.compile(templateSource);
      
      return { isValid: true, errors };
    } catch (error) {
      errors.push(`Template syntax error: ${(error as Error).message}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Get template directory path
   */
  getTemplateDir(): string {
    return this.templateDir;
  }

  /**
   * Set custom template directory
   */
  setTemplateDir(dir: string): void {
    this.templateDir = dir;
    this.clearCache(); // Clear cache when template directory changes
  }
}