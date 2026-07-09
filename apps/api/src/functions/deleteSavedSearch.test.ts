import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { getUserIdForSessionMock, deleteSavedSearchRowMock } = vi.hoisted(() => ({
  getUserIdForSessionMock: vi.fn(),
  deleteSavedSearchRowMock: vi.fn(),
}));

vi.mock('@f1-job-radar/db', () => ({
  getUserIdForSession: getUserIdForSessionMock,
  deleteSavedSearch: deleteSavedSearchRowMock,
}));

const { deleteSavedSearch } = await import('./deleteSavedSearch.js');

function makeRequest(authHeader: string | null, id: string): HttpRequest {
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === 'authorization' ? authHeader : null),
    },
    params: { id },
  } as unknown as HttpRequest;
}

const context = { error: vi.fn(), log: vi.fn() } as unknown as InvocationContext;

afterEach(() => {
  vi.clearAllMocks();
});

describe('deleteSavedSearch', () => {
  it('returns 401 when not signed in', async () => {
    getUserIdForSessionMock.mockResolvedValue(null);
    const response = await deleteSavedSearch(makeRequest(null, 's1'), context);
    expect(response.status).toBe(401);
  });

  it("returns 404 when the search doesn't exist or isn't owned by the caller", async () => {
    getUserIdForSessionMock.mockResolvedValue('u1');
    deleteSavedSearchRowMock.mockResolvedValue(false);

    const response = await deleteSavedSearch(makeRequest('Bearer t', 's1'), context);

    expect(response.status).toBe(404);
  });

  it('returns 204 on successful delete', async () => {
    getUserIdForSessionMock.mockResolvedValue('u1');
    deleteSavedSearchRowMock.mockResolvedValue(true);

    const response = await deleteSavedSearch(makeRequest('Bearer t', 's1'), context);

    expect(response.status).toBe(204);
    expect(deleteSavedSearchRowMock).toHaveBeenCalledWith('s1', 'u1');
  });
});
