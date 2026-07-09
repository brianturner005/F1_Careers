import { describe, expect, it } from 'vitest';
import type { Job } from '@f1-job-radar/schema';
import { dedupeById } from './dedupe.js';

function makeJob(id: string, title: string): Job {
  return {
    id,
    source: 'test-source',
    externalId: id,
    company: 'Test Co',
    title,
    category: 'Other',
    rawDepartment: null,
    locationText: null,
    locationCountry: null,
    workplaceType: 'unknown',
    employmentType: 'unknown',
    descriptionExcerpt: '',
    applyUrl: 'https://example.com',
    postedAt: null,
    firstSeenAt: '2026-07-09T00:00:00.000Z',
    lastSeenAt: '2026-07-09T00:00:00.000Z',
    status: 'open',
    tags: [],
  };
}

describe('dedupeById', () => {
  it('keeps the first occurrence of a repeated id', () => {
    const jobs = [makeJob('a', 'First'), makeJob('b', 'Only'), makeJob('a', 'Duplicate')];
    const result = dedupeById(jobs);

    expect(result).toHaveLength(2);
    expect(result.find((job) => job.id === 'a')?.title).toBe('First');
  });

  it('returns an empty array for empty input', () => {
    expect(dedupeById([])).toEqual([]);
  });
});
