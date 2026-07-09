import type { Job } from '@f1-job-radar/schema';

export interface DiffResult {
  newJobs: Job[];
  updatedJobs: Job[];
  closedJobs: Job[];
  unchangedJobs: Job[];
}

const CONTENT_FIELDS = ['title', 'applyUrl', 'descriptionExcerpt', 'locationText'] as const;

function hasContentChanged(previous: Job, fresh: Job): boolean {
  return CONTENT_FIELDS.some((field) => previous[field] !== fresh[field]);
}

/**
 * Diffs a fresh collector run against the currently-open jobs for that
 * source. `previouslyOpen` should already be filtered to `status: 'open'`
 * rows for this source — this function does not filter by source itself.
 */
export function diffPostings(previouslyOpen: Job[], fresh: Job[]): DiffResult {
  const previousById = new Map(previouslyOpen.map((job) => [job.id, job]));
  const freshById = new Map(fresh.map((job) => [job.id, job]));

  const newJobs: Job[] = [];
  const updatedJobs: Job[] = [];
  const unchangedJobs: Job[] = [];

  for (const [id, freshJob] of freshById) {
    const previousJob = previousById.get(id);
    if (!previousJob) {
      newJobs.push(freshJob);
      continue;
    }
    const merged: Job = { ...freshJob, firstSeenAt: previousJob.firstSeenAt };
    if (hasContentChanged(previousJob, freshJob)) {
      updatedJobs.push(merged);
    } else {
      unchangedJobs.push(merged);
    }
  }

  const closedJobs: Job[] = [];
  for (const [id, previousJob] of previousById) {
    if (!freshById.has(id)) {
      closedJobs.push({ ...previousJob, status: 'closed' });
    }
  }

  return { newJobs, updatedJobs, closedJobs, unchangedJobs };
}
