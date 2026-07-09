import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJobs } from './api.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchJobs', () => {
  it('requests /api/jobs with the given limit and offset', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ jobs: [], total: 0, limit: 10, offset: 5 }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchJobs(10, 5);

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/jobs?limit=10&offset=5'));
    expect(result.total).toBe(0);
  });

  it('throws when the response is not OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 })),
    );

    await expect(fetchJobs()).rejects.toThrow(/500/);
  });
});
