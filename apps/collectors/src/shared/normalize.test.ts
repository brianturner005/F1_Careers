import { describe, expect, it } from 'vitest';
import type { RawPosting } from '@f1-job-radar/schema';
import { normalizePosting } from './normalize.js';
import type { CollectorConfig } from './collector.js';

const config: CollectorConfig = {
  id: 'workday-red-bull-racing',
  company: 'Red Bull Racing',
  atsPlatform: 'Workday',
};

const now = '2026-07-09T00:00:00.000Z';

describe('normalizePosting', () => {
  it('maps a raw posting into the normalized Job shape', () => {
    const raw: RawPosting = {
      externalId: 'R-12345',
      title: 'Senior Site Reliability Engineer',
      locationText: 'Milton Keynes, United Kingdom',
      descriptionExcerpt: 'Join our cloud infrastructure team...',
      applyUrl: 'https://redbulltechnology.wd3.myworkdayjobs.com/en-US/RB_Racing/job/R-12345',
      postedAt: '2026-07-06T00:00:00.000Z',
    };

    const job = normalizePosting(raw, config, now);

    expect(job.source).toBe('workday-red-bull-racing');
    expect(job.company).toBe('Red Bull Racing');
    expect(job.category).toBe('Software & IT');
    expect(job.workplaceType).toBe('onsite');
    expect(job.locationCountry).toBe('GB');
    expect(job.employmentType).toBe('unknown');
    expect(job.status).toBe('open');
    expect(job.firstSeenAt).toBe(now);
    expect(job.lastSeenAt).toBe(now);
    expect(job.id).toMatch(/^[a-f0-9]{24}$/);
  });

  it('produces a stable id for the same source + externalId', () => {
    const raw: RawPosting = {
      externalId: 'R-99999',
      title: 'Graduate Aerodynamicist',
      applyUrl: 'https://example.com/job/R-99999',
    };

    const jobA = normalizePosting(raw, config, now);
    const jobB = normalizePosting(raw, config, '2026-07-10T00:00:00.000Z');

    expect(jobA.id).toBe(jobB.id);
    expect(jobA.category).toBe('Early Careers (Intern/Grad)');
    expect(jobA.employmentType).toBe('graduate');
  });

  it('truncates description excerpts to 500 characters', () => {
    const raw: RawPosting = {
      externalId: 'R-1',
      title: 'Test Role',
      descriptionExcerpt: 'x'.repeat(1000),
      applyUrl: 'https://example.com/job/R-1',
    };

    const job = normalizePosting(raw, config, now);
    expect(job.descriptionExcerpt).toHaveLength(500);
  });
});
