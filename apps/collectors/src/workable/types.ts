// Shapes for Workable's public Job Board API (unauthenticated), documented
// from Workable's own API reference (see docs/sources.md) — NOT captured
// from a live response, since this environment's egress policy blocks
// apply.workable.com. Verify against a live response before production use.
export interface WorkableLocation {
  country?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  zip_code?: string;
  telecommuting?: boolean;
}

export interface WorkableJob {
  id: string;
  title: string;
  full_title?: string;
  shortcode: string;
  code?: string;
  state?: string;
  department?: string;
  url: string;
  application_url?: string;
  shortlink?: string;
  location?: WorkableLocation;
  created_at?: string;
}

export interface WorkableJobsResponse {
  jobs: WorkableJob[];
}
