/**
 * Graceful Configuration Example
 * 
 * Demonstrates how RestifiedTS handles partial configurations
 * and missing dependencies gracefully without throwing errors.
 */

import { restified } from '../src/index';

async function demonstrateGracefulBehavior() {
  console.log('🔧 RestifiedTS Graceful Configuration Demo');
  console.log('==========================================\n');

  // 1. Using RestifiedTS with minimal configuration
  console.log('📋 1. Testing with minimal configuration...');
  
  // This works fine - RestifiedTS creates default HTTP client
  const response = await restified
    .given()
      .baseURL('https://jsonplaceholder.typicode.com')
    .when()
      .get('/users/1')
      .execute();

  await response
    .statusCode(200)
    .execute();

  console.log('✅ Basic HTTP functionality works without any configuration\n');

  // 2. Trying to use non-existent database client
  console.log('📋 2. Testing missing database client...');
  
  // This won't throw error - returns fallback client
  const dbClient = restified.getDatabaseClient('nonexistent');
  const dbResult = await dbClient.query('SELECT 1');
  
  console.log('✅ Missing database client handled gracefully');
  console.log('   Result:', dbResult);
  console.log();

  // 3. Trying to use database without package
  console.log('📋 3. Testing database without required package...');
  
  // This won't throw error - adds warning and continues
  await restified.createDatabaseClient('mysql', {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'test',
    password: 'test',
    database: 'test'
  });

  // This will use fallback client
  const mysqlClient = restified.getDatabaseClient('mysql');
  const mysqlResult = await mysqlClient.query('SELECT NOW()');
  
  console.log('✅ Missing database package handled gracefully');
  console.log('   Result:', mysqlResult);
  console.log();

  // 4. Trying to use non-existent GraphQL client
  console.log('📋 4. Testing missing GraphQL client...');
  
  // This won't throw error - returns fallback client
  const graphqlClient = restified.getGraphQLClient('nonexistent');
  const graphqlResult = await graphqlClient.query('{ __typename }');
  
  console.log('✅ Missing GraphQL client handled gracefully');
  console.log('   Result:', graphqlResult);
  console.log();

  // 5. Trying to use non-existent WebSocket client  
  console.log('📋 5. Testing missing WebSocket client...');
  
  // This won't throw error - returns fallback client
  const wsClient = restified.getWebSocketClient('nonexistent');
  await wsClient.connect();
  await wsClient.send('test message');
  
  console.log('✅ Missing WebSocket client handled gracefully\n');

  // 6. Configuration health report
  console.log('📋 6. Configuration Health Report:');
  restified.printConfigurationHealthReport();

  // 7. Get warnings programmatically
  const warnings = restified.getConfigurationWarnings();
  const missingFeatures = restified.getMissingFeatures();
  
  console.log('🔍 Programmatic access to warnings:');
  console.log('   Total warnings:', warnings.length);
  console.log('   Missing features:', missingFeatures.length);
  console.log();

  // 8. Environment variable control
  console.log('📋 7. Environment Variable Control:');
  console.log('   Set RESTIFIED_STRICT_MODE=true to make missing features throw errors');
  console.log('   Set RESTIFIED_ENABLE_WARNINGS=false to suppress warnings');
  console.log('   Set RESTIFIED_SILENT_FAILURES=database,graphql to silently skip specific features');
  console.log();

  // Cleanup
  await restified.cleanup();
  
  console.log('🎉 Demo completed successfully!');
  console.log('   RestifiedTS handled all missing configurations gracefully.');
}

async function demonstrateWorkingConfiguration() {
  console.log('\n🚀 RestifiedTS Working Configuration Demo');
  console.log('=========================================\n');

  // Configure RestifiedTS with available features only
  restified.createClient('api', {
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Suite': 'graceful-demo'
    }
  });

  // This works perfectly
  const response = await restified
    .given()
      .useClient('api')
    .when()
      .get('/users/1')
      .execute();

  await response
    .statusCode(200)
    .jsonPath('$.name', (name) => typeof name === 'string')
    .execute();

  console.log('✅ Configured HTTP client works perfectly');

  // Try to setup a database that might work (SQLite in-memory)
  try {
    await restified.createDatabaseClient('sqlite', {
      type: 'sqlite',
      options: {
        filename: ':memory:',
        memory: true
      }
    });

    // Test if SQLite actually works
    const sqliteClient = restified.getDatabaseClient('sqlite');
    await sqliteClient.query('CREATE TABLE test (id INTEGER, name TEXT)');
    await sqliteClient.query('INSERT INTO test VALUES (1, "Hello World")');
    const result = await sqliteClient.query('SELECT * FROM test');
    
    console.log('✅ SQLite database works:', result.rows);
  } catch (error: any) {
    console.log('⚠️ SQLite not available:', error.message);
  }

  await restified.cleanup();
  console.log('✅ Working configuration demo completed\n');
}

// Environment configuration examples
function showEnvironmentConfiguration() {
  console.log('🌍 Environment Configuration Options');
  console.log('===================================\n');

  const envExamples = `
# RestifiedTS Graceful Configuration Environment Variables

# Control graceful behavior
RESTIFIED_STRICT_MODE=false              # Set to 'true' to throw errors instead of warnings
RESTIFIED_ENABLE_WARNINGS=true          # Set to 'false' to suppress warning messages
RESTIFIED_ENABLE_FALLBACKS=true         # Set to 'false' to disable fallback clients
RESTIFIED_SILENT_FAILURES=database,graphql  # Comma-separated list of features to fail silently

# Examples of graceful behavior:

# 1. STRICT MODE OFF (default)
#    - Missing packages/configs generate warnings
#    - Tests continue with fallback clients
#    - No errors thrown

# 2. STRICT MODE ON
RESTIFIED_STRICT_MODE=true
#    - Missing packages/configs throw errors
#    - Tests fail fast if dependencies missing
#    - Good for CI/CD validation

# 3. SILENT FAILURES
RESTIFIED_SILENT_FAILURES=database,websocket
#    - Specified features fail silently (no warnings)
#    - Other features still generate warnings
#    - Good for optional features

# 4. NO WARNINGS
RESTIFIED_ENABLE_WARNINGS=false
#    - Suppresses all warning messages
#    - Still provides fallback functionality
#    - Good for clean test output
  `;

  console.log(envExamples);
}

// Run the examples
async function runAllExamples() {
  try {
    await demonstrateGracefulBehavior();
    await demonstrateWorkingConfiguration();
    showEnvironmentConfiguration();
  } catch (error: any) {
    console.error('❌ Example failed:', error.message);
    console.log('   This should not happen with graceful configuration!');
  }
}

if (require.main === module) {
  runAllExamples().catch(console.error);
}

export { demonstrateGracefulBehavior, demonstrateWorkingConfiguration, showEnvironmentConfiguration };