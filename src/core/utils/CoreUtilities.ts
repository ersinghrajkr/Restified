import { UtilityFunction } from './UtilityTypes';

export class StringUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('toUpperCase', {
      name: 'toUpperCase',
      description: 'Converts string to uppercase',
      category: 'string',
      execute: (str: string) => str?.toUpperCase() || '',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to convert' }
      ]
    });

    functions.set('toLowerCase', {
      name: 'toLowerCase',
      description: 'Converts string to lowercase',
      category: 'string',
      execute: (str: string) => str?.toLowerCase() || '',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to convert' }
      ]
    });

    functions.set('trim', {
      name: 'trim',
      description: 'Removes whitespace from both ends of string',
      category: 'string',
      execute: (str: string) => str?.trim() || '',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to trim' }
      ]
    });

    functions.set('substring', {
      name: 'substring',
      description: 'Extracts characters from string between two indices',
      category: 'string',
      execute: (str: string, start: number, end?: number) => str?.substring(start, end) || '',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'Source string' },
        { name: 'start', type: 'number', required: true, description: 'Start index' },
        { name: 'end', type: 'number', required: false, description: 'End index (optional)' }
      ]
    });

    functions.set('replace', {
      name: 'replace',
      description: 'Replaces occurrences of searchValue with replaceValue',
      category: 'string',
      execute: (str: string, searchValue: string, replaceValue: string) =>
        str?.replace(new RegExp(searchValue, 'g'), replaceValue) || '',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'Source string' },
        { name: 'searchValue', type: 'string', required: true, description: 'Value to search for' },
        { name: 'replaceValue', type: 'string', required: true, description: 'Replacement value' }
      ]
    });

    functions.set('split', {
      name: 'split',
      description: 'Splits string into array using separator',
      category: 'string',
      execute: (str: string, separator: string) => str?.split(separator) || [],
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to split' },
        { name: 'separator', type: 'string', required: true, description: 'Separator character/string' }
      ]
    });

    functions.set('join', {
      name: 'join',
      description: 'Joins array elements into string with separator',
      category: 'string',
      execute: (arr: string[], separator: string = ',') => arr?.join(separator) || '',
      parameters: [
        { name: 'arr', type: 'array', required: true, description: 'Array to join' },
        { name: 'separator', type: 'string', required: false, defaultValue: ',', description: 'Separator string' }
      ]
    });

    functions.set('padStart', {
      name: 'padStart',
      description: 'Pads string at the start to reach target length',
      category: 'string',
      execute: (str: string, targetLength: number, padString: string = ' ') =>
        str?.padStart(targetLength, padString) || '',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to pad' },
        { name: 'targetLength', type: 'number', required: true, description: 'Target length' },
        { name: 'padString', type: 'string', required: false, defaultValue: ' ', description: 'Padding string' }
      ]
    });

    functions.set('padEnd', {
      name: 'padEnd',
      description: 'Pads string at the end to reach target length',
      category: 'string',
      execute: (str: string, targetLength: number, padString: string = ' ') =>
        str?.padEnd(targetLength, padString) || '',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to pad' },
        { name: 'targetLength', type: 'number', required: true, description: 'Target length' },
        { name: 'padString', type: 'string', required: false, defaultValue: ' ', description: 'Padding string' }
      ]
    });

    functions.set('reverse', {
      name: 'reverse',
      description: 'Reverses a string',
      category: 'string',
      execute: (str: string) => str?.split('').reverse().join('') || '',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to reverse' }
      ]
    });

    functions.set('camelCase', {
      name: 'camelCase',
      description: 'Converts string to camelCase',
      category: 'string',
      execute: (str: string) => {
        if (!str) return '';
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
      },
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to convert to camelCase' }
      ]
    });

    functions.set('pascalCase', {
      name: 'pascalCase',
      description: 'Converts string to PascalCase',
      category: 'string',
      execute: (str: string) => {
        if (!str) return '';
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
          return word.toUpperCase();
        }).replace(/\s+/g, '');
      },
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to convert to PascalCase' }
      ]
    });

    functions.set('kebabCase', {
      name: 'kebabCase',
      description: 'Converts string to kebab-case',
      category: 'string',
      execute: (str: string) => {
        if (!str) return '';
        return str.replace(/([a-z])([A-Z])/g, '$1-$2')
                 .replace(/[\s_]+/g, '-')
                 .toLowerCase();
      },
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to convert to kebab-case' }
      ]
    });

    functions.set('snakeCase', {
      name: 'snakeCase',
      description: 'Converts string to snake_case',
      category: 'string',
      execute: (str: string) => {
        if (!str) return '';
        return str.replace(/([a-z])([A-Z])/g, '$1_$2')
                 .replace(/[\s-]+/g, '_')
                 .toLowerCase();
      },
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to convert to snake_case' }
      ]
    });

    return functions;
  }
}

export class DateUtilities {
  static formatDate(date: Date, format?: string): any {
    if (!format || format === 'ISO') {
      return date.toISOString();
    }
    
    if (format === 'timestamp') {
      return date.getTime();
    }
    
    if (format === 'date-only') {
      return date.toISOString().split('T')[0];
    }
    
    if (format === 'time-only') {
      return date.toISOString().split('T')[1].split('.')[0];
    }
    
    if (format === 'unix') {
      return Math.floor(date.getTime() / 1000);
    }
    
    if (format === 'local') {
      return date.toLocaleString();
    }
    
    if (format === 'utc') {
      return date.toUTCString();
    }
    
    // Custom format patterns
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    
    return format
      .replace(/YYYY/g, String(year))
      .replace(/YY/g, String(year).slice(-2))
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/HH/g, hours)
      .replace(/mm/g, minutes)
      .replace(/ss/g, seconds)
      .replace(/SSS/g, milliseconds)
      .replace(/M/g, String(date.getMonth() + 1))
      .replace(/D/g, String(date.getDate()))
      .replace(/H/g, String(date.getHours()))
      .replace(/m/g, String(date.getMinutes()))
      .replace(/s/g, String(date.getSeconds()));
  }

  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('now', {
      name: 'now',
      description: 'Returns current date in specified format',
      category: 'date',
      execute: (format?: string) => DateUtilities.formatDate(new Date(), format),
      parameters: [
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('timestamp', {
      name: 'timestamp',
      description: 'Returns current timestamp in milliseconds',
      category: 'date',
      execute: () => Date.now(),
      parameters: []
    });

    functions.set('today', {
      name: 'today',
      description: 'Returns today\'s date in specified format',
      category: 'date',
      execute: (format?: string) => DateUtilities.formatDate(new Date(), format || 'date-only'),
      parameters: [
        { name: 'format', type: 'string', required: false, defaultValue: 'date-only', description: 'Output format (date-only, ISO, YYYY-MM-DD, etc.)' }
      ]
    });

    // Add functions
    functions.set('addMinutes', {
      name: 'addMinutes',
      description: 'Adds specified number of minutes to a date',
      category: 'date',
      execute: (date: string | Date, minutes: number, format?: string) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() + minutes);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'minutes', type: 'number', required: true, description: 'Number of minutes to add' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('addHours', {
      name: 'addHours',
      description: 'Adds specified number of hours to a date',
      category: 'date',
      execute: (date: string | Date, hours: number, format?: string) => {
        const d = new Date(date);
        d.setHours(d.getHours() + hours);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'hours', type: 'number', required: true, description: 'Number of hours to add' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('addDays', {
      name: 'addDays',
      description: 'Adds specified number of days to a date',
      category: 'date',
      execute: (date: string | Date, days: number, format?: string) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'days', type: 'number', required: true, description: 'Number of days to add' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('addWeeks', {
      name: 'addWeeks',
      description: 'Adds specified number of weeks to a date',
      category: 'date',
      execute: (date: string | Date, weeks: number, format?: string) => {
        const d = new Date(date);
        d.setDate(d.getDate() + (weeks * 7));
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'weeks', type: 'number', required: true, description: 'Number of weeks to add' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('addMonths', {
      name: 'addMonths',
      description: 'Adds specified number of months to a date',
      category: 'date',
      execute: (date: string | Date, months: number, format?: string) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'months', type: 'number', required: true, description: 'Number of months to add' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('addYears', {
      name: 'addYears',
      description: 'Adds specified number of years to a date',
      category: 'date',
      execute: (date: string | Date, years: number, format?: string) => {
        const d = new Date(date);
        d.setFullYear(d.getFullYear() + years);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'years', type: 'number', required: true, description: 'Number of years to add' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    // Subtract functions
    functions.set('subtractMinutes', {
      name: 'subtractMinutes',
      description: 'Subtracts specified number of minutes from a date',
      category: 'date',
      execute: (date: string | Date, minutes: number, format?: string) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - minutes);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'minutes', type: 'number', required: true, description: 'Number of minutes to subtract' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('subtractHours', {
      name: 'subtractHours',
      description: 'Subtracts specified number of hours from a date',
      category: 'date',
      execute: (date: string | Date, hours: number, format?: string) => {
        const d = new Date(date);
        d.setHours(d.getHours() - hours);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'hours', type: 'number', required: true, description: 'Number of hours to subtract' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('subtractDays', {
      name: 'subtractDays',
      description: 'Subtracts specified number of days from a date',
      category: 'date',
      execute: (date: string | Date, days: number, format?: string) => {
        const d = new Date(date);
        d.setDate(d.getDate() - days);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'days', type: 'number', required: true, description: 'Number of days to subtract' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('subtractWeeks', {
      name: 'subtractWeeks',
      description: 'Subtracts specified number of weeks from a date',
      category: 'date',
      execute: (date: string | Date, weeks: number, format?: string) => {
        const d = new Date(date);
        d.setDate(d.getDate() - (weeks * 7));
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'weeks', type: 'number', required: true, description: 'Number of weeks to subtract' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('subtractMonths', {
      name: 'subtractMonths',
      description: 'Subtracts specified number of months from a date',
      category: 'date',
      execute: (date: string | Date, months: number, format?: string) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() - months);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'months', type: 'number', required: true, description: 'Number of months to subtract' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('subtractYears', {
      name: 'subtractYears',
      description: 'Subtracts specified number of years from a date',
      category: 'date',
      execute: (date: string | Date, years: number, format?: string) => {
        const d = new Date(date);
        d.setFullYear(d.getFullYear() - years);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Base date (ISO string or Date)' },
        { name: 'years', type: 'number', required: true, description: 'Number of years to subtract' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('format', {
      name: 'format',
      description: 'Formats date using provided format string',
      category: 'date',
      execute: (date: string | Date, format: string = 'YYYY-MM-DD') => {
        const d = new Date(date);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Date to format' },
        { name: 'format', type: 'string', required: false, defaultValue: 'YYYY-MM-DD', description: 'Format string (YYYY-MM-DD HH:mm:ss, ISO, timestamp, etc.)' }
      ]
    });

    functions.set('daysBetween', {
      name: 'daysBetween',
      description: 'Calculates days between two dates',
      category: 'date',
      execute: (date1: string | Date, date2: string | Date) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },
      parameters: [
        { name: 'date1', type: 'string', required: true, description: 'First date' },
        { name: 'date2', type: 'string', required: true, description: 'Second date' }
      ]
    });

    functions.set('startOfDay', {
      name: 'startOfDay',
      description: 'Returns start of day (00:00:00) for given date',
      category: 'date',
      execute: (date: string | Date, format?: string) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('endOfDay', {
      name: 'endOfDay',
      description: 'Returns end of day (23:59:59.999) for given date',
      category: 'date',
      execute: (date: string | Date, format?: string) => {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('startOfWeek', {
      name: 'startOfWeek',
      description: 'Returns start of week (Monday 00:00:00) for given date',
      category: 'date',
      execute: (date: string | Date, format?: string) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday is start of week
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('endOfWeek', {
      name: 'endOfWeek',
      description: 'Returns end of week (Sunday 23:59:59.999) for given date',
      category: 'date',
      execute: (date: string | Date, format?: string) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Sunday is end of week
        d.setDate(diff);
        d.setHours(23, 59, 59, 999);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('startOfMonth', {
      name: 'startOfMonth',
      description: 'Returns start of month (1st day 00:00:00) for given date',
      category: 'date',
      execute: (date: string | Date, format?: string) => {
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('endOfMonth', {
      name: 'endOfMonth',
      description: 'Returns end of month (last day 23:59:59.999) for given date',
      category: 'date',
      execute: (date: string | Date, format?: string) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);
        d.setHours(23, 59, 59, 999);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('startOfYear', {
      name: 'startOfYear',
      description: 'Returns start of year (Jan 1st 00:00:00) for given date',
      category: 'date',
      execute: (date: string | Date, format?: string) => {
        const d = new Date(date);
        d.setMonth(0);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('endOfYear', {
      name: 'endOfYear',
      description: 'Returns end of year (Dec 31st 23:59:59.999) for given date',
      category: 'date',
      execute: (date: string | Date, format?: string) => {
        const d = new Date(date);
        d.setMonth(11);
        d.setDate(31);
        d.setHours(23, 59, 59, 999);
        return DateUtilities.formatDate(d, format);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' },
        { name: 'format', type: 'string', required: false, description: 'Output format (ISO, timestamp, YYYY-MM-DD, etc.)' }
      ]
    });

    functions.set('getDayOfWeek', {
      name: 'getDayOfWeek',
      description: 'Returns day of week (0=Sunday, 1=Monday, etc.)',
      category: 'date',
      execute: (date: string | Date) => {
        const d = new Date(date);
        return d.getDay();
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' }
      ]
    });

    functions.set('getDayOfWeekName', {
      name: 'getDayOfWeekName',
      description: 'Returns day of week name (Monday, Tuesday, etc.)',
      category: 'date',
      execute: (date: string | Date) => {
        const d = new Date(date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[d.getDay()];
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' }
      ]
    });

    functions.set('getMonthName', {
      name: 'getMonthName',
      description: 'Returns month name (January, February, etc.)',
      category: 'date',
      execute: (date: string | Date) => {
        const d = new Date(date);
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[d.getMonth()];
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' }
      ]
    });

    functions.set('isLeapYear', {
      name: 'isLeapYear',
      description: 'Checks if given year is a leap year',
      category: 'date',
      execute: (year: number | string | Date) => {
        let y: number;
        if (typeof year === 'number') {
          y = year;
        } else if (typeof year === 'string') {
          const parsed = parseInt(year);
          if (isNaN(parsed)) {
            y = new Date(year).getFullYear();
          } else {
            y = parsed;
          }
        } else {
          y = new Date(year).getFullYear();
        }
        return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
      },
      parameters: [
        { name: 'year', type: 'any', required: true, description: 'Year (number, string, or date)' }
      ]
    });

    functions.set('getDaysInMonth', {
      name: 'getDaysInMonth',
      description: 'Returns number of days in the month of given date',
      category: 'date',
      execute: (date: string | Date) => {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' }
      ]
    });

    functions.set('getWeekNumber', {
      name: 'getWeekNumber',
      description: 'Returns ISO week number for given date',
      category: 'date',
      execute: (date: string | Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
        const week1 = new Date(d.getFullYear(), 0, 4);
        return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' }
      ]
    });

    functions.set('isWeekend', {
      name: 'isWeekend',
      description: 'Checks if given date is a weekend (Saturday or Sunday)',
      category: 'date',
      execute: (date: string | Date) => {
        const d = new Date(date);
        const day = d.getDay();
        return day === 0 || day === 6; // Sunday = 0, Saturday = 6
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' }
      ]
    });

    functions.set('isWeekday', {
      name: 'isWeekday',
      description: 'Checks if given date is a weekday (Monday to Friday)',
      category: 'date',
      execute: (date: string | Date) => {
        const d = new Date(date);
        const day = d.getDay();
        return day >= 1 && day <= 5; // Monday = 1, Friday = 5
      },
      parameters: [
        { name: 'date', type: 'string', required: true, description: 'Input date' }
      ]
    });

    functions.set('getAge', {
      name: 'getAge',
      description: 'Calculates age in years from birthdate to current date or specified date',
      category: 'date',
      execute: (birthDate: string | Date, referenceDate?: string | Date) => {
        const birth = new Date(birthDate);
        const reference = referenceDate ? new Date(referenceDate) : new Date();
        
        let age = reference.getFullYear() - birth.getFullYear();
        const monthDiff = reference.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
          age--;
        }
        
        return age;
      },
      parameters: [
        { name: 'birthDate', type: 'string', required: true, description: 'Birth date' },
        { name: 'referenceDate', type: 'string', required: false, description: 'Reference date (defaults to current date)' }
      ]
    });

    return functions;
  }
}

export class MathUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('round', {
      name: 'round',
      description: 'Rounds number to specified decimal places',
      category: 'math',
      execute: (num: number, decimals: number = 0) => {
        const factor = Math.pow(10, decimals);
        return Math.round(num * factor) / factor;
      },
      parameters: [
        { name: 'num', type: 'number', required: true, description: 'Number to round' },
        { name: 'decimals', type: 'number', required: false, defaultValue: 0, description: 'Decimal places' }
      ]
    });

    functions.set('random', {
      name: 'random',
      description: 'Generates random number between min and max',
      category: 'math',
      execute: (min: number = 0, max: number = 1) => Math.random() * (max - min) + min,
      parameters: [
        { name: 'min', type: 'number', required: false, defaultValue: 0, description: 'Minimum value' },
        { name: 'max', type: 'number', required: false, defaultValue: 1, description: 'Maximum value' }
      ]
    });

    functions.set('randomInt', {
      name: 'randomInt',
      description: 'Generates random integer between min and max (inclusive)',
      category: 'math',
      execute: (min: number = 0, max: number = 100) => 
        Math.floor(Math.random() * (max - min + 1)) + min,
      parameters: [
        { name: 'min', type: 'number', required: false, defaultValue: 0, description: 'Minimum value' },
        { name: 'max', type: 'number', required: false, defaultValue: 100, description: 'Maximum value' }
      ]
    });

    functions.set('abs', {
      name: 'abs',
      description: 'Returns absolute value of number',
      category: 'math',
      execute: (num: number) => Math.abs(num),
      parameters: [
        { name: 'num', type: 'number', required: true, description: 'Input number' }
      ]
    });

    functions.set('floor', {
      name: 'floor',
      description: 'Returns largest integer less than or equal to number',
      category: 'math',
      execute: (num: number) => Math.floor(num),
      parameters: [
        { name: 'num', type: 'number', required: true, description: 'Input number' }
      ]
    });

    functions.set('ceil', {
      name: 'ceil',
      description: 'Returns smallest integer greater than or equal to number',
      category: 'math',
      execute: (num: number) => Math.ceil(num),
      parameters: [
        { name: 'num', type: 'number', required: true, description: 'Input number' }
      ]
    });

    functions.set('sum', {
      name: 'sum',
      description: 'Calculates sum of array of numbers',
      category: 'math',
      execute: (numbers: number[]) => numbers.reduce((sum, num) => sum + num, 0),
      parameters: [
        { name: 'numbers', type: 'array', required: true, description: 'Array of numbers' }
      ]
    });

    functions.set('average', {
      name: 'average',
      description: 'Calculates average of array of numbers',
      category: 'math',
      execute: (numbers: number[]) => {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
      },
      parameters: [
        { name: 'numbers', type: 'array', required: true, description: 'Array of numbers' }
      ]
    });

    functions.set('max', {
      name: 'max',
      description: 'Returns maximum value from array of numbers',
      category: 'math',
      execute: (numbers: number[]) => Math.max(...numbers),
      parameters: [
        { name: 'numbers', type: 'array', required: true, description: 'Array of numbers' }
      ]
    });

    functions.set('min', {
      name: 'min',
      description: 'Returns minimum value from array of numbers',
      category: 'math',
      execute: (numbers: number[]) => Math.min(...numbers),
      parameters: [
        { name: 'numbers', type: 'array', required: true, description: 'Array of numbers' }
      ]
    });

    return functions;
  }
}

export class RandomUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('uuid', {
      name: 'uuid',
      description: 'Generates a UUID v4',
      category: 'random',
      execute: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      parameters: []
    });

    functions.set('string', {
      name: 'string',
      description: 'Generates random string of specified length',
      category: 'random',
      execute: (length: number = 10, characters?: string) => {
        const chars = characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      },
      parameters: [
        { name: 'length', type: 'number', required: false, defaultValue: 10, description: 'Length of string' },
        { name: 'characters', type: 'string', required: false, description: 'Character set to use' }
      ]
    });

    functions.set('alphanumeric', {
      name: 'alphanumeric',
      description: 'Generates random alphanumeric string',
      category: 'random',
      execute: (length: number = 10) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      },
      parameters: [
        { name: 'length', type: 'number', required: false, defaultValue: 10, description: 'Length of string' }
      ]
    });

    functions.set('numeric', {
      name: 'numeric',
      description: 'Generates random numeric string',
      category: 'random',
      execute: (length: number = 10) => {
        const chars = '0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      },
      parameters: [
        { name: 'length', type: 'number', required: false, defaultValue: 10, description: 'Length of string' }
      ]
    });

    functions.set('boolean', {
      name: 'boolean',
      description: 'Generates random boolean value',
      category: 'random',
      execute: () => Math.random() < 0.5,
      parameters: []
    });

    functions.set('arrayElement', {
      name: 'arrayElement',
      description: 'Returns random element from array',
      category: 'random',
      execute: (array: any[]) => {
        if (!Array.isArray(array) || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
      },
      parameters: [
        { name: 'array', type: 'array', required: true, description: 'Array to pick from' }
      ]
    });

    functions.set('email', {
      name: 'email',
      description: 'Generates random email address',
      category: 'random',
      execute: (domain: string = 'example.com') => {
        const username = Math.random().toString(36).substring(2, 15);
        return `${username}@${domain}`;
      },
      parameters: [
        { name: 'domain', type: 'string', required: false, defaultValue: 'example.com', description: 'Email domain' }
      ]
    });

    functions.set('phoneNumber', {
      name: 'phoneNumber',
      description: 'Generates random phone number',
      category: 'random',
      execute: (format: string = 'XXX-XXX-XXXX') => {
        return format.replace(/X/g, () => Math.floor(Math.random() * 10).toString());
      },
      parameters: [
        { name: 'format', type: 'string', required: false, defaultValue: 'XXX-XXX-XXXX', description: 'Phone format (X = digit)' }
      ]
    });

    return functions;
  }
}

export class ValidationUtilities {
  static getFunctions(): Map<string, UtilityFunction> {
    const functions = new Map<string, UtilityFunction>();

    functions.set('isEmail', {
      name: 'isEmail',
      description: 'Validates if string is a valid email address',
      category: 'validation',
      execute: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      parameters: [
        { name: 'email', type: 'string', required: true, description: 'Email to validate' }
      ]
    });

    functions.set('isUrl', {
      name: 'isUrl',
      description: 'Validates if string is a valid URL',
      category: 'validation',
      execute: (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'URL to validate' }
      ]
    });

    functions.set('isUUID', {
      name: 'isUUID',
      description: 'Validates if string is a valid UUID',
      category: 'validation',
      execute: (uuid: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      },
      parameters: [
        { name: 'uuid', type: 'string', required: true, description: 'UUID to validate' }
      ]
    });

    functions.set('isPhoneNumber', {
      name: 'isPhoneNumber',
      description: 'Validates if string is a valid phone number',
      category: 'validation',
      execute: (phone: string) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      parameters: [
        { name: 'phone', type: 'string', required: true, description: 'Phone number to validate' }
      ]
    });

    functions.set('isJSON', {
      name: 'isJSON',
      description: 'Validates if string is valid JSON',
      category: 'validation',
      execute: (str: string) => {
        try {
          JSON.parse(str);
          return true;
        } catch {
          return false;
        }
      },
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to validate as JSON' }
      ]
    });

    functions.set('isNumeric', {
      name: 'isNumeric',
      description: 'Validates if string represents a number',
      category: 'validation',
      execute: (str: string) => !isNaN(Number(str)) && !isNaN(parseFloat(str)),
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to validate as numeric' }
      ]
    });

    functions.set('isAlphaNumeric', {
      name: 'isAlphaNumeric',
      description: 'Validates if string contains only alphanumeric characters',
      category: 'validation',
      execute: (str: string) => /^[a-zA-Z0-9]+$/.test(str),
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to validate' }
      ]
    });

    functions.set('isLength', {
      name: 'isLength',
      description: 'Validates if string/array length is within specified range',
      category: 'validation',
      execute: (value: string | any[], min?: number, max?: number) => {
        const length = value.length;
        if (min !== undefined && length < min) return false;
        if (max !== undefined && length > max) return false;
        return true;
      },
      parameters: [
        { name: 'value', type: 'any', required: true, description: 'Value to check length' },
        { name: 'min', type: 'number', required: false, description: 'Minimum length' },
        { name: 'max', type: 'number', required: false, description: 'Maximum length' }
      ]
    });

    functions.set('matches', {
      name: 'matches',
      description: 'Validates if string matches regular expression pattern',
      category: 'validation',
      execute: (str: string, pattern: string, flags?: string) => {
        const regex = new RegExp(pattern, flags);
        return regex.test(str);
      },
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to validate' },
        { name: 'pattern', type: 'string', required: true, description: 'Regular expression pattern' },
        { name: 'flags', type: 'string', required: false, description: 'RegExp flags (g, i, m, etc.)' }
      ]
    });

    return functions;
  }
}