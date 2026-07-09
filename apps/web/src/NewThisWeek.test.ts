import { describe, expect, it } from 'vitest';
import type { Job } from '@f1-job-radar/schema';
import { groupByCompany } from './NewThisWeek.js';

function makeJob(overrides: Partial<Job>): Job {
  return {
    id: 'j1',
    source: 'workday-red-bull-racing',
    externalId: 'R-1',
    company: 'Red Bull Racing',
    title: 'SRE',
    category: 'Software & IT',
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
    ...overrides,
  };
}

describe('groupByCompany', () => {
  it('groups jobs by company, preserving relative order within each group', () => {
    const jobs = [
      makeJob({ id: 'a', company: 'Red Bull Racing', title: 'SRE' }),
      makeJob({ id: 'b', company: 'Cadillac Formula 1 Team', title: 'Analyst' }),
      makeJob({ id: 'c', company: 'Red Bull Racing', title: 'Aerodynamicist' }),
    ];

    const groups = groupByCompany(jobs);

    expect([...groups.keys()]).toEqual(['Red Bull Racing', 'Cadillac Formula 1 Team']);
    expect(groups.get('Red Bull Racing')?.map((j) => j.title)).toEqual(['SRE', 'Aerodynamicist']);
    expect(groups.get('Cadillac Formula 1 Team')?.map((j) => j.title)).toEqual(['Analyst']);
  });

  it('returns an empty map for no jobs', () => {
    expect(groupByCompany([]).size).toBe(0);
  });
});
