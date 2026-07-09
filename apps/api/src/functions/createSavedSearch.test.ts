import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { getUserIdForSessionMock, createSavedSearchRowMock } = vi.hoisted(() => ({
  getUserIdForSessionMock: vi.fn(),
  createSavedSearchRowMock: vi.fn(),
}));

vi.mock('@f1-job-radar/db', () => ({
  getUserIdForSession: getUserIdForSessionMock,
  createSavedSearch: createSavedSearchRowMock,
}));

const { createSavedSearch } = await import('./createSavedSearch.js');

function makeRequest(authHeader: string | null, body: unknown): HttpRequest {
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === 'authorization' ? authHeader : null),
    },
    json: async () => body,
  } as unknown as HttpRequest;
}

const context = { error: vi.fn(), log: vi.fn() } as unknown as InvocationContext;

afterEach(() => {
  vi.clearAllMocks();
});

describe('createSavedSearch', () => {
  it('returns 401 when not signed in', async () => {
    getUserIdForSessionMock.mockResolvedValue(null);
    const response = await createSavedSearch(makeRequest(null, {}), context);
    expect(response.status).toBe(401);
  });

  it('rejects a missing name', async () => {
    getUserIdForSessionMock.mockResolvedValue('u1');
    const response = await createSavedSearch(
      makeRequest('Bearer t', { frequency: 'daily', filters: { search: 'sre' } }),
      context,
    );
    expect(response.status).toBe(400);
  });

  it('rejects an invalid frequency', async () => {
    getUserIdForSessionMock.mockResolvedValue('u1');
    const response = await createSavedSearch(
      makeRequest('Bearer t', {
        name: 'SRE roles',
        frequency: 'instant',
        filters: { search: 'sre' },
      }),
      context,
    );
    expect(response.status).toBe(400);
  });

  it('rejects when no filters are provided', async () => {
    getUserIdForSessionMock.mockResolvedValue('u1');
    const response = await createSavedSearch(
      makeRequest('Bearer t', { name: 'SRE roles', frequency: 'daily', filters: {} }),
      context,
    );
    expect(response.status).toBe(400);
  });

  it('creates a saved search with valid input, dropping unknown filter keys', async () => {
    getUserIdForSessionMock.mockResolvedValue('u1');
    createSavedSearchRowMock.mockResolvedValue({ id: 's1' });

    const response = await createSavedSearch(
      makeRequest('Bearer t', {
        name: 'SRE roles',
        frequency: 'daily',
        filters: { search: 'sre', notARealFilter: 'x' },
      }),
      context,
    );

    expect(response.status).toBe(201);
    expect(createSavedSearchRowMock).toHaveBeenCalledWith({
      userId: 'u1',
      name: 'SRE roles',
      filters: { search: 'sre' },
      frequency: 'daily',
    });
  });
});
