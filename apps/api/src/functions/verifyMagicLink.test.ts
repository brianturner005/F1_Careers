import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { consumeMagicLinkTokenMock, createSessionMock, getUserByIdMock } = vi.hoisted(() => ({
  consumeMagicLinkTokenMock: vi.fn(),
  createSessionMock: vi.fn(),
  getUserByIdMock: vi.fn(),
}));

vi.mock('@f1-job-radar/db', () => ({
  consumeMagicLinkToken: consumeMagicLinkTokenMock,
  createSession: createSessionMock,
  getUserById: getUserByIdMock,
}));

const { verifyMagicLink } = await import('./verifyMagicLink.js');

function makeRequest(body: unknown): HttpRequest {
  return { json: async () => body } as unknown as HttpRequest;
}

const context = { error: vi.fn(), log: vi.fn() } as unknown as InvocationContext;

afterEach(() => {
  vi.clearAllMocks();
});

describe('verifyMagicLink', () => {
  it('rejects a missing token', async () => {
    const response = await verifyMagicLink(makeRequest({}), context);
    expect(response.status).toBe(400);
  });

  it('returns 401 for an invalid/expired token', async () => {
    consumeMagicLinkTokenMock.mockResolvedValue(null);

    const response = await verifyMagicLink(makeRequest({ token: 'bad' }), context);

    expect(response.status).toBe(401);
  });

  it('issues a session for a valid token', async () => {
    consumeMagicLinkTokenMock.mockResolvedValue('u1');
    getUserByIdMock.mockResolvedValue({ id: 'u1', email: 'brian@example.com', createdAt: 'x' });
    createSessionMock.mockResolvedValue('session-token');

    const response = await verifyMagicLink(makeRequest({ token: 'good' }), context);

    expect(response.status).toBe(200);
    expect(response.jsonBody).toEqual({
      sessionToken: 'session-token',
      email: 'brian@example.com',
    });
  });
});
