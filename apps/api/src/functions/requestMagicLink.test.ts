import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { findOrCreateUserByEmailMock, createMagicLinkTokenMock, sendMock, createEmailSenderMock } =
  vi.hoisted(() => ({
    findOrCreateUserByEmailMock: vi.fn(),
    createMagicLinkTokenMock: vi.fn(),
    sendMock: vi.fn(),
    createEmailSenderMock: vi.fn(),
  }));

vi.mock('@f1-job-radar/db', () => ({
  findOrCreateUserByEmail: findOrCreateUserByEmailMock,
  createMagicLinkToken: createMagicLinkTokenMock,
}));

vi.mock('@f1-job-radar/email', () => ({
  createEmailSender: createEmailSenderMock,
  magicLinkEmail: (url: string) => ({ subject: 'Sign in', text: url }),
}));

const { requestMagicLink } = await import('./requestMagicLink.js');

function makeRequest(body: unknown): HttpRequest {
  return { json: async () => body } as unknown as HttpRequest;
}

const context = { error: vi.fn(), log: vi.fn() } as unknown as InvocationContext;

beforeEach(() => {
  createEmailSenderMock.mockReturnValue({ send: sendMock });
  findOrCreateUserByEmailMock.mockResolvedValue({
    id: 'u1',
    email: 'brian@example.com',
    createdAt: 'x',
  });
  createMagicLinkTokenMock.mockResolvedValue('raw-token');
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('requestMagicLink', () => {
  it('rejects an invalid email', async () => {
    const response = await requestMagicLink(makeRequest({ email: 'not-an-email' }), context);
    expect(response.status).toBe(400);
    expect(findOrCreateUserByEmailMock).not.toHaveBeenCalled();
  });

  it('creates/finds the user, mints a token, and sends the email', async () => {
    const response = await requestMagicLink(makeRequest({ email: 'Brian@Example.com' }), context);

    expect(response.status).toBe(200);
    expect(findOrCreateUserByEmailMock).toHaveBeenCalledWith('brian@example.com');
    expect(createMagicLinkTokenMock).toHaveBeenCalledWith('u1');
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'brian@example.com',
        text: expect.stringContaining('raw-token'),
      }),
    );
  });

  it('returns 500 when the DB call fails', async () => {
    findOrCreateUserByEmailMock.mockRejectedValue(new Error('boom'));

    const response = await requestMagicLink(makeRequest({ email: 'brian@example.com' }), context);

    expect(response.status).toBe(500);
  });
});
