import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { consumeMagicLinkToken, createSession, getUserById } from '@f1-job-radar/db';
import { readJsonBody } from '../shared/readJsonBody.js';
import { withDb } from '../shared/withDb.js';

function extractToken(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('token' in body)) return null;
  const token = String((body as { token: unknown }).token);
  return token || null;
}

export async function verifyMagicLink(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const token = extractToken(await readJsonBody(request));
  if (!token) {
    return { status: 400, jsonBody: { error: 'token is required' } };
  }

  try {
    const userId = await consumeMagicLinkToken(token);
    if (!userId) {
      return { status: 401, jsonBody: { error: 'This sign-in link is invalid or has expired.' } };
    }

    const user = await getUserById(userId);
    if (!user) {
      return { status: 401, jsonBody: { error: 'Account no longer exists.' } };
    }

    const sessionToken = await createSession(userId);
    return { status: 200, jsonBody: { sessionToken, email: user.email } };
  } catch (err) {
    context.error('POST /api/auth/verify failed', err);
    return { status: 500, jsonBody: { error: 'Internal error verifying sign-in link' } };
  }
}

app.http('verifyMagicLink', {
  route: 'auth/verify',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: withDb(verifyMagicLink),
});
