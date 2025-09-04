# 🗄️ Database Integration Guide

Comprehensive guide for database integration in RestifiedTS with complete configuration examples for all supported database types.

---

## 📋 **Supported Database Types**

RestifiedTS supports the following database systems:

- **PostgreSQL** - Enterprise-grade relational database
- **MySQL/MariaDB** - Popular relational database
- **MongoDB** - Document-oriented NoSQL database
- **Microsoft SQL Server** - Enterprise SQL database
- **SQLite** - Lightweight file-based database
- **Oracle Database** - Enterprise Oracle database
- **Redis** - In-memory key-value store
- **Elasticsearch** - Search and analytics engine

---

## 🔧 **Database Configuration**

### **PostgreSQL Configuration**

```typescript
// Complete PostgreSQL configuration with all options
await restified.createDatabaseClient('postgres_main', {
  type: 'postgresql',
  
  // Required Connection Parameters
  host: 'localhost',                    // Database server hostname or IP
  port: 5432,                          // Database port (default: 5432)
  database: 'testdb',                  // Database name
  username: 'postgres',                // Database username
  password: 'password123',             // Database password
  
  // Optional Connection Parameters
  schema: 'public',                    // Default schema (default: 'public')
  ssl: {                              // SSL configuration
    mode: 'require',                   // SSL mode: disable, allow, prefer, require, verify-ca, verify-full
    ca: '/path/to/ca-certificate.crt', // CA certificate file
    cert: '/path/to/client-cert.crt',  // Client certificate file
    key: '/path/to/client-key.key',    // Client private key file
    rejectUnauthorized: true           // Reject unauthorized certificates
  },
  
  // Connection Pool Settings
  maxConnections: 20,                  // Maximum connections in pool
  minConnections: 2,                   // Minimum connections in pool
  acquireTimeoutMillis: 60000,         // Max time to get connection (ms)
  createTimeoutMillis: 30000,          // Max time to create connection (ms)
  destroyTimeoutMillis: 5000,          // Max time to destroy connection (ms)
  reapIntervalMillis: 1000,            // Pool reap interval (ms)
  createRetryIntervalMillis: 200,      // Retry interval for failed connections (ms)
  idleTimeoutMillis: 30000,            // Idle connection timeout (ms)
  
  // Query and Connection Settings
  connectionTimeout: 60000,            // Connection timeout (ms)
  queryTimeout: 30000,                 // Default query timeout (ms)
  statementTimeout: 30000,             // Statement timeout (ms)
  connectionString: undefined,         // Alternative: full connection string
  
  // Advanced Settings
  application_name: 'RestifiedTS',     // Application name for monitoring
  search_path: 'public,shared',        // Schema search path
  timezone: 'UTC',                     // Session timezone
  client_encoding: 'UTF8',             // Client character encoding
  
  // Debug and Monitoring
  log: {                              // Logging configuration
    level: 'info',                     // Log level: error, warn, info, debug
    queries: true,                     // Log SQL queries
    parameters: false,                 // Log query parameters (security risk)
    slowQueryThreshold: 1000           // Log slow queries above threshold (ms)
  }
});

// Alternative: Connection string format
await restified.createDatabaseClient('postgres_string', {
  type: 'postgresql',
  connectionString: 'postgresql://username:password@localhost:5432/database?sslmode=require&application_name=RestifiedTS'
});
```

### **MySQL/MariaDB Configuration**

```typescript
// Complete MySQL configuration with all options
await restified.createDatabaseClient('mysql_main', {
  type: 'mysql',
  
  // Required Connection Parameters
  host: 'localhost',                   // Database server hostname or IP
  port: 3306,                         // Database port (default: 3306)
  database: 'testdb',                 // Database name
  username: 'root',                   // Database username (MySQL: root, MariaDB: root)
  password: 'password123',            // Database password
  
  // Character Set and Collation
  charset: 'utf8mb4',                 // Character set (utf8, utf8mb4, latin1, ascii)
  collation: 'utf8mb4_unicode_ci',    // Collation
  timezone: 'UTC',                    // Connection timezone (UTC, local, +HH:MM)
  
  // SSL Configuration
  ssl: {
    ca: '/path/to/ca-cert.pem',       // Certificate Authority certificate
    cert: '/path/to/client-cert.pem', // Client certificate
    key: '/path/to/client-key.pem',   // Client private key
    rejectUnauthorized: true,         // Verify server certificate
    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256' // Allowed SSL ciphers
  },
  
  // Connection Pool Settings
  connectionLimit: 10,                // Maximum connections in pool
  queueLimit: 0,                      // Maximum queued connections (0 = no limit)
  acquireTimeout: 60000,              // Max time to get connection (ms)
  timeout: 60000,                     // Query timeout (ms)
  reconnect: true,                    // Auto-reconnect on connection loss
  
  // Query Settings
  multipleStatements: false,          // Allow multiple statements in single query
  stringifyObjects: false,            // Stringify objects in queries
  supportBigNumbers: true,            // Support BIGINT and DECIMAL columns
  bigNumberStrings: true,             // Return big numbers as strings
  
  // Advanced MySQL Settings
  flags: [                           // Connection flags
    'LONG_PASSWORD',
    'FOUND_ROWS',
    'CONNECT_WITH_DB',
    'COMPRESS',
    'LOCAL_FILES'
  ],
  queryFormat: undefined,             // Custom query formatting function
  
  // Debug and Monitoring
  debug: false,                       // Enable debug mode
  trace: true,                        // Enable stack traces
  localAddress: undefined,            // Local interface to connect from
  socketPath: undefined,              // Unix domain socket path
  
  // MariaDB Specific
  insertIdAsNumber: false,            // Return insertId as number instead of string
  decimalNumbers: false,              // Parse DECIMAL columns as numbers
  dateStrings: false                  // Return DATE/DATETIME as strings
});

// Alternative: Connection URI format
await restified.createDatabaseClient('mysql_uri', {
  type: 'mysql',
  connectionString: 'mysql://username:password@localhost:3306/database?charset=utf8mb4&timezone=UTC'
});
```

### **MongoDB Configuration**

```typescript
// Complete MongoDB configuration with all options
await restified.createDatabaseClient('mongo_main', {
  type: 'mongodb',
  
  // Connection String (Recommended)
  connectionString: 'mongodb://username:password@localhost:27017/database?authSource=admin&replicaSet=rs0',
  
  // OR Individual Parameters
  host: 'localhost',                  // Single host
  hosts: [                           // Multiple hosts for replica set/sharding
    { host: 'mongo1.example.com', port: 27017 },
    { host: 'mongo2.example.com', port: 27017 },
    { host: 'mongo3.example.com', port: 27017 }
  ],
  port: 27017,                       // Default port
  database: 'testdb',                // Database name
  username: 'mongouser',             // Username
  password: 'mongopass',             // Password
  
  // Authentication Settings
  authSource: 'admin',               // Authentication database
  authMechanism: 'SCRAM-SHA-256',    // Auth mechanism: SCRAM-SHA-1, SCRAM-SHA-256, MONGODB-CR, PLAIN
  
  // Replica Set Settings
  replicaSet: 'rs0',                 // Replica set name
  readPreference: 'primary',         // Read preference: primary, primaryPreferred, secondary, secondaryPreferred, nearest
  readConcern: 'majority',           // Read concern: local, available, majority, linearizable, snapshot
  writeConcern: {                    // Write concern
    w: 'majority',                   // Write acknowledgment: number, 'majority', or tag set
    j: true,                         // Journal acknowledgment
    wtimeout: 10000                  // Write timeout (ms)
  },
  
  // Connection Pool Settings
  maxPoolSize: 10,                   // Maximum connections in pool
  minPoolSize: 1,                    // Minimum connections in pool
  maxIdleTimeMS: 30000,              // Max idle time for connections (ms)
  waitQueueMultiple: 5,              // Max queued operations per connection
  waitQueueTimeoutMS: 10000,         // Queue timeout (ms)
  
  // Timeout Settings
  connectTimeoutMS: 30000,           // Connection timeout (ms)
  socketTimeoutMS: 30000,            // Socket timeout (ms)
  serverSelectionTimeoutMS: 30000,   // Server selection timeout (ms)
  heartbeatFrequencyMS: 10000,       // Heartbeat frequency (ms)
  
  // SSL/TLS Settings
  ssl: true,                         // Enable SSL
  sslValidate: true,                 // Validate SSL certificates
  sslCA: '/path/to/ca.pem',         // Certificate Authority file
  sslCert: '/path/to/client.pem',   // Client certificate file
  sslKey: '/path/to/client-key.pem', // Client private key file
  sslPass: 'keyPassword',            // Private key password
  sslCRL: '/path/to/crl.pem',       // Certificate Revocation List
  
  // Advanced Settings
  retryWrites: true,                 // Retry failed writes
  retryReads: true,                  // Retry failed reads
  compressors: ['zlib', 'snappy', 'zstd'], // Compression algorithms
  zlibCompressionLevel: 6,           // Zlib compression level (1-9)
  
  // GridFS Settings (for file storage)
  bucketName: 'fs',                  // GridFS bucket name
  chunkSizeBytes: 261120,            // GridFS chunk size
  
  // Monitoring and Debug
  monitorCommands: true,             // Monitor database commands
  loggerLevel: 'info',               // Logger level: error, warn, info, debug
  
  // Advanced Connection Options
  directConnection: false,           // Direct connection (bypass discovery)
  loadBalanced: false,               // Load balanced connection
  localThresholdMS: 15,              // Local threshold for server selection (ms)
  maxStalenessSeconds: 90,           // Max staleness for secondary reads (seconds)
  
  // Transaction Settings
  defaultTransactionOptions: {       // Default transaction options
    readConcern: 'snapshot',
    writeConcern: { w: 'majority' },
    readPreference: 'primary'
  }
});
```

### **Microsoft SQL Server Configuration**

```typescript
// Complete SQL Server configuration with all options
await restified.createDatabaseClient('mssql_main', {
  type: 'mssql',
  
  // Required Connection Parameters
  server: 'localhost',               // Server name or IP address
  port: 1433,                       // Port number (default: 1433)
  database: 'TestDB',               // Database name
  user: 'sa',                       // Username
  password: 'StrongPassword123!',   // Password
  
  // Authentication Methods
  domain: 'CORP',                   // Windows domain (for Windows auth)
  authentication: {                 // Authentication configuration
    type: 'default',                // 'default', 'ntlm', 'azure-active-directory-password'
    options: {
      userName: 'sa',
      password: 'StrongPassword123!',
      domain: 'CORP'
    }
  },
  
  // Connection Settings
  connectionTimeout: 15000,         // Connection timeout (ms)
  requestTimeout: 30000,            // Request timeout (ms)
  cancelTimeout: 5000,              // Cancel timeout (ms)
  
  // Connection Pool Settings
  pool: {
    max: 10,                        // Maximum connections
    min: 0,                         // Minimum connections
    acquireTimeoutMillis: 60000,    // Acquire timeout (ms)
    createTimeoutMillis: 30000,     // Create timeout (ms)
    destroyTimeoutMillis: 5000,     // Destroy timeout (ms)
    idleTimeoutMillis: 30000,       // Idle timeout (ms)
    reapIntervalMillis: 1000,       // Reap interval (ms)
    createRetryIntervalMillis: 200  // Retry interval (ms)
  },
  
  // Advanced Options
  options: {
    encrypt: true,                  // Use TLS encryption
    trustServerCertificate: false,  // Trust server certificate
    enableArithAbort: true,         // Enable ARITHABORT
    instanceName: 'SQLEXPRESS',     // SQL Server instance name
    useUTC: true,                   // Store dates in UTC
    dateFirst: 7,                   // First day of week (1-7)
    language: 'us_english',         // Default language
    rowCollectionOnDone: false,     // Collect rows on done
    rowCollectionOnRequestCompletion: false, // Collect rows on completion
    tdsVersion: '7_4',              // TDS version
    serverName: undefined,          // Server name (for certificate validation)
    camelCaseColumns: false,        // Use camelCase for column names
    columnNameReplacer: undefined,  // Column name replacement function
    isolationLevel: 'READ_COMMITTED', // Transaction isolation level
    connectionIsolationLevel: 'READ_COMMITTED', // Connection isolation level
    readOnlyIntent: false,          // Read-only intent
    cryptoCredentialsDetails: {},   // Crypto credentials
    debug: {                        // Debug options
      packet: false,
      data: false,
      payload: false,
      token: false
    }
  },
  
  // Bulk Import Settings
  bulk: {
    timeout: 15000,                 // Bulk operation timeout
    enableNumericRoundabort: false  // Enable numeric roundabort
  },
  
  // Alternative: Connection string format
  connectionString: 'Server=localhost,1433;Database=TestDB;User Id=sa;Password=StrongPassword123!;Encrypt=true;TrustServerCertificate=false;'
});
```

### **SQLite Configuration**

```typescript
// Complete SQLite configuration with all options
await restified.createDatabaseClient('sqlite_main', {
  type: 'sqlite',
  
  // Database File Settings
  filename: './database/test.db',     // Database file path (required)
  memory: false,                      // Use in-memory database
  readonly: false,                    // Open in read-only mode
  fileMustExist: false,               // Database file must exist
  
  // Connection Settings
  timeout: 5000,                      // Busy timeout (ms)
  verbose: console.log,               // Verbose logging function
  
  // Cache Settings
  cache: {
    size: 2000,                       // Cache size (pages)
    spill: true                       // Allow cache spill to disk
  },
  
  // Performance Settings
  journalMode: 'WAL',                 // Journal mode: DELETE, TRUNCATE, PERSIST, MEMORY, WAL, OFF
  synchronous: 'NORMAL',              // Synchronous mode: OFF, NORMAL, FULL, EXTRA
  tempStore: 'MEMORY',                // Temp store: DEFAULT, FILE, MEMORY
  mmapSize: 268435456,                // Memory-mapped I/O size (bytes)
  cacheSize: -2000,                   // Cache size (negative = KB, positive = pages)
  
  // WAL Mode Settings (when journalMode = 'WAL')
  walAutocheckpoint: 1000,            // WAL auto-checkpoint threshold
  walSynchronous: 'NORMAL',           // WAL synchronous mode
  walCheckpointRestart: true,         // Restart checkpoint on error
  
  // Pragma Settings
  pragmas: {                          // Additional PRAGMA statements
    'foreign_keys': 'ON',
    'journal_size_limit': 67108864,   // 64MB
    'max_page_count': 1073741823,
    'page_size': 4096,
    'temp_store': 'MEMORY',
    'locking_mode': 'NORMAL',         // NORMAL, EXCLUSIVE
    'secure_delete': 'ON',
    'auto_vacuum': 'INCREMENTAL',     // NONE, FULL, INCREMENTAL
    'incremental_vacuum': 100,
    'user_version': 1
  },
  
  // Function and Aggregation Registration
  functions: {                        // Custom SQL functions
    'REGEXP': (pattern, text) => new RegExp(pattern).test(text),
    'UUID': () => require('crypto').randomUUID()
  },
  
  aggregates: {                       // Custom SQL aggregates
    'STRING_AGG': {
      start: () => [],
      step: (total, value) => { total.push(value); return total; },
      result: (total) => total.join(',')
    }
  },
  
  // Backup Settings
  backup: {
    enabled: true,                    // Enable automatic backups
    interval: 3600000,                // Backup interval (ms)
    destination: './database/backups/', // Backup directory
    keepCount: 5                      // Number of backups to keep
  }
});

// In-memory database example
await restified.createDatabaseClient('sqlite_memory', {
  type: 'sqlite',
  memory: true,                       // In-memory database
  cache: { shared: true }             // Shared cache between connections
});
```

### **Oracle Database Configuration**

```typescript
// Complete Oracle configuration with all options
await restified.createDatabaseClient('oracle_main', {
  type: 'oracle',
  
  // Connection String Format (Recommended)
  connectString: 'localhost:1521/XE', // Easy Connect: host:port/service_name
  
  // OR TNS Format
  connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=XE)))',
  
  // OR Individual Parameters
  hostname: 'localhost',              // Database server hostname
  port: 1521,                        // Database port (default: 1521)
  serviceName: 'XE',                 // Oracle service name
  sid: 'XE',                         // Oracle SID (alternative to serviceName)
  
  // Authentication
  username: 'hr',                    // Database username
  password: 'oracle',                // Database password
  
  // Connection Pool Settings
  poolAlias: 'default',              // Pool alias name
  poolMax: 10,                       // Maximum connections in pool
  poolMin: 1,                        // Minimum connections in pool
  poolIncrement: 1,                  // Pool increment size
  poolTimeout: 60,                   // Pool timeout (seconds)
  poolPingInterval: 60,              // Pool ping interval (seconds)
  queueMax: 500,                     // Maximum queue requests
  queueTimeout: 60000,               // Queue timeout (ms)
  
  // Connection Settings
  connectionClass: 'POOLED',         // Connection class
  connectTimeout: 60000,             // Connection timeout (ms)
  callTimeout: 60000,                // Call timeout (ms)
  
  // Statement Settings
  stmtCacheSize: 30,                 // Statement cache size
  fetchArraySize: 100,               // Default fetch array size
  maxRows: 0,                        // Maximum rows (0 = no limit)
  outFormat: 'OBJECT',               // Output format: ARRAY, OBJECT
  
  // LOB Settings
  lobPrefetchSize: 16384,            // LOB prefetch size (bytes)
  
  // Advanced Settings
  autoCommit: false,                 // Auto-commit transactions
  enableStatistics: true,            // Enable connection statistics
  events: true,                      // Enable events
  extendedMetaData: false,           // Extended result metadata
  
  // Oracle Client Settings
  edition: 'ORA$BASE',               // Database edition
  clientId: 'RestifiedTS',           // Client identifier
  module: 'APITesting',              // Module name
  action: 'DatabaseValidation',      // Action name
  
  // Debugging and Monitoring
  debug: false,                      // Enable debug mode
  trace: false,                      // Enable SQL trace
  
  // Privilege Settings
  privilege: undefined,              // Connection privilege: SYSDBA, SYSOPER, SYSASM, SYSBACKUP, SYSDG, SYSKM, SYSRAC
  
  // Network Settings
  retryCount: 3,                     // Connection retry count
  retryDelay: 1000,                  // Retry delay (ms)
  
  // Wallet Settings (for Oracle Cloud)
  walletLocation: '/path/to/wallet', // Oracle Wallet location
  walletPassword: 'wallet_password'  // Oracle Wallet password
});

// Oracle Cloud Autonomous Database example
await restified.createDatabaseClient('oracle_cloud', {
  type: 'oracle',
  connectString: 'database_service_name_high',
  username: 'ADMIN',
  password: 'CloudPassword123!',
  walletLocation: '/opt/oracle/wallet',
  walletPassword: 'WalletPassword123!'
});
```

### **Redis Configuration**

```typescript
// Complete Redis configuration with all options
await restified.createDatabaseClient('redis_main', {
  type: 'redis',
  
  // Connection Settings
  host: 'localhost',                 // Redis server hostname
  port: 6379,                       // Redis server port (default: 6379)
  family: 4,                        // IP family: 4 (IPv4) or 6 (IPv6)
  
  // Authentication
  password: 'redispassword',         // Redis password
  username: 'default',               // Redis ACL username (Redis 6.0+)
  
  // Database Selection
  database: 0,                      // Redis database number (0-15)
  
  // Key Management
  keyPrefix: 'test:',               // Prefix for all keys
  
  // Connection Pool and Retry Settings
  maxRetriesPerRequest: 3,          // Max retries per request
  retryDelayOnFailover: 100,        // Retry delay on failover (ms)
  enableOfflineQueue: false,        // Enable offline command queue
  maxmemoryPolicy: 'allkeys-lru',   // Memory eviction policy
  
  // Timeout Settings
  connectTimeout: 10000,            // Connection timeout (ms)
  commandTimeout: 5000,             // Command timeout (ms)
  lazyConnect: true,                // Lazy connection establishment
  keepAlive: 30000,                 // TCP keep-alive interval (ms)
  
  // Retry and Reconnection
  retryConnectOnFailure: true,      // Retry connection on failure
  autoResubscribe: true,            // Auto-resubscribe on reconnect
  autoResendUnfulfilledCommands: true, // Resend unfulfilled commands
  
  // Cluster Settings (for Redis Cluster)
  cluster: {
    enableReadyCheck: true,         // Enable ready check
    redisOptions: {},               // Redis options for cluster nodes
    maxRedirections: 16,            // Max cluster redirections
    retryDelayOnMoved: 0,           // Retry delay on MOVED (ms)
    retryDelayOnFailover: 100,      // Retry delay on failover (ms)
    retryDelayOnClusterDown: 1000,  // Retry delay on cluster down (ms)
    slotsRefreshTimeout: 1000,      // Slots refresh timeout (ms)
    slotsRefreshInterval: 5000,     // Slots refresh interval (ms)
    scaleReads: 'master'            // Scale reads: master, slave, all
  },
  
  // Sentinel Settings (for Redis Sentinel)
  sentinel: {
    sentinels: [                    // Sentinel nodes
      { host: 'sentinel1', port: 26379 },
      { host: 'sentinel2', port: 26379 }
    ],
    name: 'mymaster',               // Master name
    sentinelPassword: 'sentinelpass', // Sentinel password
    sentinelUsername: 'sentinel',   // Sentinel username
    role: 'master',                 // Role: master, slave
    preferredSlaves: ['127.0.0.1:6380'], // Preferred slave nodes
    connectTimeout: 10000,          // Sentinel connection timeout
    commandTimeout: 5000            // Sentinel command timeout
  },
  
  // TLS/SSL Settings
  tls: {
    ca: '/path/to/ca.crt',         // Certificate Authority
    cert: '/path/to/client.crt',   // Client certificate
    key: '/path/to/client.key',    // Client private key
    rejectUnauthorized: true,      // Reject unauthorized certificates
    servername: 'redis.example.com' // Server name for SNI
  },
  
  // Stream Settings (for Redis Streams)
  streams: {
    block: 5000,                   // Block timeout for stream reads (ms)
    count: 100,                    // Default count for stream reads
    noAck: false,                  // No acknowledgment for stream reads
    trimStrategy: 'MAXLEN',        // Trim strategy: MAXLEN, MINID
    trimApproximate: true          // Use approximate trimming
  },
  
  // Pipeline Settings
  pipeline: {
    enableAutoPipelining: true,    // Enable automatic pipelining
    maxPipelineLength: 100         // Maximum pipeline length
  },
  
  // Monitoring and Debugging
  monitor: false,                   // Enable Redis MONITOR command
  debug: false,                     // Enable debug logging
  showFriendlyErrorStack: true      // Show friendly error stack traces
});

// Redis Cluster example
await restified.createDatabaseClient('redis_cluster', {
  type: 'redis',
  cluster: {
    nodes: [
      { host: 'redis-node-1', port: 7000 },
      { host: 'redis-node-2', port: 7001 },
      { host: 'redis-node-3', port: 7002 }
    ]
  },
  password: 'clusterpassword'
});
```

### **Elasticsearch Configuration**

```typescript
// Complete Elasticsearch configuration with all options
await restified.createDatabaseClient('elasticsearch_main', {
  type: 'elasticsearch',
  
  // Cluster Connection
  nodes: [                          // Elasticsearch cluster nodes
    'http://localhost:9200',
    'http://localhost:9201',
    'http://localhost:9202'
  ],
  
  // Alternative single node
  node: 'http://localhost:9200',
  
  // Authentication
  auth: {
    username: 'elastic',            // Basic auth username
    password: 'changeme',           // Basic auth password
    // OR API Key authentication
    apiKey: 'base64encodedapikey',  // Base64 encoded API key
    // OR Bearer token
    bearer: 'bearertoken'           // Bearer token
  },
  
  // SSL/TLS Configuration
  ssl: {
    ca: '/path/to/ca.crt',         // Certificate Authority
    cert: '/path/to/client.crt',   // Client certificate
    key: '/path/to/client.key',    // Client private key
    rejectUnauthorized: true,      // Reject unauthorized certificates
    checkServerIdentity: true,     // Check server identity
    passphrase: 'keypassphrase'    // Private key passphrase
  },
  
  // Request Settings
  requestTimeout: 30000,            // Request timeout (ms)
  pingTimeout: 3000,                // Ping timeout (ms)
  
  // Node Discovery
  sniffOnStart: true,               // Sniff nodes on start
  sniffInterval: 300000,            // Sniff interval (ms, false to disable)
  sniffOnConnectionFault: true,     // Sniff on connection fault
  
  // Retry and Circuit Breaker
  maxRetries: 3,                    // Maximum retry attempts
  deadTimeout: 60000,               // Dead node timeout (ms)
  resurrectStrategy: 'ping',        // Resurrect strategy: ping, optimistic, none
  
  // Compression
  compression: 'gzip',              // Request compression: gzip, false
  suggestCompression: true,         // Suggest compression to server
  
  // Connection Pool
  connections: {
    keepAlive: true,                // Keep connections alive
    keepAliveMsecs: 1000,           // Keep-alive interval (ms)
    maxSockets: 256,                // Maximum sockets per host
    maxFreeSockets: 256             // Maximum free sockets per host
  },
  
  // Headers and Agent
  headers: {                        // Default headers
    'User-Agent': 'RestifiedTS/1.0.0',
    'X-Client-Meta': 'es=8.0.0,js=8.0.0,t=8.0.0'
  },
  agent: undefined,                 // Custom HTTP agent
  
  // Cloud Settings (for Elastic Cloud)
  cloud: {
    id: 'cluster-id:base64encodedendpoint', // Cloud ID
    username: 'elastic',            // Cloud username
    password: 'cloudpassword'       // Cloud password
  },
  
  // Default Index Settings
  index: 'test-index',              // Default index for operations
  type: '_doc',                     // Default document type
  
  // Bulk Operations
  bulk: {
    timeout: '30s',                 // Bulk operation timeout
    refresh: false,                 // Refresh after bulk operations
    waitForActiveShards: 1,         // Wait for active shards
    routing: undefined,             // Routing value
    pipeline: undefined             // Ingest pipeline
  },
  
  // Search Settings
  search: {
    timeout: '30s',                 // Search timeout
    size: 10,                       // Default search size
    from: 0,                        // Default search offset
    preference: undefined,          // Search preference
    routing: undefined,             // Search routing
    scroll: '1m',                   // Scroll timeout
    searchType: 'query_then_fetch', // Search type
    allowNoIndices: true,           // Allow operations on non-existent indices
    expandWildcards: 'open',        // Wildcard expansion: open, closed, hidden, none, all
    ignoreUnavailable: false        // Ignore unavailable indices
  },
  
  // Monitoring and Debugging
  log: {                           // Logging configuration
    level: 'info',                 // Log level: error, warning, info, debug, trace
    type: 'stdio'                  // Log type: stdio, file
  },
  
  // Custom Serializer
  serializer: undefined,            // Custom JSON serializer
  
  // Transport Settings
  transport: {
    compression: 'gzip',            // Transport compression
    headers: {}                     // Transport headers
  }
});

// Elastic Cloud example
await restified.createDatabaseClient('elasticsearch_cloud', {
  type: 'elasticsearch',
  cloud: {
    id: 'my-deployment:dXMtZWFzdC0xLmF3cy5mb3VuZC5pbyRjZWM2ZjI2MWE3NGJmMjRjZTMzYmI4ODExYjg0Mjk0ZiRjNmMyY2E2ZDA0MjI0OWFmMGNjN2Q3YTllOTYyNTc0Mw=='
  },
  auth: {
    username: 'elastic',
    password: 'elastic_cloud_password'
  }
});
```

---

## 🔍 **Database State Validation**

### **Comprehensive Validation Examples**

```typescript
// Complex validation scenarios for different database types
const comprehensiveValidation = await restified.validateDatabaseState([
  
  // PostgreSQL - Complex query with joins and aggregations
  {
    client: 'postgres',
    validationType: 'query',
    customQuery: `
      SELECT 
        u.department,
        COUNT(*) as total_users,
        COUNT(CASE WHEN u.active = true THEN 1 END) as active_users,
        AVG(CASE WHEN u.active = true THEN u.salary END) as avg_active_salary
      FROM users u
      JOIN departments d ON u.department_id = d.id
      WHERE u.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY u.department
      HAVING COUNT(*) > 5
      ORDER BY total_users DESC
    `,
    expectedResult: {
      rowCount: { min: 3, max: 10 },
      columns: ['department', 'total_users', 'active_users', 'avg_active_salary'],
      constraints: [
        { column: 'total_users', condition: 'value > 5' },
        { column: 'active_users', condition: 'value <= total_users' },
        { column: 'avg_active_salary', condition: 'value > 0' }
      ]
    },
    timeout: 30000
  },
  
  // MySQL - Table structure and constraint validation
  {
    client: 'mysql',
    validationType: 'schema',
    checks: [
      {
        type: 'table_exists',
        table: 'orders',
        required: true
      },
      {
        type: 'column_exists',
        table: 'orders',
        column: 'id',
        dataType: 'int',
        nullable: false,
        autoIncrement: true
      },
      {
        type: 'foreign_key',
        table: 'orders',
        column: 'customer_id',
        referencedTable: 'customers',
        referencedColumn: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      },
      {
        type: 'index_exists',
        table: 'orders',
        indexName: 'idx_orders_customer_date',
        columns: ['customer_id', 'order_date'],
        unique: false
      },
      {
        type: 'check_constraint',
        table: 'orders',
        constraint: 'total_amount > 0',
        enabled: true
      }
    ]
  },
  
  // MongoDB - Document validation and aggregation
  {
    client: 'mongo',
    collection: 'products',
    validationType: 'aggregation',
    pipeline: [
      { $match: { status: 'active', category: { $in: ['electronics', 'books'] } } },
      { $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          maxPrice: { $max: '$price' },
          minPrice: { $min: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ],
    expectedResult: {
      documents: { min: 2, max: 5 },
      validation: [
        { field: 'count', condition: 'value >= 10' },
        { field: 'avgPrice', condition: 'value > 0 && value < 10000' },
        { field: 'maxPrice', condition: 'value >= avgPrice' },
        { field: 'minPrice', condition: 'value <= avgPrice' }
      ]
    }
  },
  
  // Redis - Key existence and data type validation
  {
    client: 'redis',
    validationType: 'keys',
    checks: [
      {
        key: 'user:session:*',
        pattern: true,
        expectedCount: { min: 0, max: 100 },
        ttl: { min: 0, max: 3600 }
      },
      {
        key: 'config:app:version',
        dataType: 'string',
        exists: true,
        value: { regex: '^\\d+\\.\\d+\\.\\d+$' }
      },
      {
        key: 'stats:daily:*',
        pattern: true,
        dataType: 'hash',
        fields: ['visits', 'users', 'revenue'],
        fieldTypes: { visits: 'number', users: 'number', revenue: 'number' }
      }
    ]
  },
  
  // Performance validation across multiple databases
  {
    client: 'postgres',
    validationType: 'performance',
    checks: [
      {
        name: 'user_lookup_by_email',
        query: 'SELECT * FROM users WHERE email = $1',
        parameters: ['test@example.com'],
        maxExecutionTime: 50,
        explain: true,
        expectedPlan: {
          nodeType: 'Index Scan',
          indexName: 'users_email_idx'
        }
      },
      {
        name: 'complex_reporting_query',
        query: `
          SELECT 
            DATE_TRUNC('day', created_at) as date,
            COUNT(*) as orders,
            SUM(total_amount) as revenue
          FROM orders 
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE_TRUNC('day', created_at)
          ORDER BY date
        `,
        maxExecutionTime: 2000,
        maxRows: 31
      }
    ]
  },
  
  // Data quality validation
  {
    client: 'mysql',
    validationType: 'data_quality',
    table: 'customers',
    checks: [
      {
        type: 'null_check',
        columns: ['email', 'name', 'created_at'],
        allowNull: false
      },
      {
        type: 'unique_check',
        columns: ['email'],
        duplicatesAllowed: 0
      },
      {
        type: 'format_check',
        column: 'email',
        regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
      },
      {
        type: 'range_check',
        column: 'age',
        min: 0,
        max: 150
      },
      {
        type: 'referential_integrity',
        column: 'country_id',
        referencedTable: 'countries',
        referencedColumn: 'id',
        orphansAllowed: 0
      }
    ]
  },
  
  // Cross-database consistency check
  {
    validationType: 'cross_database',
    checks: [
      {
        name: 'user_count_consistency',
        databases: [
          {
            client: 'postgres',
            query: 'SELECT COUNT(*) as count FROM users WHERE active = true'
          },
          {
            client: 'mongo',
            collection: 'user_profiles',
            query: { active: true },
            operation: 'count'
          }
        ],
        tolerance: 0.02, // 2% tolerance
        comparisonType: 'absolute'
      }
    ]
  }
]);
```

### **Database State Setup and Teardown**

```typescript
// Comprehensive test data setup
describe('E-commerce API Tests', function() {
  before(async function() {
    this.timeout(60000); // Extended timeout for setup
    
    await restified.setupDatabaseState([
      // PostgreSQL - Create test users and roles
      {
        client: 'postgres',
        action: 'execute',
        statements: [
          'BEGIN;',
          `INSERT INTO roles (name, permissions) VALUES 
           ('admin', '["read", "write", "delete"]'),
           ('user', '["read", "write"]'),
           ('viewer', '["read"]');`,
          `INSERT INTO users (name, email, role_id, active, created_at) VALUES
           ('Admin User', 'admin@test.com', (SELECT id FROM roles WHERE name = 'admin'), true, NOW()),
           ('Regular User', 'user@test.com', (SELECT id FROM roles WHERE name = 'user'), true, NOW()),
           ('Inactive User', 'inactive@test.com', (SELECT id FROM roles WHERE name = 'user'), false, NOW());`,
          'COMMIT;'
        ]
      },
      
      // MongoDB - Create test products and categories
      {
        client: 'mongo',
        collection: 'categories',
        action: 'insertMany',
        data: [
          { _id: 'electronics', name: 'Electronics', active: true },
          { _id: 'books', name: 'Books', active: true },
          { _id: 'clothing', name: 'Clothing', active: true }
        ]
      },
      {
        client: 'mongo',
        collection: 'products',
        action: 'insertMany',
        data: [
          {
            name: 'Laptop Pro',
            category: 'electronics',
            price: 1299.99,
            stock: 50,
            active: true,
            tags: ['computer', 'laptop', 'professional'],
            specifications: {
              cpu: 'Intel i7',
              ram: '16GB',
              storage: '512GB SSD'
            }
          },
          {
            name: 'Programming Book',
            category: 'books',
            price: 49.99,
            stock: 100,
            active: true,
            tags: ['programming', 'education', 'technology'],
            author: 'John Doe',
            isbn: '978-0123456789'
          }
        ]
      },
      
      // Redis - Set up configuration and session data
      {
        client: 'redis',
        action: 'multi',
        commands: [
          ['SET', 'config:app:version', '1.0.0'],
          ['SET', 'config:app:environment', 'test'],
          ['HSET', 'config:features', 'feature1', 'enabled', 'feature2', 'disabled'],
          ['SET', 'user:session:test123', JSON.stringify({ userId: 1, loginTime: Date.now() }), 'EX', 3600],
          ['ZADD', 'leaderboard:test', 100, 'user1', 95, 'user2', 90, 'user3']
        ]
      },
      
      // MySQL - Set up order test data
      {
        client: 'mysql',
        action: 'transaction',
        statements: [
          {
            query: 'INSERT INTO customers (name, email, country_id) VALUES (?, ?, ?)',
            parameters: ['Test Customer', 'customer@test.com', 1]
          },
          {
            query: 'SET @customer_id = LAST_INSERT_ID()'
          },
          {
            query: `INSERT INTO orders (customer_id, order_date, status, total_amount) VALUES 
                     (@customer_id, NOW(), 'completed', 99.99),
                     (@customer_id, NOW() - INTERVAL 1 DAY, 'pending', 149.99)`
          }
        ]
      },
      
      // Elasticsearch - Index test documents
      {
        client: 'elasticsearch',
        action: 'bulk',
        index: 'test-products',
        documents: [
          {
            index: { _id: 'prod1' },
            doc: {
              name: 'Test Product 1',
              category: 'electronics',
              price: 299.99,
              description: 'High-quality electronic device',
              tags: ['electronics', 'gadget', 'portable'],
              created_at: new Date().toISOString()
            }
          },
          {
            index: { _id: 'prod2' },
            doc: {
              name: 'Test Product 2',
              category: 'books',
              price: 19.99,
              description: 'Educational programming book',
              tags: ['books', 'programming', 'education'],
              created_at: new Date().toISOString()
            }
          }
        ]
      }
    ]);
    
    // Wait for Elasticsearch to refresh indices
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  after(async function() {
    this.timeout(30000); // Extended timeout for cleanup
    
    await restified.cleanupDatabaseState([
      // PostgreSQL cleanup
      {
        client: 'postgres',
        action: 'execute',
        statements: [
          'DELETE FROM users WHERE email LIKE \'%@test.com\'',
          'DELETE FROM roles WHERE name IN (\'admin\', \'user\', \'viewer\')'
        ]
      },
      
      // MongoDB cleanup
      {
        client: 'mongo',
        collection: 'products',
        action: 'deleteMany',
        filter: { name: { $regex: '^Test|Laptop Pro|Programming Book$' } }
      },
      {
        client: 'mongo',
        collection: 'categories',
        action: 'deleteMany',
        filter: { _id: { $in: ['electronics', 'books', 'clothing'] } }
      },
      
      // Redis cleanup
      {
        client: 'redis',
        action: 'multi',
        commands: [
          ['DEL', 'config:app:version', 'config:app:environment'],
          ['DEL', 'config:features'],
          ['DEL', 'user:session:test123'],
          ['DEL', 'leaderboard:test']
        ]
      },
      
      // MySQL cleanup
      {
        client: 'mysql',
        action: 'execute',
        statements: [
          'DELETE FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE email = \'customer@test.com\')',
          'DELETE FROM customers WHERE email = \'customer@test.com\''
        ]
      },
      
      // Elasticsearch cleanup
      {
        client: 'elasticsearch',
        action: 'delete_by_query',
        index: 'test-products',
        query: {
          terms: {
            '_id': ['prod1', 'prod2']
          }
        }
      }
    ]);
  });
  
  it('should validate cross-database consistency', async function() {
    const validation = await restified.validateDatabaseState([
      {
        client: 'postgres',
        table: 'users',
        conditions: { active: true },
        expectedCount: { min: 1, max: 5 }
      },
      {
        client: 'mongo',
        collection: 'products',
        conditions: { active: true },
        expectedCount: { min: 1, max: 10 }
      }
    ]);
    
    expect(validation.success).to.be.true;
    expect(validation.results).to.have.length(2);
  });
});
```

---

## 🎯 **Best Practices**

### **Connection Management**
- Use connection pooling for production environments
- Always close connections in cleanup hooks
- Monitor connection pool metrics
- Use appropriate timeout values for your use case

### **Security**
- Never hardcode credentials in configuration
- Use environment variables for sensitive data
- Enable SSL/TLS for production databases
- Implement proper authentication and authorization

### **Performance**
- Use prepared statements for repeated queries
- Implement proper indexing strategies
- Monitor query performance and execution plans
- Use read replicas for read-heavy workloads

### **Error Handling**
- Implement retry logic for transient failures
- Use transactions for data consistency
- Log database errors with appropriate detail
- Handle connection timeouts gracefully

The comprehensive database integration system provides enterprise-grade support for all major database types with complete configuration options, validation capabilities, and best practices for production use.