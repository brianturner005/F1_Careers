import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { deleteSessionMock } = vi.hoisted(() => ({ deleteSessionMock: vi.fn() }));

vi.mock('@f1-job-radar/db', () => ({ deleteSession: deleteSessionMock }));

const { logout } = await import('./logout.js');

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

describe('logout', () => {
  it('deletes the session when a bearer token is present', async () => {
    const response = await logout(makeRequest('Bearer sometoken'), context);

    expect(response.status).toBe(200);
    expect(deleteSessionMock).toHaveBeenCalledWith('sometoken');
  });

  it('is a no-op when no Authorization header is present', async () => {
    const response = await logout(makeRequest(null), context);

    expect(response.status).toBe(200);
    expect(deleteSessionMock).not.toHaveBeenCalled();
  });
});
