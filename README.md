# Paddock Jobs

A single, searchable feed of every open job across motorsport teams and their
technology partners — normalized from each team's own careers site, with
accounts, saved searches, and email alerts. Currently covers Formula 1;
WEC/IMSA endurance racing is next (see `docs/sources.md`).

📄 **[Project overview / landing page →](https://brianturner005.github.io/F1_Careers/)**
(once GitHub Pages is enabled — see `docs/index.html`)

See `docs/` for the full project brief and source survey.

## Status: Phase 3 (in progress)

Seven sources flowing end-to-end: collector → normalize/dedupe/diff → Azure
Cosmos DB → API → web feed:

- Red Bull Racing, Mercedes-AMG Petronas, Alpine, Formula One Management — all Workday
- Aston Martin Aramco — Pinpoint
- Cadillac F1 — Workable
- Pirelli — Trakstar (RSS/XML feed; Trakstar has no public JSON API)

The feed UI supports filtering (team, category, workplace type, employment
type) and full-text search, plus a Source Health view for collector status.
Passwordless (magic-link) accounts let signed-in users save a search and get
a daily or weekly email digest of new matches — verified end-to-end in a
real browser against a mock API (sign-in → verify → save search → list →
delete). Real email sending needs a Resend API key configured at deploy time
(see `infra/README.md`); without one, both the API and alerts worker
console-log emails instead of sending them.

Phase 3 additions: a Hiring Trends view (postings-opened-per-company over a
configurable window, derived entirely from existing `firstSeenAt`
history — no new data collection needed) and a "New This Week" shareable
page grouped by team.

Remaining Phase 1 work: the 6 teams whose ATS platform is still unconfirmed
(Racing Bulls, Ferrari, McLaren, Williams, Haas, Audi), plus a few
supplier/adjacent-series sources still unconfirmed (McLaren Applied,
Cosworth, Bosch Motorsport, Formula E) — see `docs/sources.md` for status
per source.

## Structure

```
apps/
  web/         React (Vite) PWA — job feed (filters/search), Source Health,
               sign-in/saved searches, About page
  api/         Azure Functions HTTP API: jobs, sources, auth (magic link),
               saved searches
  collectors/  Azure Functions timer triggers, one per source, behind a
               shared Collector interface (apps/collectors/src/shared).
               ATS clients (Workday, Pinpoint, Workable, Trakstar) are
               shared across the sources that use them.
  alerts/      Azure Functions timer triggers: daily/weekly digest worker
packages/
  schema/      Shared TypeScript types (Job, Source, User, SavedSearch, enums)
  db/          Azure Cosmos DB access layer shared by api, collectors, and alerts
  email/       EmailSender abstraction (Resend, or console-log fallback)
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

To run the API, collectors, or alerts Functions locally you'll also need the
[Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
installed globally (`npm install -g azure-functions-core-tools@4`, not a
project dependency — its postinstall downloads a native CLI binary that
doesn't belong pinned per-workspace) and a `local.settings.json` (copy
`local.settings.json.example` in each app and fill in
`COSMOS_CONNECTION_STRING`/`COSMOS_DATABASE_NAME`; `api` and `alerts` also
take `RESEND_API_KEY`/`EMAIL_FROM`, and `api` takes `WEB_BASE_URL` for
building magic-link URLs). Run `node scripts/seed-cosmos.mjs` once against
a fresh Cosmos account to populate the `sources` container before the first
collector run.

```sh
# apps/api, apps/collectors, or apps/alerts
cp local.settings.json.example local.settings.json
npm run build     # regenerates dist/bundle.js, which "main" points at
npm start         # func start
```

Each Function App's `package.json` `"main"` points at `dist/bundle.js` — a
single esbuild-bundled file with every `@f1-job-radar/*` package and
third-party dependency inlined (see `apps/*/package.json`'s `bundle`
script). `func start` runs that same bundle, so local dev and what
actually deploys are identical. `tsc -b -w` alone won't regenerate the
bundle on save — rerun `npm run build` (or `npm run bundle`) after changes
before restarting `func start`.

For the web app:

```sh
cd apps/web
cp .env.example .env
npm run dev
```

## Deployment

See `infra/README.md` for the Bicep deploy steps and `.github/workflows/`
for CI (build/lint/test on every PR) and the deploy workflow. Each Function
App is esbuild-bundled to a single dependency-free artifact before
deploying (see the comment at the top of `deploy.yml` and
`scripts/prepare-function-deploy.mjs`) — verified locally to run standalone
with zero `node_modules`, though the actual Azure deploy step itself still
needs real credentials to try end-to-end.
