# Paddock Jobs — Source Survey

Last updated: 2026-07-13 (Phase 4 kickoff: initial WEC/IMSA endurance-racing source research — see new section below)

This document tracks, per source, the official careers URL, the underlying ATS
platform, and whether a public JSON endpoint exists that a collector can use
instead of HTML scraping. It is the required input before writing any
collector (see project brief §11.1).

## Verification limitation (read first)

Live requests to careers-site domains from this planning/build environment
are currently blocked in both directions we tried:

- Direct `curl` from this sandbox is rejected at the egress-proxy CONNECT
  step (org policy denial, HTTP 403) for every ATS host tested
  (`*.myworkdayjobs.com`, `apply.workable.com`, `*.pinpointhq.com`).
- The hosted WebFetch tool got HTTP 403 from the destination sites
  themselves on the same URLs (consistent with bot/anti-scraping protection
  on those CDNs — Workday, Workable, and Pinpoint all commonly block
  non-browser/non-residential requests).

So the endpoint shapes below are documented from the ATS vendors' known,
public API patterns (used by many existing open-source job-board scrapers),
not from a live response captured today. **Before writing the Phase 0
collector, verify the exact request shape (headers, POST body, tenant/site
IDs) against the live endpoint from a normal dev machine or from inside the
deployed Azure Function (which will have unrestricted outbound access) —
do not assume the payload below is byte-exact.**

## Phase 1 status

Collectors implemented so far (behind fixture-based unit tests; none
verified against a live response — see the limitation note above):

| Source id                       | Team                         | ATS      | Status                      |
| ------------------------------- | ---------------------------- | -------- | --------------------------- |
| `workday-red-bull-racing`       | Red Bull Racing              | Workday  | Implemented — Phase 0 pilot |
| `workday-mercedes-amg-petronas` | Mercedes-AMG Petronas        | Workday  | Implemented — Phase 1       |
| `workday-alpine`                | Alpine                       | Workday  | Implemented — Phase 1       |
| `pinpoint-aston-martin`         | Aston Martin Aramco          | Pinpoint | Implemented — Phase 1       |
| `workable-cadillac`             | Cadillac F1                  | Workable | Implemented — Phase 1       |
| `workday-formula1-management`   | Formula One Management (FOM) | Workday  | Implemented — Phase 3       |
| `trakstar-pirelli`              | Pirelli                      | Trakstar | Implemented — Phase 3       |

Not yet built — ATS still unconfirmed (see table below): Racing Bulls
(VCARB), Ferrari, McLaren, Williams, Haas F1, Audi F1 (ex-Sauber). Each needs
a manual "view source" / network-tab check from an unrestricted machine
before a collector can be written for it.

## Phase 3: supplier / adjacent-series research (brief §6.2)

| Source                     | Careers URL                                                     | ATS                                              | Status                                                               |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| Formula One Management     | corp.formula1.com/careers → formulaone.wd3.myworkdayjobs.com/F1 | Workday                                          | **Implemented** — same client as the 3 team sources                  |
| Pirelli (incl. Motorsport) | jobs.pirelli.com, pirelli.hire.trakstar.com                     | **Trakstar** — confirmed via URL and public docs | **Implemented** — new Trakstar client, RSS/XML feed rather than JSON |
| McLaren Applied            | mclarencareers.mclaren.com (shared with McLaren Racing)         | Unknown                                          | Unverified                                                           |
| Cosworth                   | cosworth.com/careers                                            | Unknown                                          | Unverified                                                           |
| Bosch Motorsport           | bosch-motorsport.com/careers                                    | Unknown                                          | Unverified                                                           |
| Formula E                  | careers.fiaformulae.com                                         | Unknown                                          | Unverified                                                           |

FOM shares infrastructure with Red Bull/Mercedes/Alpine (same Workday CXS
pattern), so it was effectively free to add once the generic client existed.
Pirelli required a new client since Trakstar Hire has no public JSON API
(confirmed via Trakstar's own developer docs: `/api/jobs` and
`/api/jobs/{id}` return 404 unauthenticated) — its only public option is an
RSS/XML feed at `https://{subdomain}.hire.trakstar.com/jobfeeds/{CompanyName}`
using a custom `job:` XML namespace for location/team/type. Field names are
inferred from third-party documentation of that namespace, not captured
live (same sandbox egress limitation as every other source here).
Everything else in this table needs the same manual verification as the
6 unconfirmed F1 teams above before a collector is worth building for it.

## Summary table

| Team                          | Careers URL                                                                                     | ATS                                                                                              | Public JSON API?                                                | Confidence |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------- |
| Red Bull Racing (+ RBPT)      | careers.redbullracing.com → redbulltechnology.wd3.myworkdayjobs.com/RB_Racing                   | Workday                                                                                          | Yes — CXS endpoint                                              | High       |
| Mercedes-AMG Petronas (+ HPP) | mercedesamgf1.com/careers → mbgp.wd3.myworkdayjobs.com/Mercedes-AMGF1                           | Workday                                                                                          | Yes — CXS endpoint                                              | High       |
| Alpine                        | alliancewd.wd3.myworkdayjobs.com/alpine-racing-careers                                          | Workday                                                                                          | Yes — CXS endpoint                                              | High       |
| Aston Martin Aramco           | astonmartinf1.com/careers → astonmartinf1.pinpointhq.com                                        | Pinpoint                                                                                         | Likely — Pinpoint exposes a `postings.json`/API on most tenants | Medium     |
| Cadillac F1                   | careers.cadillacf1team.com, opportunities.cadillacf1team.com, apply.workable.com/cadillacf1team | Workable                                                                                         | Likely — Workable v3 public jobs API                            | Medium     |
| Racing Bulls (VCARB)          | visacashapprb.com/int-en/careers; postings also flow through jobs.redbull.com                   | Probably Workday (shared Red Bull group infra)                                                   | Unverified                                                      | Low        |
| Ferrari (Scuderia Ferrari)    | jobs.ferrari.com                                                                                | Unknown (not confirmed SAP SuccessFactors or Workday)                                            | Unverified                                                      | Low        |
| McLaren Racing                | racingcareers.mclaren.com                                                                       | Unknown (McLaren is a listed Workday customer generally; not confirmed for this specific portal) | Unverified                                                      | Low        |
| Williams Racing               | careers.williamsf1.com (+ internalcareers.williamsf1.com)                                       | Unknown                                                                                          | Unverified                                                      | Low        |
| Haas F1 Team                  | haasf1team.com/work-with-us                                                                     | Unknown                                                                                          | Unverified                                                      | Low        |
| Audi F1 (ex-Sauber)           | audif1.com/en/careers, sauber-group.com careers                                                 | Unknown                                                                                          | Unverified                                                      | Low        |

## Notes per source

### Workday tenants (Red Bull Racing, Mercedes-AMG Petronas, Alpine)

Workday's Candidate Experience Site (CXS) API follows a well-known pattern
across all Workday-hosted career sites:

```
POST https://{tenant}.wd3.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs
Content-Type: application/json
Body: {"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": ""}
```

Job detail:

```
GET https://{tenant}.wd3.myworkdayjobs.com/wday/cxs/{tenant}/{site}/job/{externalPath}
```

Observed tenant/site pairs from careers-page redirects:

- Red Bull Racing: tenant `redbulltechnology`, site `RB_Racing`
- Mercedes-AMG Petronas F1: tenant `mbgp`, site `Mercedes-AMGF1`
- Alpine: tenant `alliancewd`, site `alpine-racing-careers`

These three sharing one ATS is the strongest argument for picking Workday as
the Phase 0 collector target — one well-tested collector module covers 3 of
11 teams almost immediately in Phase 1.

### Pinpoint (Aston Martin Aramco)

Confirmed tenant subdomain: `astonmartinf1.pinpointhq.com`. Pinpoint-hosted
boards commonly expose `/postings.json` or an documented public API; exact
path needs live confirmation.

### Workable (Cadillac F1)

Confirmed account slug `cadillacf1team` on `apply.workable.com`. Workable's
public v3 jobs API is well documented (`/api/v3/accounts/{account}/jobs`);
exact response shape needs live confirmation.

### Unverified sources (Ferrari, McLaren, Williams, Haas, Audi/Sauber, VCARB)

No ATS could be confirmed via search or from this sandbox's blocked network
access. These need a manual check (view page source / network tab) from an
unrestricted machine before a collector is designed for them. None showed
any robots.txt or ToS red flag in search results, but robots.txt itself
could not be fetched from this sandbox either — **must be checked
per-source before the first live collector run**, per brief §11.7.

## Phase 4: WEC / IMSA endurance racing research (initial pass)

Following the F1-only → all-motorsport expansion decision, WEC Hypercar and
IMSA GTP were picked as the first non-F1 series (natural overlap with
existing F1 suppliers/teams). This is a **web-search-only research pass**,
not a live network-tab check — same sandbox egress limitation as every F1
source above applies here too (this environment can't reach team/ATS domains
directly; confirmed by testing `careers.tgr-europe.com` through both `curl`
and a headless browser, both blocked the same way `*.myworkdayjobs.com` etc.
were blocked in Phase 0). Everything below needs the same manual DevTools
verification as the still-unconfirmed F1 teams before a collector is worth
writing.

| Team / program                     | Careers URL                                                          | ATS                                        | Confidence | Notes                                                                 |
| ----------------------------------- | --------------------------------------------------------------------- | ------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| Cadillac Racing (WEC + IMSA GTP)     | careers.cadillacf1team.com, opportunities.cadillacf1team.com          | **Workable** (same board as Cadillac F1)   | Medium     | GM runs the WEC/IMSA program under the same "Cadillac" umbrella as the F1 team — likely the *same* careers site, meaning **the existing `workable-cadillac` collector may already cover it** once confirmed live. Highest-value finding this pass. |
| Ferrari AF Corse (WEC Hypercar 499P) | jobs.ferrari.com (same as Scuderia Ferrari F1)                        | Unknown (same Taleo guess as F1 Ferrari)   | Low        | AF Corse is Ferrari's endurance partner team; likely shares Ferrari's corporate ATS.  |
| Toyota Racing (formerly Toyota Gazoo Racing) | careers.tgr-europe.com                                        | Unknown                                    | Low        | Team rebranded from "Toyota Gazoo Racing" to "Toyota Racing" for the 2026 season — dedicated careers portal exists, platform unconfirmed. |
| Porsche Penske Motorsport             | teampenske.com/about/index.cfm/51985/Careers                         | Unknown — URL pattern (`.cfm`) suggests an older/custom site, not a modern SaaS ATS | Low | Shared with Team Penske's NASCAR/IndyCar operations, not WEC/IMSA-specific. |
| Aston Martin (Valkyrie WEC program)  | astonmartinf1.com/careers (existing Pinpoint site) or astonmartin.com/en/corporate/careers | Unconfirmed which one covers the WEC "THOR Team" | Low | Ambiguous whether WEC hiring flows through the F1 team's Pinpoint board or general corporate careers. |
| BMW M Motorsport                     | bmwgroup.jobs, jobs.bmwgroup.com                                     | Unknown                                    | Low        | No dedicated motorsport-specific careers portal found — appears to fold into BMW Group's general corporate ATS. |
| Peugeot TotalEnergies                | totalenergies.com/careers, jobs.totalenergies.com                    | Unknown                                    | Low        | No dedicated motorsport portal found; folds into TotalEnergies/Stellantis general careers, low relevance as a distinct source. |

### Deprioritized — programs winding down

Two GTP manufacturer programs were confirmed (via search) to be discontinuing,
so building collectors for them isn't worth the effort right now:

- **Acura / Honda Racing Corporation US (ARX-06 GTP)** — HRC US confirmed the
  program will pause after the 2026 IMSA season (per RACER, April 2026).
- **Lamborghini Squadra Corse (SC63)** — WEC entry ceased after 2024; IMSA
  entry confirmed not continuing into 2026.

### Next step

None of the above is live-verified. The next concrete step is the same as
the remaining unconfirmed F1 teams: a manual DevTools Network-tab check per
source from an unrestricted machine, starting with Cadillac Racing (highest
confidence it's a free win via the existing Workable collector) and Ferrari
AF Corse (shares infra with an already partially-investigated F1 source).

## Collector etiquette reminder (applies to all sources)

- Identify with an honest User-Agent (e.g. `F1JobRadarBot/0.1 (+<repo-url>; contact: <email>)`).
- Poll 2–4x/day per source, never more.
- Respect robots.txt; skip and document here any source that disallows collection.
- Store only normalized metadata + link to the original posting.
