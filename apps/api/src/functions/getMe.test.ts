import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { getUserIdForSessionMock, getUserByIdMock } = vi.hoisted(() => ({
  getUserIdForSessionMock: vi.fn(),
  getUserByIdMock: vi.fn(),
}));

vi.mock('@f1-job-radar/db', () => ({
  getUserIdForSession: getUserIdForSessionMock,
  getUserById: getUserByIdMock,
}));

const { getMe } = await import('./getMe.js');

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

describe('getMe', () => {
  it('returns 401 with no Authorization header', async () => {
    const response = await getMe(makeRequest(null), context);
    expect(response.status).toBe(401);
  });

  it('returns 401 for an invalid session token', async () => {
    getUserIdForSessionMock.mockResolvedValue(null);
    const response = await getMe(makeRequest('Bearer bad-token'), context);
    expect(response.status).toBe(401);
  });

  it('returns the signed-in user email for a valid session', async () => {
    getUserIdForSessionMock.mockResolvedValue('u1');
    getUserByIdMock.mockResolvedValue({ id: 'u1', email: 'brian@example.com', createdAt: 'x' });

    const response = await getMe(makeRequest('Bearer good-token'), context);

    expect(response.status).toBe(200);
    expect(response.jsonBody).toEqual({ email: 'brian@example.com' });
  });
});
