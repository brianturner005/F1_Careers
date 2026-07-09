import type { RawPosting } from '@f1-job-radar/schema';
import type { WorkableJob, WorkableJobsResponse, WorkableLocation } from './types.js';

export const WORKABLE_USER_AGENT =
  'F1JobRadarBot/0.1 (+https://github.com/brianturner005/F1_Careers)';

export interface WorkableCollectorOptions {
  account: string;
  fetchImpl?: typeof fetch;
}

export async function fetchWorkableJobs(options: WorkableCollectorOptions): Promise<RawPosting[]> {
  const doFetch = options.fetchImpl ?? fetch;
  const url = `https://apply.workable.com/api/v3/accounts/${options.account}/jobs`;

  const response = await doFetch(url, {
    headers: { 'User-Agent': WORKABLE_USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(
      `Workable request failed for ${options.account}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as WorkableJobsResponse;
  return data.jobs.map(toRawPosting);
}

function toRawPosting(job: WorkableJob): RawPosting {
  return {
    externalId: job.shortcode || job.id,
    title: job.title,
    locationText: formatLocation(job.location),
    rawDepartment: job.department ?? null,
    applyUrl: job.url,
    postedAt: job.created_at ?? null,
  };
}

function formatLocation(location: WorkableLocation | undefined): string | null {
  if (!location) return null;
  if (location.telecommuting) return 'Remote';
  const parts = [location.city, location.region, location.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
