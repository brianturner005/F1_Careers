# F1 Job Radar — Source Survey

Last updated: 2026-07-09

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

## Collector etiquette reminder (applies to all sources)

- Identify with an honest User-Agent (e.g. `F1JobRadarBot/0.1 (+<repo-url>; contact: <email>)`).
- Poll 2–4x/day per source, never more.
- Respect robots.txt; skip and document here any source that disallows collection.
- Store only normalized metadata + link to the original posting.
