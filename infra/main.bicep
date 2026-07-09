targetScope = 'resourceGroup'

@description('Short project prefix used to name resources, e.g. f1jobradar')
param prefix string = 'f1jobradar'

@description('Environment name, e.g. dev, prod')
param environmentName string = 'dev'

param location string = resourceGroup().location

@description('Static Web Apps is only available in a subset of regions; kept separate from `location` so the rest of the stack can live wherever the resource group does.')
param staticWebAppLocation string = 'eastus2'

@description('SQL admin login — pass at deploy time, do not hardcode.')
param sqlAdminLogin string

@secure()
@description('SQL admin password — pass at deploy time, do not hardcode.')
param sqlAdminPassword string

@description('Public URL of the web app, used to build magic-link sign-in URLs in emails. The Static Web App\'s real hostname is only known after first deploy (or once a custom domain is attached) — update this parameter and redeploy, or set it directly with `az functionapp config appsettings set`, once you know it.')
param webBaseUrl string = 'https://REPLACE-WITH-YOUR-STATIC-WEB-APP-HOSTNAME'

@description('Resend API key for sending magic-link and digest emails. Leave empty to fall back to console-logging emails instead of sending them (see packages/email) — fine for a first deploy, not for production.')
@secure()
param resendApiKey string = ''

@description('From address for outgoing emails (required once resendApiKey is set).')
param emailFrom string = ''

var uniqueSuffix = uniqueString(resourceGroup().id)
var storageAccountName = toLower('${prefix}st${uniqueSuffix}')
var appInsightsName = '${prefix}-${environmentName}-ai'
var sqlServerName = toLower('${prefix}-${environmentName}-sql-${uniqueSuffix}')
var sqlDatabaseName = '${prefix}db'
var apiFunctionAppName = '${prefix}-${environmentName}-api'
var collectorsFunctionAppName = '${prefix}-${environmentName}-collectors'
var alertsFunctionAppName = '${prefix}-${environmentName}-alerts'
var staticWebAppName = '${prefix}-${environmentName}-web'

var emailAppSettings = [
  { name: 'RESEND_API_KEY', value: resendApiKey }
  { name: 'EMAIL_FROM', value: emailFrom }
]

module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    name: storageAccountName
    location: location
  }
}

module appInsights 'modules/appInsights.bicep' = {
  name: 'appInsights'
  params: {
    name: appInsightsName
    location: location
  }
}

module sql 'modules/sql.bicep' = {
  name: 'sql'
  params: {
    serverName: sqlServerName
    databaseName: sqlDatabaseName
    location: location
    adminLogin: sqlAdminLogin
    adminPassword: sqlAdminPassword
  }
}

var sqlConnectionString = 'Server=tcp:${sql.outputs.serverFqdn},1433;Database=${sql.outputs.databaseName};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;'

// CORS is wide open (browser calls this from the web app's origin, which we
// don't know ahead of the Static Web App's own deploy — see webBaseUrl
// above). Safe here because auth uses a bearer token, never cookies/credentials.
module apiFunctionApp 'modules/functionApp.bicep' = {
  name: 'apiFunctionApp'
  params: {
    name: apiFunctionAppName
    location: location
    storageAccountName: storage.outputs.name
    storageConnectionString: storage.outputs.connectionString
    appInsightsConnectionString: appInsights.outputs.connectionString
    sqlConnectionString: sqlConnectionString
    corsAllowedOrigins: ['*']
    extraAppSettings: concat(emailAppSettings, [{ name: 'WEB_BASE_URL', value: webBaseUrl }])
  }
}

module collectorsFunctionApp 'modules/functionApp.bicep' = {
  name: 'collectorsFunctionApp'
  params: {
    name: collectorsFunctionAppName
    location: location
    storageAccountName: storage.outputs.name
    storageConnectionString: storage.outputs.connectionString
    appInsightsConnectionString: appInsights.outputs.connectionString
    sqlConnectionString: sqlConnectionString
  }
}

module alertsFunctionApp 'modules/functionApp.bicep' = {
  name: 'alertsFunctionApp'
  params: {
    name: alertsFunctionAppName
    location: location
    storageAccountName: storage.outputs.name
    storageConnectionString: storage.outputs.connectionString
    appInsightsConnectionString: appInsights.outputs.connectionString
    sqlConnectionString: sqlConnectionString
    extraAppSettings: emailAppSettings
  }
}

module staticWebApp 'modules/staticWebApp.bicep' = {
  name: 'staticWebApp'
  params: {
    name: staticWebAppName
    location: staticWebAppLocation
    apiBackendUrl: 'https://${apiFunctionApp.outputs.name}.azurewebsites.net'
  }
}

output apiFunctionAppName string = apiFunctionApp.outputs.name
output collectorsFunctionAppName string = collectorsFunctionApp.outputs.name
output alertsFunctionAppName string = alertsFunctionApp.outputs.name
output staticWebAppName string = staticWebApp.outputs.name
output staticWebAppHostname string = staticWebApp.outputs.defaultHostname
