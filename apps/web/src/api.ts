import type { Job } from '@f1-job-radar/schema';

export interface JobsResponse {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function fetchJobs(limit = 20, offset = 0): Promise<JobsResponse> {
  const url = `${API_BASE_URL}/api/jobs?limit=${limit}&offset=${offset}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.status}`);
  }
  return response.json() as Promise<JobsResponse>;
}
