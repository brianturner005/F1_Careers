import type { Job, Source } from '@f1-job-radar/schema';

export interface JobsResponse {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

export interface JobFilters {
  company?: string;
  category?: string;
  workplaceType?: string;
  employmentType?: string;
  locationCountry?: string;
  search?: string;
}

export interface SourcesResponse {
  sources: Source[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function fetchJobs(
  filters: JobFilters = {},
  limit = 20,
  offset = 0,
): Promise<JobsResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.status}`);
  }
  return response.json() as Promise<JobsResponse>;
}

export async function fetchSources(): Promise<SourcesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sources`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sources: ${response.status}`);
  }
  return response.json() as Promise<SourcesResponse>;
}
