import { describe, expect, it } from 'vitest';
import { rowToSavedSearch, rowToUser } from './accountsRowMapping.js';

describe('rowToUser', () => {
  it('maps a SQL row into the normalized User shape', () => {
    const user = rowToUser({
      id: 'u1',
      email: 'brian@example.com',
      created_at: new Date('2026-07-09T00:00:00.000Z'),
    });

    expect(user).toEqual({
      id: 'u1',
      email: 'brian@example.com',
      createdAt: '2026-07-09T00:00:00.000Z',
    });
  });
});

describe('rowToSavedSearch', () => {
  it('parses the filters JSON column and maps dates to ISO strings', () => {
    const savedSearch = rowToSavedSearch({
      id: 's1',
      user_id: 'u1',
      name: 'SRE roles',
      filters: JSON.stringify({ category: 'Software & IT', search: 'sre' }),
      frequency: 'daily',
      created_at: new Date('2026-07-09T00:00:00.000Z'),
      last_alerted_at: null,
    });

    expect(savedSearch).toEqual({
      id: 's1',
      userId: 'u1',
      name: 'SRE roles',
      filters: { category: 'Software & IT', search: 'sre' },
      frequency: 'daily',
      createdAt: '2026-07-09T00:00:00.000Z',
      lastAlertedAt: null,
    });
  });

  it('maps a non-null lastAlertedAt to an ISO string', () => {
    const savedSearch = rowToSavedSearch({
      id: 's1',
      user_id: 'u1',
      name: 'SRE roles',
      filters: '{}',
      frequency: 'weekly',
      created_at: new Date('2026-07-01T00:00:00.000Z'),
      last_alerted_at: new Date('2026-07-08T00:00:00.000Z'),
    });

    expect(savedSearch.lastAlertedAt).toBe('2026-07-08T00:00:00.000Z');
  });
});
