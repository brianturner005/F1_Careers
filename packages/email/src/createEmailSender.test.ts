import { describe, expect, it } from 'vitest';
import { ConsoleEmailSender } from './consoleSender.js';
import { createEmailSender } from './createEmailSender.js';
import { ResendEmailSender } from './resendSender.js';

describe('createEmailSender', () => {
  it('returns a ResendEmailSender when RESEND_API_KEY and EMAIL_FROM are set', () => {
    const sender = createEmailSender({
      RESEND_API_KEY: 'key',
      EMAIL_FROM: 'a@b.com',
    } as NodeJS.ProcessEnv);
    expect(sender).toBeInstanceOf(ResendEmailSender);
  });

  it('falls back to ConsoleEmailSender when the API key is missing', () => {
    const sender = createEmailSender({} as NodeJS.ProcessEnv);
    expect(sender).toBeInstanceOf(ConsoleEmailSender);
  });

  it('falls back to ConsoleEmailSender when only the API key is set', () => {
    const sender = createEmailSender({ RESEND_API_KEY: 'key' } as NodeJS.ProcessEnv);
    expect(sender).toBeInstanceOf(ConsoleEmailSender);
  });
});
