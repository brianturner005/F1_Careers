param name string
param location string
param storageAccountName string
param storageConnectionString string
param appInsightsConnectionString string

@secure()
param sqlConnectionString string

@description('Browser origins allowed to call this Function App. Leave empty for Function Apps nothing in a browser calls directly (collectors, alerts).')
param corsAllowedOrigins array = []

@description('Additional app settings beyond the baseline (e.g. RESEND_API_KEY, EMAIL_FROM, WEB_BASE_URL).')
param extraAppSettings array = []

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${name}-plan'
  location: location
  kind: 'functionapp,linux'
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20'
      cors: {
        allowedOrigins: corsAllowedOrigins
      }
      appSettings: concat(
        [
          { name: 'AzureWebJobsStorage', value: storageConnectionString }
          { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
          { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
          { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
          { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
          { name: 'SQL_CONNECTION_STRING', value: sqlConnectionString }
        ],
        extraAppSettings
      )
    }
  }
}

output name string = functionApp.name
output principalId string = functionApp.identity.principalId
