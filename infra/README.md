# Infrastructure

Bicep templates for the Phase 0 stack: one Storage Account (Function runtime
storage), Application Insights + Log Analytics, one Azure SQL server/database
(serverless, auto-pausing), two Function Apps (api, collectors — Linux
consumption plan), and one Static Web App (web).

## Deploy

```sh
az group create --name f1-job-radar-dev --location eastus2

az deployment group create \
  --resource-group f1-job-radar-dev \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.example.json \
  --parameters sqlAdminLogin=<login> sqlAdminPassword=<password>
```

Then run the `packages/db/src/migrations/*.sql` files against the new
database (e.g. via `sqlcmd` or the Azure Portal query editor) before the
first collector run.

## Notes

- Static Web Apps is only available in a handful of regions
  (`staticWebAppLocation` defaults to `eastus2`) — kept independent of the
  resource group's own `location` so the rest of the stack isn't forced into
  a Static Web Apps region.
- SQL connection string is passed to both Function Apps as a plain app
  setting for Phase 0 simplicity. Move it to Key Vault + managed identity
  before Phase 2 (both Function Apps already have `SystemAssigned` identities
  provisioned, ready for that switch).
- The SQL firewall rule `AllowAllAzureServices` (0.0.0.0-0.0.0.0) is the
  Azure-documented shortcut for "any Azure-hosted resource may connect" —
  revisit with VNet integration if this becomes a public-facing concern.
