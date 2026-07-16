param accountName string
param databaseName string
param location string

// Free tier (1000 RU/s + 25GB storage, permanently $0) only applies to
// *provisioned* throughput, not the "serverless" capacity mode -- so this
// deliberately does NOT set the EnableServerless capability. Throughput is
// set once at the database level (shared across every container below)
// rather than per-container, since 8 containers each with their own
// dedicated 400 RU/s minimum would blow well past the free 1000 RU/s.
resource account 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableFreeTier: true
    locations: [
      { locationName: location, failoverPriority: 0 }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: account
  name: databaseName
  properties: {
    resource: { id: databaseName }
    options: { throughput: 1000 }
  }
}

// Partition keys are chosen to match each container's dominant access
// pattern -- e.g. jobs by /source (collectors read/write one source at a
// time), savedSearches by /userId (the API always scopes to the signed-in
// user) -- so the common queries are single-partition, not cross-partition
// scans. `users` gets a unique-key policy on /email to preserve the same
// uniqueness guarantee the old SQL UNIQUE constraint had.
var containers = [
  { name: 'jobs', partitionKeyPath: '/source', uniqueKeyPaths: [] }
  { name: 'sources', partitionKeyPath: '/id', uniqueKeyPaths: [] }
  { name: 'collectorRuns', partitionKeyPath: '/source', uniqueKeyPaths: [] }
  { name: 'users', partitionKeyPath: '/id', uniqueKeyPaths: ['/email'] }
  { name: 'magicLinkTokens', partitionKeyPath: '/tokenHash', uniqueKeyPaths: [] }
  { name: 'sessions', partitionKeyPath: '/tokenHash', uniqueKeyPaths: [] }
  { name: 'savedSearches', partitionKeyPath: '/userId', uniqueKeyPaths: [] }
  { name: 'alertLog', partitionKeyPath: '/savedSearchId', uniqueKeyPaths: [] }
]

resource sqlContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = [
  for c in containers: {
    parent: database
    name: c.name
    properties: {
      resource: {
        id: c.name
        partitionKey: {
          paths: [c.partitionKeyPath]
          kind: 'Hash'
        }
        uniqueKeyPolicy: empty(c.uniqueKeyPaths)
          ? null
          : {
              uniqueKeys: [{ paths: c.uniqueKeyPaths }]
            }
      }
      // No per-container throughput -- draws from the database's shared pool.
    }
  }
]

output endpoint string = account.properties.documentEndpoint
output connectionString string = 'AccountEndpoint=${account.properties.documentEndpoint};AccountKey=${account.listKeys().primaryMasterKey};'
