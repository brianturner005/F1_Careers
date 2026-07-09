import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJobs, fetchSources } from './api.js';

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

    const result = await fetchJobs({}, 10, 5);

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/jobs?limit=10&offset=5'));
    expect(result.total).toBe(0);
  });

  it('includes non-empty filters as query params', async () => {
    const fetchMock = vi.fn(
      async (_url: string) =>
        new Response(JSON.stringify({ jobs: [], total: 0, limit: 20, offset: 0 }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchJobs({ company: 'Red Bull Racing', search: 'sre', category: '' });

    const requestedUrl = fetchMock.mock.calls[0]?.[0];
    expect(requestedUrl).toContain('company=Red+Bull+Racing');
    expect(requestedUrl).toContain('search=sre');
    expect(requestedUrl).not.toContain('category=');
  });

  it('throws when the response is not OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 })),
    );

    await expect(fetchJobs()).rejects.toThrow(/500/);
  });
});

describe('fetchSources', () => {
  it('requests /api/sources', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ sources: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchSources();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/sources'));
    expect(result.sources).toEqual([]);
  });

  it('throws when the response is not OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 })),
    );

    await expect(fetchSources()).rejects.toThrow(/500/);
  });
});
