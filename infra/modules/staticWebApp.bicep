param name string
param location string
param apiBackendUrl string

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // GitHub Actions deploys the built app via the SWA deploy token — no
    // repo/branch wired here so this resource works with any CI setup.
    provider: 'None'
  }
}

resource appSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    VITE_API_BASE_URL: apiBackendUrl
  }
}

output name string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
