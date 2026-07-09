import { describe, expect, it } from 'vitest';
import type { Job } from '@f1-job-radar/schema';
import { diffPostings } from './diff.js';

function makeJob(overrides: Partial<Job> & Pick<Job, 'id'>): Job {
  return {
    source: 'test-source',
    externalId: overrides.id,
    company: 'Test Co',
    title: 'Some Role',
    category: 'Other',
    rawDepartment: null,
    locationText: null,
    locationCountry: null,
    workplaceType: 'unknown',
    employmentType: 'unknown',
    descriptionExcerpt: '',
    applyUrl: 'https://example.com/job/1',
    postedAt: null,
    firstSeenAt: '2026-07-01T00:00:00.000Z',
    lastSeenAt: '2026-07-01T00:00:00.000Z',
    status: 'open',
    tags: [],
    ...overrides,
  };
}

describe('diffPostings', () => {
  it('classifies a posting absent from the previous run as new', () => {
    const previouslyOpen: Job[] = [];
    const fresh = [makeJob({ id: 'a' })];

    const result = diffPostings(previouslyOpen, fresh);

    expect(result.newJobs).toHaveLength(1);
    expect(result.updatedJobs).toHaveLength(0);
    expect(result.closedJobs).toHaveLength(0);
  });

  it('classifies a posting missing from the fresh run as closed', () => {
    const previouslyOpen = [makeJob({ id: 'a' })];
    const fresh: Job[] = [];

    const result = diffPostings(previouslyOpen, fresh);

    expect(result.closedJobs).toHaveLength(1);
    expect(result.closedJobs[0]?.status).toBe('closed');
  });

  it('classifies an unchanged posting present in both runs as unchanged', () => {
    const previouslyOpen = [makeJob({ id: 'a', lastSeenAt: '2026-07-01T00:00:00.000Z' })];
    const fresh = [makeJob({ id: 'a', lastSeenAt: '2026-07-08T00:00:00.000Z' })];

    const result = diffPostings(previouslyOpen, fresh);

    expect(result.unchangedJobs).toHaveLength(1);
    expect(result.updatedJobs).toHaveLength(0);
    expect(result.unchangedJobs[0]?.lastSeenAt).toBe('2026-07-08T00:00:00.000Z');
  });

  it('classifies a posting with a changed title as updated and preserves firstSeenAt', () => {
    const previouslyOpen = [
      makeJob({ id: 'a', title: 'Old Title', firstSeenAt: '2026-06-01T00:00:00.000Z' }),
    ];
    const fresh = [
      makeJob({ id: 'a', title: 'New Title', firstSeenAt: '2026-07-08T00:00:00.000Z' }),
    ];

    const result = diffPostings(previouslyOpen, fresh);

    expect(result.updatedJobs).toHaveLength(1);
    expect(result.updatedJobs[0]?.title).toBe('New Title');
    expect(result.updatedJobs[0]?.firstSeenAt).toBe('2026-06-01T00:00:00.000Z');
  });
});
