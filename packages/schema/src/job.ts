import type { Category, EmploymentType, JobStatus, WorkplaceType } from './enums.js';

// Normalized job schema — project brief §7.
export interface Job {
  id: string;
  source: string;
  externalId: string;
  company: string;
  title: string;
  category: Category;
  rawDepartment: string | null;
  locationText: string | null;
  locationCountry: string | null;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  descriptionExcerpt: string;
  applyUrl: string;
  postedAt: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  status: JobStatus;
  tags: string[];
}

// What a collector produces before normalization — deliberately loose since
// every source's raw shape differs.
export interface RawPosting {
  externalId: string;
  title: string;
  rawDepartment?: string | null;
  locationText?: string | null;
  descriptionExcerpt?: string | null;
  applyUrl: string;
  postedAt?: string | null;
}
