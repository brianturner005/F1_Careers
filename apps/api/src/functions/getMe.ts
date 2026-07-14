import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { getUserById } from '@f1-job-radar/db';
import { requireSession } from '../shared/requireSession.js';
import { withDb } from '../shared/withDb.js';

export async function getMe(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const userId = await requireSession(request);
    if (!userId) return { status: 401, jsonBody: { error: 'Not signed in' } };

    const user = await getUserById(userId);
    if (!user) return { status: 401, jsonBody: { error: 'Not signed in' } };

    return { status: 200, jsonBody: { email: user.email } };
  } catch (err) {
    context.error('GET /api/auth/me failed', err);
    return { status: 500, jsonBody: { error: 'Internal error' } };
  }
}

app.http('getMe', {
  route: 'auth/me',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: withDb(getMe),
});
