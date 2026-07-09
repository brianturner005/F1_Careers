import { describe, expect, it } from 'vitest';
import type { HiringTrendPoint } from '@f1-job-radar/schema';
import { aggregateByCompany } from './HiringTrends.js';

function makePoint(overrides: Partial<HiringTrendPoint>): HiringTrendPoint {
  return {
    periodStart: '2026-07-06T00:00:00.000Z',
    company: 'Red Bull Racing',
    category: 'Software & IT',
    opened: 1,
    ...overrides,
  };
}

describe('aggregateByCompany', () => {
  it('sums opened counts across categories and weeks per company', () => {
    const points = [
      makePoint({ company: 'Red Bull Racing', opened: 3 }),
      makePoint({ company: 'Red Bull Racing', category: 'Aerodynamics', opened: 2 }),
      makePoint({ company: 'Cadillac Formula 1 Team', opened: 5 }),
    ];

    const totals = aggregateByCompany(points);

    expect(totals).toEqual([
      { company: 'Red Bull Racing', total: 5 },
      { company: 'Cadillac Formula 1 Team', total: 5 },
    ]);
  });

  it('returns an empty array for no points', () => {
    expect(aggregateByCompany([])).toEqual([]);
  });

  it('sorts descending by total', () => {
    const points = [
      makePoint({ company: 'A', opened: 1 }),
      makePoint({ company: 'B', opened: 10 }),
      makePoint({ company: 'C', opened: 5 }),
    ];

    expect(aggregateByCompany(points).map((t) => t.company)).toEqual(['B', 'C', 'A']);
  });
});
