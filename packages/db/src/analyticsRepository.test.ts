import { describe, expect, it, vi } from 'vitest';

const { fetchAllMock, queryMock, getContainerMock } = vi.hoisted(() => {
  const fetchAllMock = vi.fn();
  const queryMock = vi.fn().mockReturnValue({ fetchAll: fetchAllMock });
  const getContainerMock = vi.fn().mockReturnValue({ items: { query: queryMock } });
  return { fetchAllMock, queryMock, getContainerMock };
});

vi.mock('./cosmosClient.js', () => ({ getContainer: getContainerMock }));

const { bucketStart, getHiringTrends } = await import('./analyticsRepository.js');

describe('bucketStart', () => {
  it('buckets a timestamp into a 7-day window start', () => {
    const start = bucketStart('2026-07-09T12:00:00.000Z');
    // Same instant re-bucketed should be idempotent, and the bucket boundary
    // itself should be a whole day (midnight UTC).
    expect(new Date(start).getUTCHours()).toBe(0);
    expect(bucketStart(start)).toBe(start);
  });

  it('puts timestamps within the same 7-day window in the same bucket', () => {
    // Bucket boundaries are anchored to a fixed epoch, not to any particular
    // calendar date, so two arbitrary "nearby" dates aren't guaranteed to
    // share a bucket unless derived from an actual bucket start like this.
    const start = bucketStart('2026-07-06T00:00:00.000Z');
    const stillInWindow = new Date(
      new Date(start).getTime() + 6.9 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(bucketStart(stillInWindow)).toBe(start);
  });
});

describe('getHiringTrends', () => {
  it('aggregates jobs into (bucket, company, category) counts, sorted by period', async () => {
    fetchAllMock.mockResolvedValue({
      resources: [
        {
          company: 'Red Bull Racing',
          category: 'Software & IT',
          firstSeenAt: '2026-07-06T00:00:00.000Z',
        },
        {
          company: 'Red Bull Racing',
          category: 'Software & IT',
          firstSeenAt: '2026-07-08T00:00:00.000Z',
        },
        { company: 'Alpine', category: 'Aerodynamics', firstSeenAt: '2026-06-29T00:00:00.000Z' },
      ],
    });

    const trends = await getHiringTrends({ weeks: 12 });

    expect(trends).toHaveLength(2);
    const [first, second] = trends;
    expect(first!.periodStart < second!.periodStart).toBe(true);
    const rbr = trends.find((t) => t.company === 'Red Bull Racing');
    expect(rbr).toEqual(
      expect.objectContaining({ company: 'Red Bull Racing', category: 'Software & IT', opened: 2 }),
    );
  });

  it('queries with a since-parameter derived from the requested window', async () => {
    fetchAllMock.mockResolvedValue({ resources: [] });

    await getHiringTrends({ weeks: 4 });

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: [expect.objectContaining({ name: '@since' })],
      }),
    );
  });
});
