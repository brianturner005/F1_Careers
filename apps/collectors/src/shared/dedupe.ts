import type { Job } from '@f1-job-radar/schema';

// Collapses postings that hash to the same Job.id within a single fetch —
// e.g. a role cross-posted twice under the same requisition on one ATS run.
// First occurrence wins.
export function dedupeById(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  for (const job of jobs) {
    if (!seen.has(job.id)) seen.set(job.id, job);
  }
  return [...seen.values()];
}
