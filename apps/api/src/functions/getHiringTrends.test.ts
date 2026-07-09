import { describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { getHiringTrendsMock } = vi.hoisted(() => ({ getHiringTrendsMock: vi.fn() }));
vi.mock('@f1-job-radar/db', () => ({ getHiringTrends: getHiringTrendsMock }));

const { getHiringTrendsHandler } = await import('./getHiringTrends.js');

function makeRequest(params: Record<string, string> = {}): HttpRequest {
  const query = new URLSearchParams(params);
  return { query } as unknown as HttpRequest;
}

const context = { error: vi.fn(), log: vi.fn() } as unknown as InvocationContext;

describe('getHiringTrendsHandler', () => {
  it('defaults to 12 weeks', async () => {
    getHiringTrendsMock.mockResolvedValue([]);

    const response = await getHiringTrendsHandler(makeRequest(), context);

    expect(response.status).toBe(200);
    expect(getHiringTrendsMock).toHaveBeenCalledWith({ weeks: 12 });
  });

  it('clamps an oversized weeks param', async () => {
    getHiringTrendsMock.mockResolvedValue([]);

    await getHiringTrendsHandler(makeRequest({ weeks: '500' }), context);

    expect(getHiringTrendsMock).toHaveBeenCalledWith({ weeks: 52 });
  });

  it('returns 500 when the DB call fails', async () => {
    getHiringTrendsMock.mockRejectedValue(new Error('boom'));

    const response = await getHiringTrendsHandler(makeRequest(), context);

    expect(response.status).toBe(500);
  });
});
