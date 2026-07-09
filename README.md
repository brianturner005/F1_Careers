# F1 Job Radar

A single, searchable feed of every open job across Formula 1 teams and their
technology partners — normalized from each team's own careers site, with
saved searches and alerts (Phase 2). See `docs/` for the full project brief
and source survey.

## Status: Phase 1 (in progress)

Five sources flowing end-to-end: collector → normalize/dedupe/diff → Azure
SQL → API → web feed:

- Red Bull Racing, Mercedes-AMG Petronas, Alpine — all Workday
- Aston Martin Aramco — Pinpoint
- Cadillac F1 — Workable

The feed UI supports filtering (team, category, workplace type, employment
type) and full-text search, and there's a Source Health view for collector
status. Remaining Phase 1 work: the 6 teams whose ATS platform is still
unconfirmed (Racing Bulls, Ferrari, McLaren, Williams, Haas, Audi) — see
`docs/sources.md` for status per source.

## Structure

```
apps/
  web/         React (Vite) PWA — job feed (filters/search) + Source Health view
  api/         Azure Functions HTTP API (GET /api/jobs, GET /api/sources)
  collectors/  Azure Functions timer triggers, one per source, behind a
               shared Collector interface (apps/collectors/src/shared).
               ATS clients (Workday, Pinpoint, Workable) are shared across
               the sources that use them.
packages/
  schema/      Shared TypeScript types (Job, Source, CollectorRun, enums)
  db/          Azure SQL access layer shared by api and collectors
infra/         Bicep templates for the Azure resources
docs/          Project brief, source survey (docs/sources.md)
```

## Local development

Requires Node 22+ and npm.

```sh
npm install
npm run build   # builds every workspace package in dependency order
npm test        # runs unit tests across all workspaces
npm run lint
```

To run the API or collectors Functions locally you'll also need the
[Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
installed globally (`npm install -g azure-functions-core-tools@4`, not a
project dependency — its postinstall downloads a native CLI binary that
doesn't belong pinned per-workspace) and a `local.settings.json` (copy
`local.settings.json.example` in each app and fill in `SQL_CONNECTION_STRING`).

```sh
# apps/api or apps/collectors
cp local.settings.json.example local.settings.json
npm run watch     # tsc -b -w in one terminal
npm start         # func start in another
```

For the web app:

```sh
cd apps/web
cp .env.example .env
npm run dev
```

## Deployment

See `infra/README.md` for the Bicep deploy steps and `.github/workflows/`
for CI (build/lint/test on every PR) and the deploy workflow (currently
flagged with a known monorepo-packaging caveat — see the comment at the top
of `deploy.yml` before relying on it).
