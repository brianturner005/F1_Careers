# F1 Job Radar

A single, searchable feed of every open job across Formula 1 teams and their
technology partners — normalized from each team's own careers site, with
accounts, saved searches, and email alerts. See `docs/` for the full project
brief and source survey.

## Status: Phase 3 (in progress)

Six sources flowing end-to-end: collector → normalize/dedupe/diff → Azure
SQL → API → web feed:

- Red Bull Racing, Mercedes-AMG Petronas, Alpine, Formula One Management — all Workday
- Aston Martin Aramco — Pinpoint
- Cadillac F1 — Workable

The feed UI supports filtering (team, category, workplace type, employment
type) and full-text search, plus a Source Health view for collector status.
Passwordless (magic-link) accounts let signed-in users save a search and get
a daily or weekly email digest of new matches — verified end-to-end in a
real browser against a mock API (sign-in → verify → save search → list →
delete). Real email sending needs a Resend API key configured at deploy time
(see `infra/README.md`); without one, both the API and alerts worker
console-log emails instead of sending them.

Phase 3 additions: a Hiring Trends view (postings-opened-per-company over a
configurable window, derived entirely from existing `first_seen_at`
history — no new data collection needed) and a "New This Week" shareable
page grouped by team.

Remaining Phase 1 work: the 6 teams whose ATS platform is still unconfirmed
(Racing Bulls, Ferrari, McLaren, Williams, Haas, Audi), plus several
supplier/adjacent-series sources researched but not yet built (Pirelli is
confirmed on Trakstar — a new ATS we don't support yet; McLaren Applied,
Cosworth, Bosch Motorsport, and Formula E remain unconfirmed) — see
`docs/sources.md` for status per source.

## Structure

```
apps/
  web/         React (Vite) PWA — job feed (filters/search), Source Health,
               sign-in/saved searches, About page
  api/         Azure Functions HTTP API: jobs, sources, auth (magic link),
               saved searches
  collectors/  Azure Functions timer triggers, one per source, behind a
               shared Collector interface (apps/collectors/src/shared).
               ATS clients (Workday, Pinpoint, Workable) are shared across
               the sources that use them.
  alerts/      Azure Functions timer triggers: daily/weekly digest worker
packages/
  schema/      Shared TypeScript types (Job, Source, User, SavedSearch, enums)
  db/          Azure SQL access layer shared by api, collectors, and alerts
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
`local.settings.json.example` in each app and fill in `SQL_CONNECTION_STRING`;
`api` and `alerts` also take `RESEND_API_KEY`/`EMAIL_FROM`, and `api` takes
`WEB_BASE_URL` for building magic-link URLs).

```sh
# apps/api, apps/collectors, or apps/alerts
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
