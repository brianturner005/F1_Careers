import { describe, expect, it } from 'vitest';
import type { SavedSearch } from '@f1-job-radar/schema';
import { isDue, selectDueSearches } from './dueSearches.js';

function makeSearch(overrides: Partial<SavedSearch> = {}): SavedSearch {
  return {
    id: 's1',
    userId: 'u1',
    name: 'SRE roles',
    filters: { search: 'sre' },
    frequency: 'daily',
    createdAt: '2026-07-01T00:00:00.000Z',
    lastAlertedAt: null,
    ...overrides,
  };
}

describe('isDue', () => {
  it('is due when never alerted', () => {
    expect(
      isDue(makeSearch({ lastAlertedAt: null }), 'daily', new Date('2026-07-09T12:00:00.000Z')),
    ).toBe(true);
  });

  it('daily: is not due again on the same UTC calendar day', () => {
    const search = makeSearch({ lastAlertedAt: '2026-07-09T01:00:00.000Z' });
    expect(isDue(search, 'daily', new Date('2026-07-09T23:00:00.000Z'))).toBe(false);
  });

  it('daily: is due once the UTC calendar day has changed', () => {
    const search = makeSearch({ lastAlertedAt: '2026-07-09T23:00:00.000Z' });
    expect(isDue(search, 'daily', new Date('2026-07-10T00:30:00.000Z'))).toBe(true);
  });

  it('weekly: is not due before 7 days have elapsed', () => {
    const search = makeSearch({ frequency: 'weekly', lastAlertedAt: '2026-07-03T00:00:00.000Z' });
    expect(isDue(search, 'weekly', new Date('2026-07-09T00:00:00.000Z'))).toBe(false);
  });

  it('weekly: is due once 7 days have elapsed', () => {
    const search = makeSearch({ frequency: 'weekly', lastAlertedAt: '2026-07-02T00:00:00.000Z' });
    expect(isDue(search, 'weekly', new Date('2026-07-09T00:00:00.000Z'))).toBe(true);
  });
});

describe('selectDueSearches', () => {
  it('filters to only the due searches', () => {
    const now = new Date('2026-07-09T12:00:00.000Z');
    const searches = [
      makeSearch({ id: 'due', lastAlertedAt: null }),
      makeSearch({ id: 'not-due', lastAlertedAt: '2026-07-09T01:00:00.000Z' }),
    ];

    const due = selectDueSearches(searches, 'daily', now);

    expect(due.map((s) => s.id)).toEqual(['due']);
  });
});
