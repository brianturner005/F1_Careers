import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSessionToken,
  createSavedSearch,
  deleteSavedSearch,
  fetchJobs,
  fetchMe,
  fetchSavedSearches,
  fetchSources,
  getSessionToken,
  logout,
  requestMagicLink,
  setSessionToken,
  verifyMagicLink,
} from './api.js';

beforeEach(() => {
  localStorage.clear();
});

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

describe('session token helpers', () => {
  it('round-trips through localStorage', () => {
    expect(getSessionToken()).toBeNull();
    setSessionToken('abc');
    expect(getSessionToken()).toBe('abc');
    clearSessionToken();
    expect(getSessionToken()).toBeNull();
  });
});

describe('requestMagicLink', () => {
  it('posts the email', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ message: 'ok' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await requestMagicLink('brian@example.com');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/request-link'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('surfaces the server error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: 'A valid email is required' }), { status: 400 }),
      ),
    );

    await expect(requestMagicLink('bad')).rejects.toThrow('A valid email is required');
  });
});

describe('verifyMagicLink', () => {
  it('returns the session token and email on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ sessionToken: 'st', email: 'brian@example.com' }), {
            status: 200,
          }),
      ),
    );

    const result = await verifyMagicLink('good-token');

    expect(result).toEqual({ sessionToken: 'st', email: 'brian@example.com' });
  });
});

describe('fetchMe / logout', () => {
  it('sends the bearer token when one is set', async () => {
    setSessionToken('my-token');
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ email: 'brian@example.com' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchMe();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({ headers: { Authorization: 'Bearer my-token' } }),
    );
  });

  it('clears the session token on logout even if the request fails', async () => {
    setSessionToken('my-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    await expect(logout()).rejects.toThrow();
    expect(getSessionToken()).toBeNull();
  });
});

describe('saved searches', () => {
  it('creates a saved search with auth + content-type headers', async () => {
    setSessionToken('my-token');
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ savedSearch: { id: 's1' } }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await createSavedSearch({
      name: 'SRE roles',
      filters: { search: 'sre' },
      frequency: 'daily',
    });

    expect(result.savedSearch).toEqual({ id: 's1' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/saved-searches'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    );
  });

  it('lists saved searches', async () => {
    setSessionToken('my-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ savedSearches: [] }), { status: 200 })),
    );

    const result = await fetchSavedSearches();
    expect(result.savedSearches).toEqual([]);
  });

  it('deletes a saved search by id', async () => {
    setSessionToken('my-token');
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await deleteSavedSearch('s1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/saved-searches/s1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
