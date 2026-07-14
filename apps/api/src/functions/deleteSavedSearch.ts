import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { deleteSavedSearch as deleteSavedSearchRow } from '@f1-job-radar/db';
import { requireSession } from '../shared/requireSession.js';
import { withDb } from '../shared/withDb.js';

export async function deleteSavedSearch(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const userId = await requireSession(request);
  if (!userId) return { status: 401, jsonBody: { error: 'Not signed in' } };

  const id = request.params.id;
  if (!id) return { status: 400, jsonBody: { error: 'id is required' } };

  try {
    const deleted = await deleteSavedSearchRow(id, userId);
    if (!deleted) return { status: 404, jsonBody: { error: 'Not found' } };
    return { status: 204 };
  } catch (err) {
    context.error('DELETE /api/saved-searches/{id} failed', err);
    return { status: 500, jsonBody: { error: 'Internal error' } };
  }
}

app.http('deleteSavedSearch', {
  route: 'saved-searches/{id}',
  methods: ['DELETE'],
  authLevel: 'anonymous',
  handler: withDb(deleteSavedSearch),
});
