import { describe, expect, it, vi } from 'vitest';
import { ResendEmailSender } from './resendSender.js';

describe('ResendEmailSender', () => {
  it('POSTs to the Resend API with the expected shape', async () => {
    const fetchImpl = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response('', { status: 200 }),
    );
    const sender = new ResendEmailSender({
      apiKey: 'test-key',
      from: 'alerts@example.com',
      fetchImpl,
    });

    await sender.send({ to: 'brian@example.com', subject: 'Hi', text: 'Body' });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
    const body = JSON.parse((fetchImpl.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body).toEqual({
      from: 'alerts@example.com',
      to: ['brian@example.com'],
      subject: 'Hi',
      text: 'Body',
    });
  });

  it('throws a descriptive error on a non-OK response', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('', { status: 401, statusText: 'Unauthorized' }),
    );
    const sender = new ResendEmailSender({
      apiKey: 'bad-key',
      from: 'alerts@example.com',
      fetchImpl,
    });

    await expect(sender.send({ to: 'a@b.com', subject: 'x', text: 'y' })).rejects.toThrow(/401/);
  });
});
