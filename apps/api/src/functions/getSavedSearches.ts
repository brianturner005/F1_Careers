import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { listSavedSearchesForUser } from '@f1-job-radar/db';
import { requireSession } from '../shared/requireSession.js';
import { withDb } from '../shared/withDb.js';

export async function getSavedSearches(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const userId = await requireSession(request);
    if (!userId) return { status: 401, jsonBody: { error: 'Not signed in' } };

    const savedSearches = await listSavedSearchesForUser(userId);
    return { status: 200, jsonBody: { savedSearches } };
  } catch (err) {
    context.error('GET /api/saved-searches failed', err);
    return { status: 500, jsonBody: { error: 'Internal error' } };
  }
}

app.http('getSavedSearches', {
  route: 'saved-searches',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: withDb(getSavedSearches),
});
