import { describe, expect, it } from 'vitest';
import { rowToJob, type JobRow } from './rowMapping.js';

describe('rowToJob', () => {
  it('maps a SQL row into the normalized Job shape, including ISO date conversion', () => {
    const row: JobRow = {
      id: 'abc123',
      source: 'workday-red-bull-racing',
      external_id: 'R-10021',
      company: 'Red Bull Racing',
      title: 'Senior Site Reliability Engineer',
      category: 'Software & IT',
      raw_department: null,
      location_text: 'Milton Keynes, United Kingdom',
      location_country: 'GB',
      workplace_type: 'onsite',
      employment_type: 'unknown',
      description_excerpt: 'Join our team...',
      apply_url: 'https://example.com/job/R-10021',
      posted_at: new Date('2026-07-06T00:00:00.000Z'),
      first_seen_at: new Date('2026-07-06T00:00:00.000Z'),
      last_seen_at: new Date('2026-07-09T00:00:00.000Z'),
      status: 'open',
      tags: '["azure","kubernetes"]',
    };

    const job = rowToJob(row);

    expect(job.postedAt).toBe('2026-07-06T00:00:00.000Z');
    expect(job.lastSeenAt).toBe('2026-07-09T00:00:00.000Z');
    expect(job.tags).toEqual(['azure', 'kubernetes']);
  });

  it('defaults tags to an empty array when the column is empty', () => {
    const row: JobRow = {
      id: 'abc123',
      source: 'workday-red-bull-racing',
      external_id: 'R-1',
      company: 'Red Bull Racing',
      title: 'Test Role',
      category: 'Other',
      raw_department: null,
      location_text: null,
      location_country: null,
      workplace_type: 'unknown',
      employment_type: 'unknown',
      description_excerpt: '',
      apply_url: 'https://example.com/job/R-1',
      posted_at: null,
      first_seen_at: new Date('2026-07-06T00:00:00.000Z'),
      last_seen_at: new Date('2026-07-06T00:00:00.000Z'),
      status: 'open',
      tags: '',
    };

    expect(rowToJob(row).tags).toEqual([]);
    expect(rowToJob(row).postedAt).toBeNull();
  });
});
