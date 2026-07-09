import { describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { listOpenJobsMock } = vi.hoisted(() => ({ listOpenJobsMock: vi.fn() }));
vi.mock('@f1-job-radar/db', () => ({ listOpenJobs: listOpenJobsMock }));

const { getJobs } = await import('./getJobs.js');

function makeRequest(params: Record<string, string> = {}): HttpRequest {
  const query = new URLSearchParams(params);
  return { query } as unknown as HttpRequest;
}

const context = { error: vi.fn(), log: vi.fn() } as unknown as InvocationContext;

describe('getJobs', () => {
  it('returns paginated jobs using default limit/offset', async () => {
    listOpenJobsMock.mockResolvedValue({ jobs: [], total: 0 });

    const response = await getJobs(makeRequest(), context);

    expect(response.status).toBe(200);
    expect(listOpenJobsMock).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it('clamps an oversized limit and ignores a negative offset', async () => {
    listOpenJobsMock.mockResolvedValue({ jobs: [], total: 0 });

    await getJobs(makeRequest({ limit: '500', offset: '-5' }), context);

    expect(listOpenJobsMock).toHaveBeenCalledWith({ limit: 100, offset: 0 });
  });

  it('returns 500 when the DB call fails', async () => {
    listOpenJobsMock.mockRejectedValue(new Error('boom'));

    const response = await getJobs(makeRequest(), context);

    expect(response.status).toBe(500);
  });
});
