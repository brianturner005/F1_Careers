import type { EmailMessage, EmailSender } from './sender.js';

// Local-dev / no-API-key fallback: logs instead of sending. Selected
// automatically by createEmailSender() when RESEND_API_KEY isn't set — never
// use this in production.
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:console] to=${message.to} subject="${message.subject}"\n${message.text}`);
  }
}
