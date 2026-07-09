import { describe, expect, it } from 'vitest';
import { rowToHiringTrendPoint } from './analyticsRepository.js';

describe('rowToHiringTrendPoint', () => {
  it('maps a SQL row into the normalized HiringTrendPoint shape', () => {
    const point = rowToHiringTrendPoint({
      period_start: new Date('2026-07-06T00:00:00.000Z'),
      company: 'Red Bull Racing',
      category: 'Software & IT',
      opened: 3,
    });

    expect(point).toEqual({
      periodStart: '2026-07-06T00:00:00.000Z',
      company: 'Red Bull Racing',
      category: 'Software & IT',
      opened: 3,
    });
  });
});
