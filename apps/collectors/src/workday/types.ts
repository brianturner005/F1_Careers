// Shapes for Workday's Candidate Experience Site (CXS) job search API.
// Documented from the well-known public CXS pattern used across Workday
// career sites (see docs/sources.md) — NOT captured from a live response,
// since this environment's egress policy blocks *.myworkdayjobs.com and the
// hosted fetch tool was bot-blocked on the same hosts. Verify field names
// against a live response before trusting this collector in production.
export interface WorkdayJobPosting {
  title: string;
  externalPath: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
}

export interface WorkdayJobsResponse {
  total: number;
  jobPostings: WorkdayJobPosting[];
}
