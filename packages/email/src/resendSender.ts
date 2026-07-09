import type { EmailMessage, EmailSender } from './sender.js';

export interface ResendEmailSenderOptions {
  apiKey: string;
  from: string;
  fetchImpl?: typeof fetch;
}

// Resend's public HTTP API (https://resend.com/docs/api-reference/emails/send-email).
// Not verified against a live account — no Resend API key is available in
// this build environment. Verify with a real key before relying on it.
export class ResendEmailSender implements EmailSender {
  constructor(private readonly options: ResendEmailSenderOptions) {}

  async send(message: EmailMessage): Promise<void> {
    const doFetch = this.options.fetchImpl ?? fetch;
    const response = await doFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.options.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend request failed: ${response.status} ${response.statusText}`);
    }
  }
}
