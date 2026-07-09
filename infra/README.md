# Infrastructure

Bicep templates for the stack: one Storage Account (Function runtime
storage), Application Insights + Log Analytics, one Azure SQL server/database
(serverless, auto-pausing), three Function Apps (api, collectors, alerts —
Linux consumption plan), and one Static Web App (web).

## Deploy

```sh
az group create --name f1-job-radar-dev --location eastus2

az deployment group create \
  --resource-group f1-job-radar-dev \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.example.json \
  --parameters sqlAdminLogin=<login> sqlAdminPassword=<password>
```

Then run the `packages/db/src/migrations/*.sql` files, in order, against the
new database (e.g. via `sqlcmd` or the Azure Portal query editor) before the
first collector run.

### After first deploy

- Note the Static Web App's hostname from the deployment output
  (`staticWebAppHostname`) or a custom domain once attached, then redeploy
  with `webBaseUrl` set to it (or update the `api` Function App's
  `WEB_BASE_URL` app setting directly) — magic-link emails build their
  sign-in URL from this.
- Set `resendApiKey` + `emailFrom` (a [Resend](https://resend.com) account)
  once you're ready to actually send email. Until then, both the `api` and
  `alerts` Function Apps fall back to console-logging emails instead of
  sending them (see `packages/email`) — fine for confirming the pipeline
  runs, not for real users.

## Notes

- Static Web Apps is only available in a handful of regions
  (`staticWebAppLocation` defaults to `eastus2`) — kept independent of the
  resource group's own `location` so the rest of the stack isn't forced into
  a Static Web Apps region.
- The `api` Function App has CORS wide open (`allowedOrigins: ['*']`)
  because its own origin isn't known until after the Static Web App is
  deployed (see `webBaseUrl` above — same circular-dependency shape). This is
  safe here because sessions are a bearer token, never a cookie, so there's
  no credentialed-request/wildcard-CORS conflict to worry about.
- SQL connection string is passed to all three Function Apps as a plain app
  setting for now. Move it to Key Vault + managed identity as a hardening
  pass (all three already have `SystemAssigned` identities provisioned,
  ready for that switch).
- The SQL firewall rule `AllowAllAzureServices` (0.0.0.0-0.0.0.0) is the
  Azure-documented shortcut for "any Azure-hosted resource may connect" —
  revisit with VNet integration if this becomes a public-facing concern.
