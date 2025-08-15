# 📚 Utility Function Reference

Complete reference for all 130+ built-in utility functions in RestifiedTS.

## 📖 **How to Read This Reference**

### **Function Signature Format**
```
categoryUtil('functionName', param1, param2?, param3?)
```
- `?` indicates optional parameters
- Return types and descriptions provided for each function

### **Usage Examples**
```typescript
// Direct usage
const result = restified.stringUtil('toUpperCase', 'hello');
console.log(result.value); // "HELLO"

// In variable templates
const template = '{{$util.string.toUpperCase("hello")}}';
const resolved = restified.resolveVariables(template); // "HELLO"
```

---

## 🔤 **String Utilities**

Access with: `restified.stringUtil(functionName, ...args)`

### **Case Conversion**

#### `toUpperCase(str: string): string`
Converts string to uppercase.
```typescript
stringUtil('toUpperCase', 'hello world') // "HELLO WORLD"
```

#### `toLowerCase(str: string): string`
Converts string to lowercase.
```typescript
stringUtil('toLowerCase', 'Hello World') // "hello world"
```

#### `camelCase(str: string): string`
Converts string to camelCase.
```typescript
stringUtil('camelCase', 'hello world example') // "helloWorldExample"
```

#### `pascalCase(str: string): string`
Converts string to PascalCase.
```typescript
stringUtil('pascalCase', 'hello world') // "HelloWorld"
```

#### `kebabCase(str: string): string`
Converts string to kebab-case.
```typescript
stringUtil('kebabCase', 'HelloWorldExample') // "hello-world-example"
```

#### `snakeCase(str: string): string`
Converts string to snake_case.
```typescript
stringUtil('snakeCase', 'HelloWorldExample') // "hello_world_example"
```

### **String Manipulation**

#### `trim(str: string): string`
Removes whitespace from both ends.
```typescript
stringUtil('trim', '  hello world  ') // "hello world"
```

#### `substring(str: string, start: number, end?: number): string`
Extracts characters between indices.
```typescript
stringUtil('substring', 'hello world', 0, 5) // "hello"
stringUtil('substring', 'hello world', 6)    // "world"
```

#### `replace(str: string, searchValue: string, replaceValue: string): string`
Replaces occurrences globally.
```typescript
stringUtil('replace', 'hello world', 'world', 'universe') // "hello universe"
```

#### `reverse(str: string): string`
Reverses a string.
```typescript
stringUtil('reverse', 'hello') // "olleh"
```

### **String Operations**

#### `split(str: string, separator: string): string[]`
Splits string into array.
```typescript
stringUtil('split', 'a,b,c', ',') // ["a", "b", "c"]
```

#### `join(arr: string[], separator?: string): string`
Joins array into string (default separator: ',').
```typescript
stringUtil('join', ['a', 'b', 'c'], '-') // "a-b-c"
stringUtil('join', ['a', 'b', 'c'])      // "a,b,c"
```

#### `padStart(str: string, targetLength: number, padString?: string): string`
Pads string at start (default pad: ' ').
```typescript
stringUtil('padStart', '42', 5, '0') // "00042"
stringUtil('padStart', 'hi', 5)      // "   hi"
```

#### `padEnd(str: string, targetLength: number, padString?: string): string`
Pads string at end (default pad: ' ').
```typescript
stringUtil('padEnd', '42', 5, '0') // "42000"
stringUtil('padEnd', 'hi', 5)      // "hi   "
```

---

## 📅 **Date Utilities**

Access with: `restified.dateUtil(functionName, ...args)`

**All date functions support optional format parameter for flexible output:**
- `ISO` (default), `timestamp`, `unix`, `date-only`, `time-only`, `local`, `utc`
- Custom patterns: `YYYY-MM-DD`, `DD/MM/YYYY`, `HH:mm:ss`, etc.

### **Current Date/Time**

#### `now(format?: string): any`
Returns current date in specified format.
```typescript
dateUtil('now')                    // "2024-06-15T14:30:45.123Z" (ISO)
dateUtil('now', 'timestamp')       // 1718462445123
dateUtil('now', 'YYYY-MM-DD HH:mm') // "2024-06-15 14:30"
```

#### `timestamp(): number`
Returns current timestamp in milliseconds.
```typescript
dateUtil('timestamp') // 1718462445123
```

#### `today(format?: string): any`
Returns today's date (default: date-only).
```typescript
dateUtil('today')               // "2024-06-15"
dateUtil('today', 'DD/MM/YYYY') // "15/06/2024"
```

### **Add Operations**

#### `addMinutes(date: string|Date, minutes: number, format?: string): any`
Adds minutes to date.
```typescript
dateUtil('addMinutes', '2024-06-15T14:30:00Z', 30)           // ISO format
dateUtil('addMinutes', '2024-06-15T14:30:00Z', 30, 'HH:mm')  // "15:00"
```

#### `addHours(date: string|Date, hours: number, format?: string): any`
Adds hours to date.
```typescript
dateUtil('addHours', '2024-06-15T14:30:00Z', 5)                 // ISO format
dateUtil('addHours', '2024-06-15T14:30:00Z', 5, 'timestamp')    // timestamp
```

#### `addDays(date: string|Date, days: number, format?: string): any`
Adds days to date.
```typescript
dateUtil('addDays', '2024-06-15', 7)                    // ISO format
dateUtil('addDays', '2024-06-15', 7, 'YYYY-MM-DD')     // "2024-06-22"
dateUtil('addDays', '2024-06-15', 7, 'DD/MM/YYYY')     // "22/06/2024"
```

#### `addWeeks(date: string|Date, weeks: number, format?: string): any`
Adds weeks to date.
```typescript
dateUtil('addWeeks', '2024-06-15', 2, 'YYYY-MM-DD') // "2024-06-29"
```

#### `addMonths(date: string|Date, months: number, format?: string): any`
Adds months to date.
```typescript
dateUtil('addMonths', '2024-06-15', 3, 'YYYY-MM') // "2024-09"
```

#### `addYears(date: string|Date, years: number, format?: string): any`
Adds years to date.
```typescript
dateUtil('addYears', '2024-06-15', 1, 'YYYY') // "2025"
```

### **Subtract Operations**

#### `subtractMinutes(date: string|Date, minutes: number, format?: string): any`
Subtracts minutes from date.
```typescript
dateUtil('subtractMinutes', '2024-06-15T14:30:00Z', 15, 'time-only') // "14:15:00"
```

#### `subtractHours(date: string|Date, hours: number, format?: string): any`
Subtracts hours from date.
```typescript
dateUtil('subtractHours', '2024-06-15T14:30:00Z', 2) // ISO format
```

#### `subtractDays(date: string|Date, days: number, format?: string): any`
Subtracts days from date.
```typescript
dateUtil('subtractDays', '2024-06-15', 10, 'YYYY-MM-DD') // "2024-06-05"
```

#### `subtractWeeks(date: string|Date, weeks: number, format?: string): any`
Subtracts weeks from date.
```typescript
dateUtil('subtractWeeks', '2024-06-15', 1, 'DD/MM/YYYY') // "08/06/2024"
```

#### `subtractMonths(date: string|Date, months: number, format?: string): any`
Subtracts months from date.
```typescript
dateUtil('subtractMonths', '2024-06-15', 6, 'MM/YYYY') // "12/2023"
```

#### `subtractYears(date: string|Date, years: number, format?: string): any`
Subtracts years from date.
```typescript
dateUtil('subtractYears', '2024-06-15', 2, 'YYYY') // "2022"
```

### **Period Boundaries**

#### `startOfDay(date: string|Date, format?: string): any`
Returns start of day (00:00:00).
```typescript
dateUtil('startOfDay', '2024-06-15T14:30:00Z', 'YYYY-MM-DD HH:mm:ss') // "2024-06-15 00:00:00"
```

#### `endOfDay(date: string|Date, format?: string): any`
Returns end of day (23:59:59.999).
```typescript
dateUtil('endOfDay', '2024-06-15T14:30:00Z', 'timestamp') // 1718496000000
```

#### `startOfWeek(date: string|Date, format?: string): any`
Returns start of week (Monday 00:00:00).
```typescript
dateUtil('startOfWeek', '2024-06-15', 'DD/MM/YYYY') // "10/06/2024"
```

#### `endOfWeek(date: string|Date, format?: string): any`
Returns end of week (Sunday 23:59:59.999).
```typescript
dateUtil('endOfWeek', '2024-06-15', 'YYYY-MM-DD') // "2024-06-16"
```

#### `startOfMonth(date: string|Date, format?: string): any`
Returns start of month (1st day 00:00:00).
```typescript
dateUtil('startOfMonth', '2024-06-15', 'YYYY-MM-DD') // "2024-06-01"
```

#### `endOfMonth(date: string|Date, format?: string): any`
Returns end of month (last day 23:59:59.999).
```typescript
dateUtil('endOfMonth', '2024-06-15', 'DD/MM/YYYY') // "30/06/2024"
```

#### `startOfYear(date: string|Date, format?: string): any`
Returns start of year (Jan 1st 00:00:00).
```typescript
dateUtil('startOfYear', '2024-06-15', 'YYYY-MM-DD') // "2024-01-01"
```

#### `endOfYear(date: string|Date, format?: string): any`
Returns end of year (Dec 31st 23:59:59.999).
```typescript
dateUtil('endOfYear', '2024-06-15', 'unix') // 1735689599
```

### **Date Information**

#### `getDayOfWeek(date: string|Date): number`
Returns day of week (0=Sunday, 1=Monday, etc.).
```typescript
dateUtil('getDayOfWeek', '2024-06-15') // 6 (Saturday)
```

#### `getDayOfWeekName(date: string|Date): string`
Returns day of week name.
```typescript
dateUtil('getDayOfWeekName', '2024-06-15') // "Saturday"
```

#### `getMonthName(date: string|Date): string`
Returns month name.
```typescript
dateUtil('getMonthName', '2024-06-15') // "June"
```

#### `getWeekNumber(date: string|Date): number`
Returns ISO week number.
```typescript
dateUtil('getWeekNumber', '2024-06-15') // 24
```

#### `getDaysInMonth(date: string|Date): number`
Returns number of days in month.
```typescript
dateUtil('getDaysInMonth', '2024-06-15') // 30
```

### **Date Checks**

#### `isWeekend(date: string|Date): boolean`
Checks if date is weekend (Saturday or Sunday).
```typescript
dateUtil('isWeekend', '2024-06-15') // true (Saturday)
```

#### `isWeekday(date: string|Date): boolean`
Checks if date is weekday (Monday to Friday).
```typescript
dateUtil('isWeekday', '2024-06-15') // false
```

#### `isLeapYear(year: number|string|Date): boolean`
Checks if year is leap year.
```typescript
dateUtil('isLeapYear', 2024) // true
dateUtil('isLeapYear', '2023') // false
```

### **Date Calculations**

#### `getAge(birthDate: string|Date, referenceDate?: string|Date): number`
Calculates age in years.
```typescript
dateUtil('getAge', '1990-01-01', '2024-06-15') // 34
dateUtil('getAge', '1990-01-01') // Age relative to current date
```

#### `daysBetween(date1: string|Date, date2: string|Date): number`
Calculates days between two dates.
```typescript
dateUtil('daysBetween', '2024-01-01', '2024-06-15') // 166
```

#### `format(date: string|Date, format?: string): any`
Formats date with custom pattern.
```typescript
dateUtil('format', '2024-06-15T14:30:45.123Z', 'DD/MM/YYYY HH:mm:ss') // "15/06/2024 14:30:45"
```

---

## 🔢 **Math Utilities**

Access with: `restified.mathUtil(functionName, ...args)`

### **Basic Operations**

#### `round(num: number, decimals?: number): number`
Rounds number to specified decimal places (default: 0).
```typescript
mathUtil('round', 3.14159, 2) // 3.14
mathUtil('round', 3.7)        // 4
```

#### `abs(num: number): number`
Returns absolute value.
```typescript
mathUtil('abs', -42) // 42
```

#### `floor(num: number): number`
Returns largest integer ≤ number.
```typescript
mathUtil('floor', 3.8) // 3
```

#### `ceil(num: number): number`
Returns smallest integer ≥ number.
```typescript
mathUtil('ceil', 3.2) // 4
```

### **Random Numbers**

#### `random(min?: number, max?: number): number`
Generates random number between min and max (default: 0-1).
```typescript
mathUtil('random', 0, 1)     // 0.742...
mathUtil('random', 10, 20)   // 15.384...
mathUtil('random')           // 0.123...
```

#### `randomInt(min?: number, max?: number): number`
Generates random integer (default: 0-100).
```typescript
mathUtil('randomInt', 1, 10)  // 7
mathUtil('randomInt')         // 42
```

### **Array Operations**

#### `sum(numbers: number[]): number`
Calculates sum of array.
```typescript
mathUtil('sum', [1, 2, 3, 4, 5]) // 15
```

#### `average(numbers: number[]): number`
Calculates average of array.
```typescript
mathUtil('average', [1, 2, 3, 4, 5]) // 3
```

#### `max(numbers: number[]): number`
Returns maximum value.
```typescript
mathUtil('max', [1, 5, 3, 9, 2]) // 9
```

#### `min(numbers: number[]): number`
Returns minimum value.
```typescript
mathUtil('min', [1, 5, 3, 9, 2]) // 1
```

---

## 🎲 **Random Utilities**

Access with: `restified.randomUtil(functionName, ...args)`

### **Identifiers**

#### `uuid(): string`
Generates UUID v4.
```typescript
randomUtil('uuid') // "123e4567-e89b-12d3-a456-426614174000"
```

#### `string(length?: number, characters?: string): string`
Generates random string (default: 10 chars, alphanumeric).
```typescript
randomUtil('string', 8)                    // "A3bC9dE2"
randomUtil('string', 5, 'ABCDEF123456')   // "AB3C1"
```

#### `alphanumeric(length?: number): string`
Generates alphanumeric string (default: 10 chars).
```typescript
randomUtil('alphanumeric', 8) // "A3b7C9d2"
```

#### `numeric(length?: number): string`
Generates numeric string (default: 10 chars).
```typescript
randomUtil('numeric', 6) // "123456"
```

### **Contact Data**

#### `email(domain?: string): string`
Generates random email (default domain: 'example.com').
```typescript
randomUtil('email')                // "user123@example.com"
randomUtil('email', 'company.com') // "abc456@company.com"
```

#### `phoneNumber(format?: string): string`
Generates phone number (default: 'XXX-XXX-XXXX').
```typescript
randomUtil('phoneNumber')                    // "555-123-4567"
randomUtil('phoneNumber', '+1-XXX-XXX-XXXX') // "+1-555-987-6543"
```

### **Miscellaneous**

#### `boolean(): boolean`
Generates random boolean.
```typescript
randomUtil('boolean') // true or false
```

#### `arrayElement(array: any[]): any`
Returns random element from array.
```typescript
randomUtil('arrayElement', ['red', 'green', 'blue']) // "green"
```

---

## ✅ **Validation Utilities**

Access with: `restified.validationUtil(functionName, ...args)`

### **Format Validation**

#### `isEmail(email: string): boolean`
Validates email format.
```typescript
validationUtil('isEmail', 'test@example.com') // true
validationUtil('isEmail', 'invalid-email')    // false
```

#### `isUrl(url: string): boolean`
Validates URL format.
```typescript
validationUtil('isUrl', 'https://example.com') // true
validationUtil('isUrl', 'not-a-url')          // false
```

#### `isUUID(uuid: string): boolean`
Validates UUID format.
```typescript
validationUtil('isUUID', '123e4567-e89b-12d3-a456-426614174000') // true
validationUtil('isUUID', 'not-a-uuid')                          // false
```

#### `isPhoneNumber(phone: string): boolean`
Validates phone number format.
```typescript
validationUtil('isPhoneNumber', '+1234567890')   // true
validationUtil('isPhoneNumber', '555-123-4567')  // true
validationUtil('isPhoneNumber', 'not-a-phone')   // false
```

#### `isJSON(str: string): boolean`
Validates JSON format.
```typescript
validationUtil('isJSON', '{"key": "value"}') // true
validationUtil('isJSON', 'invalid json')     // false
```

#### `isNumeric(str: string): boolean`
Validates if string is numeric.
```typescript
validationUtil('isNumeric', '123.45') // true
validationUtil('isNumeric', 'abc')    // false
```

#### `isAlphaNumeric(str: string): boolean`
Validates alphanumeric characters only.
```typescript
validationUtil('isAlphaNumeric', 'abc123') // true
validationUtil('isAlphaNumeric', 'abc-123') // false
```

### **Length Validation**

#### `isLength(value: string|any[], min?: number, max?: number): boolean`
Validates length within range.
```typescript
validationUtil('isLength', 'password', 8, 20)    // true (8-20 chars)
validationUtil('isLength', 'short', 8)           // false (< 8 chars)
validationUtil('isLength', [1, 2, 3], 2, 5)      // true (2-5 elements)
```

### **Pattern Matching**

#### `matches(str: string, pattern: string, flags?: string): boolean`
Validates against regex pattern.
```typescript
validationUtil('matches', 'abc123', '^[a-z]+[0-9]+$')        // true
validationUtil('matches', 'ABC123', '^[a-z]+[0-9]+$', 'i')   // true (case insensitive)
```

---

## 🗃️ **Data Utilities**

Access with: `restified.dataUtil(functionName, ...args)`

### **JSON Operations**

#### `jsonParse(jsonString: string): any`
Parses JSON string.
```typescript
dataUtil('jsonParse', '{"name":"John","age":30}') // { name: "John", age: 30 }
```

#### `jsonStringify(obj: any, pretty?: boolean): string`
Converts object to JSON string.
```typescript
dataUtil('jsonStringify', { name: "John" }, true)  // Pretty formatted
dataUtil('jsonStringify', { name: "John" })        // Compact
```

### **CSV Operations**

#### `csvParse(csvString: string, delimiter?: string, hasHeaders?: boolean): any[]`
Parses CSV string (default: ',' delimiter, headers=true).
```typescript
dataUtil('csvParse', 'name,age\nJohn,30\nJane,25')     // Array of objects
dataUtil('csvParse', 'John;30;Manager', ';', false)    // Array of arrays
```

#### `csvStringify(data: any[], delimiter?: string, includeHeaders?: boolean): string`
Converts array to CSV string.
```typescript
const data = [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }];
dataUtil('csvStringify', data)         // With headers
dataUtil('csvStringify', data, ';')    // Semicolon delimiter
```

### **XML Operations**

#### `xmlParse(xmlString: string): any`
Basic XML parsing to object.
```typescript
dataUtil('xmlParse', '<user><name>John</name><age>30</age></user>')
// { user: { name: "John", age: "30" } }
```

#### `xmlStringify(obj: any, rootElement?: string, pretty?: boolean): string`
Converts object to XML string.
```typescript
dataUtil('xmlStringify', { name: "John", age: 30 }, 'user', true)
// <?xml version="1.0" encoding="UTF-8"?>
// <user>
//   <name>John</name>
//   <age>30</age>
// </user>
```

### **Object Manipulation**

#### `objectPath(obj: any, path: string, defaultValue?: any): any`
Gets value using dot notation path.
```typescript
const user = { profile: { name: "John", settings: { theme: "dark" } } };
dataUtil('objectPath', user, 'profile.name')           // "John"
dataUtil('objectPath', user, 'profile.age', 25)        // 25 (default)
dataUtil('objectPath', user, 'profile.settings.theme') // "dark"
```

#### `objectSetPath(obj: any, path: string, value: any): any`
Sets value using dot notation path.
```typescript
const obj = {};
dataUtil('objectSetPath', obj, 'user.profile.name', 'John');
// obj becomes: { user: { profile: { name: "John" } } }
```

#### `deepClone(obj: any): any`
Creates deep copy of object.
```typescript
const original = { user: { name: "John" } };
const copy = dataUtil('deepClone', original);
// Modifying copy won't affect original
```

#### `merge(...objects: any[]): any`
Deep merges multiple objects.
```typescript
const obj1 = { a: 1, b: { x: 10 } };
const obj2 = { b: { y: 20 }, c: 3 };
dataUtil('merge', obj1, obj2); // { a: 1, b: { x: 10, y: 20 }, c: 3 }
```

#### `flatten(obj: any, prefix?: string): any`
Flattens nested object to dot notation.
```typescript
const nested = { user: { profile: { name: "John" } } };
dataUtil('flatten', nested);
// { "user.profile.name": "John" }
```

#### `unflatten(obj: any): any`
Converts flattened object back to nested.
```typescript
const flat = { "user.profile.name": "John" };
dataUtil('unflatten', flat);
// { user: { profile: { name: "John" } } }
```

---

## 🔒 **Crypto Utilities**

Access with: `restified.cryptoUtil(functionName, ...args)`

### **Hashing**

#### `md5(input: string): string`
Generates MD5 hash.
```typescript
cryptoUtil('md5', 'hello world') // "5d41402abc4b2a76b9719d911017c592"
```

#### `sha1(input: string): string`
Generates SHA1 hash.
```typescript
cryptoUtil('sha1', 'hello world') // "2aae6c35c94fcfb415dbe95f408b9ce91ee846ed"
```

#### `sha256(input: string): string`
Generates SHA256 hash.
```typescript
cryptoUtil('sha256', 'hello world') // "b94d27b9934d3e08..."
```

#### `sha512(input: string): string`
Generates SHA512 hash.
```typescript
cryptoUtil('sha512', 'hello world') // "309ecc489c12d6eb..."
```

### **HMAC Signatures**

#### `hmacSha256(data: string, secret: string, encoding?: 'hex'|'base64'): string`
Generates HMAC-SHA256 signature.
```typescript
cryptoUtil('hmacSha256', 'data', 'secret')         // Hex output
cryptoUtil('hmacSha256', 'data', 'secret', 'base64') // Base64 output
```

#### `hmacSha512(data: string, secret: string, encoding?: 'hex'|'base64'): string`
Generates HMAC-SHA512 signature.
```typescript
cryptoUtil('hmacSha512', 'data', 'secret') // "a1b2c3d4..."
```

### **Password Hashing**

#### `pbkdf2(password: string, salt?: string, iterations?: number, keyLength?: number): object`
Generates PBKDF2 hash for secure password storage.
```typescript
cryptoUtil('pbkdf2', 'password123')
// { hash: "abc123...", salt: "def456...", iterations: 10000, keyLength: 64 }
```

#### `verifyPbkdf2(password: string, hash: string, salt: string, iterations?: number, keyLength?: number): boolean`
Verifies password against PBKDF2 hash.
```typescript
cryptoUtil('verifyPbkdf2', 'password123', storedHash, storedSalt) // true/false
```

### **Encryption**

#### `encrypt(text: string, password: string): object`
Encrypts text using AES-256-GCM.
```typescript
cryptoUtil('encrypt', 'secret data', 'password')
// { encrypted: "abc123...", iv: "def456...", tag: "ghi789..." }
```

#### `decrypt(encryptedData: object, password: string): string`
Decrypts data from encrypt function.
```typescript
cryptoUtil('decrypt', encryptedData, 'password') // "secret data"
```

### **Key Generation**

#### `randomBytes(size: number, encoding?: 'hex'|'base64'|'binary'): string`
Generates cryptographically secure random bytes.
```typescript
cryptoUtil('randomBytes', 16)          // Hex encoded
cryptoUtil('randomBytes', 16, 'base64') // Base64 encoded
```

#### `generateKeyPair(keySize?: number): object`
Generates RSA key pair.
```typescript
cryptoUtil('generateKeyPair', 2048)
// { publicKey: "-----BEGIN PUBLIC KEY-----...", privateKey: "-----BEGIN PRIVATE KEY-----..." }
```

### **Digital Signatures**

#### `signRSA(data: string, privateKey: string, algorithm?: string): string`
Signs data with RSA private key.
```typescript
cryptoUtil('signRSA', 'data to sign', privateKey) // Base64 signature
```

#### `verifyRSA(data: string, signature: string, publicKey: string, algorithm?: string): boolean`
Verifies RSA signature.
```typescript
cryptoUtil('verifyRSA', 'data to sign', signature, publicKey) // true/false
```

---

## 🛡️ **Security Utilities**

Access with: `restified.securityUtil(functionName, ...args)`

### **JWT Operations**

#### `generateJWT(payload: object, secret: string, expiresIn?: number): string`
Generates basic JWT token.
```typescript
securityUtil('generateJWT', { userId: 123, role: 'admin' }, 'secret', 3600)
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### `verifyJWT(token: string, secret: string): object`
Verifies and decodes JWT token.
```typescript
securityUtil('verifyJWT', token, 'secret')
// { valid: true, payload: {...}, header: {...} }
// or { valid: false, error: "error message" }
```

### **Key Generation**

#### `generateApiKey(length?: number, prefix?: string): string`
Generates secure API key.
```typescript
securityUtil('generateApiKey', 32)        // 32-byte hex key
securityUtil('generateApiKey', 16, 'api') // "api_a1b2c3d4e5f6..."
```

#### `generateSecurePassword(length?: number, includeSymbols?: boolean): string`
Generates cryptographically secure password.
```typescript
securityUtil('generateSecurePassword', 16)        // With symbols
securityUtil('generateSecurePassword', 12, false) // Alphanumeric only
```

#### `generateCSRFToken(): string`
Generates CSRF token.
```typescript
securityUtil('generateCSRFToken') // "a1b2c3d4e5f6..."
```

### **Data Protection**

#### `maskSensitiveData(data: string, visibleChars?: number, maskChar?: string): string`
Masks sensitive data for logging.
```typescript
securityUtil('maskSensitiveData', 'credit-card-1234567890')     // "**************7890"
securityUtil('maskSensitiveData', 'password123', 2, '#')       // "#########23"
```

#### `sanitizeInput(input: string, allowHtml?: boolean): string`
Sanitizes input to prevent injection attacks.
```typescript
securityUtil('sanitizeInput', '<script>alert("xss")</script>')
// "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"

securityUtil('sanitizeInput', 'user input with "quotes"')
// "user input with &quot;quotes&quot;"
```

---

## 📁 **File Utilities** *(Async)*

Access with: `await restified.fileUtil(functionName, ...args)`

### **File Operations**

#### `readFile(filePath: string, encoding?: BufferEncoding): Promise<string>`
Reads file content.
```typescript
await fileUtil('readFile', './data.txt')        // UTF-8 encoding
await fileUtil('readFile', './data.txt', 'binary') // Binary encoding
```

#### `writeFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<object>`
Writes content to file (creates directories if needed).
```typescript
await fileUtil('writeFile', './output/data.txt', 'Hello World')
// { success: true, path: "./output/data.txt" }
```

#### `appendFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<object>`
Appends content to file.
```typescript
await fileUtil('appendFile', './log.txt', 'New log entry\n')
```

### **File Management**

#### `copyFile(sourcePath: string, destPath: string): Promise<object>`
Copies file to destination.
```typescript
await fileUtil('copyFile', './source.txt', './backup/source.txt')
// { success: true, source: "./source.txt", destination: "./backup/source.txt" }
```

#### `moveFile(sourcePath: string, destPath: string): Promise<object>`
Moves/renames file.
```typescript
await fileUtil('moveFile', './old-name.txt', './new-name.txt')
```

#### `deleteFile(filePath: string): Promise<object>`
Deletes file.
```typescript
await fileUtil('deleteFile', './temp.txt')
// { success: true, path: "./temp.txt" }
```

### **File Information**

#### `fileExists(filePath: string): boolean`
Checks if file exists.
```typescript
fileUtil('fileExists', './myfile.txt') // true/false
```

#### `getFileStats(filePath: string): Promise<object>`
Gets file statistics.
```typescript
await fileUtil('getFileStats', './myfile.txt')
// {
//   size: 1024,
//   created: Date,
//   modified: Date,
//   accessed: Date,
//   isFile: true,
//   isDirectory: false,
//   permissions: 33188
// }
```

### **Directory Operations**

#### `createDirectory(dirPath: string, recursive?: boolean): Promise<object>`
Creates directory.
```typescript
await fileUtil('createDirectory', './new/nested/folder') // Recursive by default
await fileUtil('createDirectory', './folder', false)    // Single level only
```

#### `deleteDirectory(dirPath: string, recursive?: boolean): Promise<object>`
Deletes directory.
```typescript
await fileUtil('deleteDirectory', './temp-folder', true) // Delete contents too
```

#### `listDirectory(dirPath: string, includeHidden?: boolean): Promise<array>`
Lists directory contents.
```typescript
await fileUtil('listDirectory', './')
// [
//   { name: "file1.txt", type: "file", path: "./file1.txt" },
//   { name: "folder1", type: "directory", path: "./folder1" }
// ]
```

### **File Search**

#### `searchFiles(dirPath: string, pattern: string, recursive?: boolean): Promise<string[]>`
Searches for files matching pattern.
```typescript
await fileUtil('searchFiles', './', '*.js', true)    // All JS files recursively
await fileUtil('searchFiles', './', 'test*', false)  // Files starting with "test"
// ["./src/app.js", "./tests/test1.js", ...]
```

---

## 🔗 **Encoding Utilities**

Access with: `restified.encodingUtil(functionName, ...args)`

### **Base64**

#### `base64Encode(input: string): string`
Encodes string to Base64.
```typescript
encodingUtil('base64Encode', 'hello world') // "aGVsbG8gd29ybGQ="
```

#### `base64Decode(input: string): string`
Decodes Base64 string.
```typescript
encodingUtil('base64Decode', 'aGVsbG8gd29ybGQ=') // "hello world"
```

### **URL Encoding**

#### `urlEncode(input: string): string`
URL encodes string.
```typescript
encodingUtil('urlEncode', 'hello world!') // "hello%20world%21"
```

#### `urlDecode(input: string): string`
URL decodes string.
```typescript
encodingUtil('urlDecode', 'hello%20world%21') // "hello world!"
```

### **Hexadecimal**

#### `hexEncode(input: string): string`
Encodes string to hexadecimal.
```typescript
encodingUtil('hexEncode', 'hello') // "68656c6c6f"
```

#### `hexDecode(input: string): string`
Decodes hexadecimal string.
```typescript
encodingUtil('hexDecode', '68656c6c6f') // "hello"
```

### **HTML Encoding**

#### `htmlEncode(input: string): string`
HTML encodes string (escapes entities).
```typescript
encodingUtil('htmlEncode', '<script>alert("xss")</script>')
// "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
```

#### `htmlDecode(input: string): string`
HTML decodes string (unescapes entities).
```typescript
encodingUtil('htmlDecode', '&lt;div&gt;content&lt;/div&gt;') // "<div>content</div>"
```

### **Base32**

#### `base32Encode(input: string): string`
Encodes string to Base32.
```typescript
encodingUtil('base32Encode', 'hello') // "NBSWY3DP"
```

#### `base32Decode(input: string): string`
Decodes Base32 string.
```typescript
encodingUtil('base32Decode', 'NBSWY3DP') // "hello"
```

---

## 🌐 **Network Utilities**

Access with: `restified.networkUtil(functionName, ...args)`

### **URL Operations**

#### `parseUrl(url: string): object`
Parses URL into components.
```typescript
networkUtil('parseUrl', 'https://api.example.com:8080/users?page=1&limit=10#section')
// {
//   protocol: "https:",
//   hostname: "api.example.com",
//   port: "8080",
//   pathname: "/users",
//   search: "?page=1&limit=10",
//   hash: "#section",
//   origin: "https://api.example.com:8080",
//   href: "https://api.example.com:8080/users?page=1&limit=10#section"
// }
```

#### `buildUrl(base: string, params?: object): string`
Builds URL with query parameters.
```typescript
networkUtil('buildUrl', 'https://api.example.com/search', {
  q: 'restified',
  limit: 20,
  sort: 'name'
})
// "https://api.example.com/search?q=restified&limit=20&sort=name"
```

#### `extractDomain(url: string): string`
Extracts domain from URL.
```typescript
networkUtil('extractDomain', 'https://api.example.com/users/123') // "api.example.com"
```

### **IP Validation**

#### `isValidIP(ip: string, version?: 4|6): boolean`
Validates IP address format.
```typescript
networkUtil('isValidIP', '192.168.1.1')    // true (any version)
networkUtil('isValidIP', '192.168.1.1', 4) // true (IPv4)
networkUtil('isValidIP', '::1', 6)         // true (IPv6)
networkUtil('isValidIP', 'invalid-ip')     // false
```

---

## 📊 **Utility Management Functions**

### **Direct Execution**

#### `utility(functionPath: string, ...args): UtilityResult`
Execute any utility function directly.
```typescript
const result = restified.utility('string.toUpperCase', 'hello');
console.log(result.success); // true
console.log(result.value);   // "HELLO"
console.log(result.executionTime); // 0.1 (ms)
```

#### `utilityAsync(functionPath: string, ...args): Promise<UtilityResult>`
Execute async utility function.
```typescript
const result = await restified.utilityAsync('file.readFile', './data.txt');
if (result.success) {
  console.log(result.value); // File content
}
```

### **Batch Operations**

#### `executeUtilityBatch(operations): UtilityResult[]`
Execute multiple utilities in one call.
```typescript
const operations = [
  { function: 'string.toUpperCase', args: ['hello'] },
  { function: 'math.randomInt', args: [1, 10] },
  { function: 'date.timestamp', args: [] }
];
const results = restified.executeUtilityBatch(operations);
```

#### `executeUtilityBatchAsync(operations): Promise<UtilityResult[]>`
Execute multiple async utilities.
```typescript
const results = await restified.executeUtilityBatchAsync(operations);
```

### **Pipeline Processing**

#### `executeUtilityPipeline(input, operations): UtilityResult`
Chain utilities together.
```typescript
const result = restified.executeUtilityPipeline('  hello world  ', [
  { function: 'string.trim' },
  { function: 'string.toUpperCase' },
  { function: 'string.replace', args: ['WORLD', 'UNIVERSE'] }
]);
console.log(result.value); // "HELLO UNIVERSE"
```

### **Conditional Execution**

#### `executeUtilityIf(condition, functionPath, ...args): UtilityResult|null`
Execute utility if condition is true.
```typescript
const result = restified.executeUtilityIf(true, 'string.toUpperCase', 'hello');
// Returns UtilityResult if condition is true, null otherwise
```

#### `executeUtilitySafe(functionPath, fallbackValue, ...args): any`
Execute utility with fallback value.
```typescript
const result = restified.executeUtilitySafe('invalid.function', 'fallback', 'arg');
console.log(result); // "fallback"
```

### **Monitoring & Management**

#### `getUtilityPerformanceMetrics(): object`
Get utility performance statistics.
```typescript
const metrics = restified.getUtilityPerformanceMetrics();
// {
//   totalExecutions: 150,
//   functionCounts: { 'string.toUpperCase': 25, ... },
//   averageExecutionTimes: { 'string.toUpperCase': 0.1, ... }
// }
```

#### `utilityHealthCheck(): object`
Check utility system health.
```typescript
const health = restified.utilityHealthCheck();
// {
//   status: 'healthy', // 'healthy' | 'degraded' | 'unhealthy'
//   issues: [],        // Array of issue descriptions
//   metrics: {...}     // Performance metrics
// }
```

#### `clearUtilityCache(): void`
Clear utility execution cache.
```typescript
restified.clearUtilityCache();
```

#### `clearUtilityExecutionLog(): void`
Clear utility execution log.
```typescript
restified.clearUtilityExecutionLog();
```

---

## 🎯 **Quick Reference Summary**

### **Function Categories**
- **String** (14 functions): Case conversion, manipulation, operations
- **Date** (26 functions): Add/subtract, boundaries, info, checks, calculations + flexible formatting
- **Math** (10 functions): Basic operations, random numbers, array operations
- **Random** (8 functions): Identifiers, contact data, misc generation
- **Validation** (9 functions): Format validation, length checks, pattern matching
- **Data** (12 functions): JSON/CSV/XML, object manipulation
- **Crypto** (14 functions): Hashing, HMAC, passwords, encryption, keys, signatures
- **Security** (7 functions): JWT, keys, data protection
- **File** (12 functions): CRUD operations, directory management, search *(async)*
- **Encoding** (10 functions): Base64, URL, hex, HTML, Base32
- **Network** (4 functions): URL operations, IP validation

### **Access Patterns**
```typescript
// Category-specific access
restified.stringUtil('functionName', ...args)
restified.dateUtil('functionName', ...args, format?)
restified.mathUtil('functionName', ...args)
// ... etc for all categories

// Direct access
restified.utility('category.functionName', ...args)

// Async access
await restified.utilityAsync('category.functionName', ...args)

// Variable template usage
'{{$util.category.functionName(arg1, arg2)}}'
```

### **Return Format**
All utilities return `UtilityResult`:
```typescript
{
  success: boolean,
  value?: any,           // Function result
  error?: string,        // Error message if failed
  executionTime?: number, // Execution time in ms
  metadata?: object      // Additional metadata
}
```

**Total: 130+ utility functions** across 12 categories with complete enterprise functionality.