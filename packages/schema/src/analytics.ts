// One row per (7-day bucket, company, category) — the input to a simple
// hiring-trends chart ("Cadillac has posted 40 IT roles in 6 months").
// Derived entirely from existing jobs.first_seen_at history, no new data
// collection required.
export interface HiringTrendPoint {
  periodStart: string;
  company: string;
  category: string;
  opened: number;
}
