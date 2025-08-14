/**
 * Variable Store Example
 * 
 * This example demonstrates comprehensive usage of the Variable Store
 * including global, local, extracted, and environment variables.
 */

import { restified } from '../../src';

describe('Variable Store Example', function() {
  this.timeout(15000);

  beforeEach(function() {
    // Clear any existing local variables for clean tests
    restified.clearLocalVariables();
  });

  it('should demonstrate global variable management', async function() {
    // Set global variables
    restified.setGlobalVariable('expectedUserId', 1);
    restified.setGlobalVariable('testEnvironment', 'staging');
    restified.setGlobalVariable('requestSource', 'automated-test');

    // Set multiple global variables at once
    restified.setGlobalVariables({
      'company': 'Restified Corp',
      'version': '1.0.0',
      'testSuite': 'variable-management'
    });

    // Make request and use global variables in headers/validation
    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
        .header('X-Test-Environment', '{{testEnvironment}}')
        .header('X-Company', '{{company}}')
        .header('X-Request-Source', '{{requestSource}}')
      .when()
        .get('/users/{{expectedUserId}}')
        .execute();

    await response
      .statusCode(200)
      .jsonPath('$.id', 1)
      .execute();

    // Retrieve and verify global variables
    console.log('Global Variables Set:');
    console.log('- Expected User ID:', restified.getGlobalVariable('expectedUserId'));
    console.log('- Test Environment:', restified.getGlobalVariable('testEnvironment'));
    console.log('- Request Source:', restified.getGlobalVariable('requestSource'));
    console.log('- Company:', restified.getGlobalVariable('company'));
    console.log('- Version:', restified.getGlobalVariable('version'));
    console.log('- Test Suite:', restified.getGlobalVariable('testSuite'));

    // Get all global variables
    const allGlobalVars = restified.getGlobalVariables();
    console.log('Total global variables:', Object.keys(allGlobalVars).length);
  });

  it('should demonstrate local variable management', async function() {
    // Set local variables (test-scoped)
    restified.setLocalVariable('testName', 'Variable Store Test');
    restified.setLocalVariable('requestId', Math.random().toString(36).substring(7));
    restified.setLocalVariable('expectedStatus', 200);

    // Set multiple local variables at once
    restified.setLocalVariables({
      'currentTest': 'local-variables',
      'timestamp': new Date().toISOString(),
      'retryCount': 3
    });

    // Use local variables in requests
    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
        .header('X-Request-Id', '{{requestId}}')
        .header('X-Test-Name', '{{testName}}')
      .when()
        .get('/posts/1')
        .execute();

    await response
      .statusCode(200)
      .execute();

    // Retrieve local variables
    console.log('Local Variables:');
    console.log('- Test Name:', restified.getLocalVariable('testName'));
    console.log('- Request ID:', restified.getLocalVariable('requestId'));
    console.log('- Expected Status:', restified.getLocalVariable('expectedStatus'));
    console.log('- Current Test:', restified.getLocalVariable('currentTest'));

    // Get all local variables
    const allLocalVars = restified.getLocalVariables();
    console.log('Total local variables:', Object.keys(allLocalVars).length);
  });

  it('should demonstrate extracted variable management', async function() {
    // Make a request and extract multiple values
    const userResponse = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/users/1')
        .execute();

    await userResponse
      .statusCode(200)
      .extract('$.id', 'userId')
      .extract('$.name', 'userName')
      .extract('$.email', 'userEmail')
      .extract('$.address.city', 'userCity')
      .extract('$.company.name', 'companyName')
      .execute();

    // Use extracted variables in subsequent requests
    const postsResponse = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
        .header('X-User-Id', '{{userId}}')
        .header('X-User-Name', '{{userName}}')
      .when()
        .get('/posts?userId={{userId}}')
        .execute();

    await postsResponse
      .statusCode(200)
      .custom((response) => {
        const posts = response.data;
        return Array.isArray(posts) && posts.length > 0;
      }, 'Should have posts for the user')
      .custom((response) => {
        const posts = response.data;
        return posts.every(post => post.userId.toString() === restified.getVariable('userId').toString());
      }, 'All posts should belong to the extracted user ID')
      .execute();

    // Display extracted variables
    console.log('Extracted Variables:');
    console.log('- User ID:', restified.getVariable('userId'));
    console.log('- User Name:', restified.getVariable('userName'));
    console.log('- User Email:', restified.getVariable('userEmail'));
    console.log('- User City:', restified.getVariable('userCity'));
    console.log('- Company Name:', restified.getVariable('companyName'));
  });

  it('should demonstrate environment variable usage', async function() {
    // Set environment variables (simulating external configuration)
    process.env.TEST_USER_ID = '2';
    process.env.TEST_ENVIRONMENT = 'production';
    process.env.API_VERSION = 'v1';

    // Use environment variables in headers and path parameters
    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
        .header('X-Environment', '{{$env.TEST_ENVIRONMENT}}')
        .header('X-API-Version', '{{$env.API_VERSION}}')
      .when()
        .get('/users/{{$env.TEST_USER_ID}}')
        .execute();

    await response
      .statusCode(200)
      .jsonPath('$.id', 2)
      .jsonPath('$.name')
      .execute();

    // Environment variables are accessed through the special $env prefix
    console.log('Environment Variables Used:');
    console.log('- User ID:', process.env.TEST_USER_ID);
    console.log('- Environment:', process.env.TEST_ENVIRONMENT);
    console.log('- API Version:', process.env.API_VERSION);
  });

  it('should demonstrate variable priority and resolution', async function() {
    // Set variables with same name at different levels to demonstrate priority
    const testVar = 'priorityTest';
    
    // 1. Global variable (lowest priority)
    restified.setGlobalVariable(testVar, 'global-value');
    
    // 2. Local variable (higher priority)
    restified.setLocalVariable(testVar, 'local-value');
    
    // 3. Environment variable (can be accessed separately)
    process.env.PRIORITY_TEST = 'env-value';

    // Test variable resolution priority
    console.log('Variable Priority Resolution:');
    console.log('- Global value:', restified.getGlobalVariable(testVar));
    console.log('- Local value:', restified.getLocalVariable(testVar));
    console.log('- General getVariable() returns:', restified.getVariable(testVar));
    
    // Make a request to extract a value (highest priority)
    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/users/1')
        .execute();

    await response
      .statusCode(200)
      .extract('$.name', testVar) // This will override local variable
      .execute();

    console.log('After extraction:');
    console.log('- Extracted value:', restified.getVariable(testVar));
    
    // Demonstrate that local variable still exists but extracted takes priority
    console.log('- Local variable still exists:', restified.getLocalVariable(testVar));
    
    // Test using different variable names in templates
    const testResponse = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
        .header('X-Local-Var', '{{priorityTest}}')  // Will resolve to extracted value
        .header('X-Env-Var', '{{$env.PRIORITY_TEST}}')  // Will resolve to env value
      .when()
        .get('/posts/1')
        .execute();

    await testResponse.statusCode(200).execute();
  });

  it('should demonstrate comprehensive variable operations', async function() {
    // Set up a complex scenario with multiple variable types
    restified.setGlobalVariable('testSuite', 'comprehensive-variables');
    
    restified.setLocalVariables({
      'testId': 'comp-test-001',
      'targetUserId': 1,
      'requestType': 'user-data-fetch'
    });

    process.env.MAX_RETRIES = '3';
    process.env.REQUEST_TIMEOUT = '5000';

    // Make request using all variable types
    const userResponse = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
        .header('X-Test-Id', '{{testId}}')
        .header('X-Request-Type', '{{requestType}}')
        .header('X-Test-Suite', '{{testSuite}}')
        .header('X-Max-Retries', '{{$env.MAX_RETRIES}}')
      .when()
        .get('/users/{{targetUserId}}')
        .execute();

    await userResponse
      .statusCode(200)
      .extract('$.name', 'extractedUserName')
      .extract('$.company.name', 'extractedCompanyName')
      .execute();

    // Now use extracted data in another request  
    const postsResponse = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
        .header('X-User-Name', '{{extractedUserName}}')
        .header('X-Company', '{{extractedCompanyName}}')
        .header('X-Suite', '{{testSuite}}')
      .when()
        .get('/posts?userId={{targetUserId}}')
        .execute();

    await postsResponse
      .statusCode(200)
      .custom((response) => {
        return Array.isArray(response.data) && response.data.length > 0;
      }, 'Should retrieve posts for the user')
      .execute();

    // Display complete variable summary
    console.log('\n=== Complete Variable Summary ===');
    console.log('Global Variables:', restified.getGlobalVariables());
    console.log('Local Variables:', restified.getLocalVariables());
    console.log('Extracted Variables: {');
    console.log('  extractedUserName:', restified.getVariable('extractedUserName'));
    console.log('  extractedCompanyName:', restified.getVariable('extractedCompanyName'));
    console.log('}');
    console.log('Environment Variables Used: {');
    console.log('  MAX_RETRIES:', process.env.MAX_RETRIES);
    console.log('  REQUEST_TIMEOUT:', process.env.REQUEST_TIMEOUT);
    console.log('}');
  });

  it('should demonstrate variable clearing and cleanup', async function() {
    // Set up variables
    restified.setGlobalVariable('temp1', 'value1');
    restified.setLocalVariable('temp2', 'value2');

    // Extract some data
    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/users/1')
        .execute();

    await response
      .statusCode(200)
      .extract('$.id', 'temp3')
      .execute();

    // Verify variables exist
    console.log('Before cleanup:');
    console.log('- Global temp1:', restified.getGlobalVariable('temp1'));
    console.log('- Local temp2:', restified.getLocalVariable('temp2'));
    console.log('- Extracted temp3:', restified.getVariable('temp3'));

    // Clear specific variable types
    restified.clearLocalVariables();
    console.log('\nAfter clearing local variables:');
    console.log('- Global temp1:', restified.getGlobalVariable('temp1'));
    console.log('- Local temp2:', restified.getLocalVariable('temp2')); // Should be undefined
    console.log('- Extracted temp3:', restified.getVariable('temp3'));

    // Note: There's no clearVariables method, only clearLocalVariables
    // Global variables and extracted variables persist until cleanup
    console.log('\nNote: Global and extracted variables persist until cleanup');
    console.log('- Global temp1 still exists:', restified.getGlobalVariable('temp1'));
    console.log('- Extracted temp3 still exists:', restified.getVariable('temp3'));
  });

  after(async function() {
    await restified.cleanup();
  });
});