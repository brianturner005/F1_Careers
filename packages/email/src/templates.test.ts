import { describe, expect, it } from 'vitest';
import type { Job, SavedSearch } from '@f1-job-radar/schema';
import { digestEmail, magicLinkEmail } from './templates.js';

describe('magicLinkEmail', () => {
  it('includes the verify URL', () => {
    const email = magicLinkEmail('https://example.com/verify?token=abc');
    expect(email.text).toContain('https://example.com/verify?token=abc');
    expect(email.subject).toMatch(/sign-in/i);
  });
});

describe('digestEmail', () => {
  const savedSearch: SavedSearch = {
    id: 's1',
    userId: 'u1',
    name: 'SRE roles',
    filters: {},
    frequency: 'daily',
    createdAt: '2026-07-01T00:00:00.000Z',
    lastAlertedAt: null,
  };

  const job: Job = {
    id: 'j1',
    source: 'workday-red-bull-racing',
    externalId: 'R-1',
    company: 'Red Bull Racing',
    title: 'SRE',
    category: 'Software & IT',
    rawDepartment: null,
    locationText: 'Milton Keynes',
    locationCountry: 'GB',
    workplaceType: 'onsite',
    employmentType: 'unknown',
    descriptionExcerpt: '',
    applyUrl: 'https://example.com/job/1',
    postedAt: null,
    firstSeenAt: '2026-07-01T00:00:00.000Z',
    lastSeenAt: '2026-07-01T00:00:00.000Z',
    status: 'open',
    tags: [],
  };

  it('lists each job with title, company, and apply link', () => {
    const email = digestEmail(savedSearch, [job]);
    expect(email.subject).toBe('1 new job for "SRE roles"');
    expect(email.text).toContain('SRE');
    expect(email.text).toContain('Red Bull Racing');
    expect(email.text).toContain('https://example.com/job/1');
  });

  it('pluralizes the subject for multiple jobs', () => {
    const email = digestEmail(savedSearch, [job, { ...job, id: 'j2' }]);
    expect(email.subject).toBe('2 new jobs for "SRE roles"');
  });
});
