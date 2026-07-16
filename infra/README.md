# Infrastructure

Bicep templates for the stack: one Storage Account (Function runtime
storage), Application Insights + Log Analytics, one Azure Cosmos DB account
(free tier — 1000 RU/s + 25GB, permanently $0 as long as usage stays under
that) with 8 containers sharing that throughput, three Function Apps (api,
collectors, alerts — Linux consumption plan), and one Static Web App (web).

## Deploy

```sh
az group create --name f1-job-radar-dev --location eastus2

az deployment group create \
  --resource-group f1-job-radar-dev \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.example.json
```

Then run `node scripts/seed-cosmos.mjs` (see its own header comment for the
env vars it needs) once, against the new Cosmos account, to seed the
`sources` container before the first collector run.

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
- Cosmos free tier is granted per Azure subscription — only the _first_
  Cosmos DB account created in a subscription can have `enableFreeTier: true`
  and get the discount. If this subscription already has another free-tier
  Cosmos account elsewhere, this deploy will still succeed but won't actually
  be free.
- Cosmos free tier only applies to _provisioned_ throughput, not the
  "serverless" capacity mode — `cosmos.bicep` deliberately uses provisioned
  mode with `enableFreeTier: true`, not `EnableServerless`. Unlike the
  previous Azure SQL setup, there's no pause/resume state to worry about:
  the free 1000 RU/s + 25GB is a flat, permanent allowance regardless of
  activity level, so there's no equivalent of the SQL auto-pause /
  leaked-connection cost risk this project hit earlier.
- Cosmos connection string is passed to all three Function Apps as a plain
  app setting for now. Move it to Key Vault + managed identity as a
  hardening pass (all three already have `SystemAssigned` identities
  provisioned, ready for that switch).
