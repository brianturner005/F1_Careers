import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { getUserIdForSessionMock, listSavedSearchesForUserMock } = vi.hoisted(() => ({
  getUserIdForSessionMock: vi.fn(),
  listSavedSearchesForUserMock: vi.fn(),
}));

vi.mock('@f1-job-radar/db', () => ({
  getUserIdForSession: getUserIdForSessionMock,
  listSavedSearchesForUser: listSavedSearchesForUserMock,
}));

const { getSavedSearches } = await import('./getSavedSearches.js');

function makeRequest(authHeader: string | null): HttpRequest {
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === 'authorization' ? authHeader : null),
    },
  } as unknown as HttpRequest;
}

const context = { error: vi.fn(), log: vi.fn() } as unknown as InvocationContext;

afterEach(() => {
  vi.clearAllMocks();
});

describe('getSavedSearches', () => {
  it('returns 401 when not signed in', async () => {
    getUserIdForSessionMock.mockResolvedValue(null);
    const response = await getSavedSearches(makeRequest(null), context);
    expect(response.status).toBe(401);
  });

  it("returns the user's saved searches", async () => {
    getUserIdForSessionMock.mockResolvedValue('u1');
    listSavedSearchesForUserMock.mockResolvedValue([{ id: 's1' }]);

    const response = await getSavedSearches(makeRequest('Bearer token'), context);

    expect(response.status).toBe(200);
    expect(listSavedSearchesForUserMock).toHaveBeenCalledWith('u1');
    expect(response.jsonBody).toEqual({ savedSearches: [{ id: 's1' }] });
  });
});
