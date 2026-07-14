import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { createMagicLinkToken, findOrCreateUserByEmail } from '@f1-job-radar/db';
import { createEmailSender, magicLinkEmail } from '@f1-job-radar/email';
import { readJsonBody } from '../shared/readJsonBody.js';
import { withDb } from '../shared/withDb.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_WEB_BASE_URL = 'http://localhost:5173';

function extractEmail(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('email' in body)) return null;
  const email = String((body as { email: unknown }).email)
    .trim()
    .toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

export async function requestMagicLink(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const email = extractEmail(await readJsonBody(request));
  if (!email) {
    return { status: 400, jsonBody: { error: 'A valid email is required' } };
  }

  try {
    const user = await findOrCreateUserByEmail(email);
    const token = await createMagicLinkToken(user.id);
    const webBaseUrl = process.env.WEB_BASE_URL ?? DEFAULT_WEB_BASE_URL;
    const verifyUrl = `${webBaseUrl}/verify?token=${encodeURIComponent(token)}`;

    await createEmailSender().send({ to: email, ...magicLinkEmail(verifyUrl) });

    // Same response whether or not the account already existed, so this
    // endpoint can't be used to enumerate registered emails.
    return { status: 200, jsonBody: { message: 'Check your email for a sign-in link.' } };
  } catch (err) {
    context.error('POST /api/auth/request-link failed', err);
    return { status: 500, jsonBody: { error: 'Internal error requesting sign-in link' } };
  }
}

app.http('requestMagicLink', {
  route: 'auth/request-link',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: withDb(requestMagicLink),
});
