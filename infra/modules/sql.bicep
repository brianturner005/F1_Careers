param serverName string
param databaseName string
param location string

@description('SQL admin login — pass at deploy time, do not hardcode.')
param adminLogin string

@secure()
@description('SQL admin password — pass at deploy time, do not hardcode.')
param adminPassword string

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: serverName
  location: location
  properties: {
    administratorLogin: adminLogin
    administratorLoginPassword: adminPassword
    minimalTlsVersion: '1.2'
  }
}

// Serverless tier: auto-pauses after 1h idle, scales 0.5-1 vCore.
// Keeps this well within the brief's "low tens of dollars/month or less" target.
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1
  }
  properties: {
    autoPauseDelay: 60
    minCapacity: json('0.5')
  }
}

// Allows Azure services (Function Apps) to reach the server without a static
// egress IP allowlist — fine for Phase 0, revisit with VNet integration later.
resource allowAzureServices 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output serverFqdn string = sqlServer.properties.fullyQualifiedDomainName
output databaseName string = sqlDatabase.name
