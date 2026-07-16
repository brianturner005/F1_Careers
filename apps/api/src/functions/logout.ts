import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { deleteSession } from '@f1-job-radar/db';

const BEARER_PREFIX = 'Bearer ';

export async function logout(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith(BEARER_PREFIX)
    ? authHeader.slice(BEARER_PREFIX.length).trim()
    : null;

  if (token) {
    try {
      await deleteSession(token);
    } catch (err) {
      context.error('POST /api/auth/logout failed', err);
      return { status: 500, jsonBody: { error: 'Internal error' } };
    }
  }

  return { status: 200, jsonBody: { message: 'Signed out' } };
}

app.http('logout', {
  route: 'auth/logout',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: logout,
});
