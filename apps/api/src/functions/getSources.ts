import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { listSources } from '@f1-job-radar/db';
import { withDb } from '../shared/withDb.js';

// Backs the public collector-health indicator (brief §8, principle 2): which
// sources are healthy/degraded/failing and when each last ran.
export async function getSources(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const sources = await listSources();
    return { status: 200, jsonBody: { sources } };
  } catch (err) {
    context.error('GET /api/sources failed', err);
    return { status: 500, jsonBody: { error: 'Internal error fetching sources' } };
  }
}

app.http('getSources', {
  route: 'sources',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: withDb(getSources),
});
