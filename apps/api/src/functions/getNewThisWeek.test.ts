import { describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { listOpenJobsMock } = vi.hoisted(() => ({ listOpenJobsMock: vi.fn() }));
vi.mock('@f1-job-radar/db', () => ({ listOpenJobs: listOpenJobsMock }));

const { getNewThisWeek } = await import('./getNewThisWeek.js');

function makeRequest(params: Record<string, string> = {}): HttpRequest {
  const query = new URLSearchParams(params);
  return { query } as unknown as HttpRequest;
}

const context = { error: vi.fn(), log: vi.fn() } as unknown as InvocationContext;

describe('getNewThisWeek', () => {
  it('queries with a firstSeenAfter roughly 7 days ago and default limit', async () => {
    listOpenJobsMock.mockResolvedValue({ jobs: [], total: 0 });

    const before = Date.now();
    const response = await getNewThisWeek(makeRequest(), context);
    const after = Date.now();

    expect(response.status).toBe(200);
    const call = listOpenJobsMock.mock.calls[0]?.[0] as { firstSeenAfter: string; limit: number };
    expect(call.limit).toBe(50);
    const firstSeenAfterMs = new Date(call.firstSeenAfter).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(firstSeenAfterMs).toBeGreaterThanOrEqual(before - sevenDaysMs - 1000);
    expect(firstSeenAfterMs).toBeLessThanOrEqual(after - sevenDaysMs + 1000);
  });

  it('clamps an oversized limit', async () => {
    listOpenJobsMock.mockResolvedValue({ jobs: [], total: 0 });

    await getNewThisWeek(makeRequest({ limit: '500' }), context);

    expect(listOpenJobsMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });

  it('returns 500 when the DB call fails', async () => {
    listOpenJobsMock.mockRejectedValue(new Error('boom'));

    const response = await getNewThisWeek(makeRequest(), context);

    expect(response.status).toBe(500);
  });
});
