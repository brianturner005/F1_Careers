import type { Job, SavedSearch } from '@f1-job-radar/schema';

export interface RenderedEmail {
  subject: string;
  text: string;
}

export function magicLinkEmail(verifyUrl: string): RenderedEmail {
  return {
    subject: 'Your F1 Job Radar sign-in link',
    text: `Click to sign in (expires in 15 minutes):\n\n${verifyUrl}\n\nIf you didn't request this, you can ignore this email.`,
  };
}

export function digestEmail(savedSearch: SavedSearch, jobs: Job[]): RenderedEmail {
  const lines = jobs.map(
    (job) =>
      `- ${job.title} — ${job.company} (${job.locationText ?? 'location unknown'})\n  ${job.applyUrl}`,
  );

  return {
    subject: `${jobs.length} new job${jobs.length === 1 ? '' : 's'} for "${savedSearch.name}"`,
    text: `New postings matching your saved search "${savedSearch.name}":\n\n${lines.join('\n\n')}`,
  };
}
