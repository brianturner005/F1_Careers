import type { Job } from '@f1-job-radar/schema';

// Raw shape of a `jobs` table row as returned by the mssql driver
// (snake_case columns, Date objects for datetime2 columns).
export interface JobRow {
  id: string;
  source: string;
  external_id: string;
  company: string;
  title: string;
  category: string;
  raw_department: string | null;
  location_text: string | null;
  location_country: string | null;
  workplace_type: string;
  employment_type: string;
  description_excerpt: string;
  apply_url: string;
  posted_at: Date | null;
  first_seen_at: Date;
  last_seen_at: Date;
  status: string;
  tags: string;
}

export function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    source: row.source,
    externalId: row.external_id,
    company: row.company,
    title: row.title,
    category: row.category as Job['category'],
    rawDepartment: row.raw_department,
    locationText: row.location_text,
    locationCountry: row.location_country,
    workplaceType: row.workplace_type as Job['workplaceType'],
    employmentType: row.employment_type as Job['employmentType'],
    descriptionExcerpt: row.description_excerpt,
    applyUrl: row.apply_url,
    postedAt: row.posted_at ? row.posted_at.toISOString() : null,
    firstSeenAt: row.first_seen_at.toISOString(),
    lastSeenAt: row.last_seen_at.toISOString(),
    status: row.status as Job['status'],
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
  };
}
