import { ConsoleEmailSender } from './consoleSender.js';
import { ResendEmailSender } from './resendSender.js';
import type { EmailSender } from './sender.js';

// Picks Resend when RESEND_API_KEY + EMAIL_FROM are configured, otherwise
// falls back to logging — so local dev and this build environment (neither
// has a Resend account) work without special-casing callers.
export function createEmailSender(env: NodeJS.ProcessEnv = process.env): EmailSender {
  const apiKey = env.RESEND_API_KEY;
  const from = env.EMAIL_FROM;
  if (apiKey && from) {
    return new ResendEmailSender({ apiKey, from });
  }
  return new ConsoleEmailSender();
}
