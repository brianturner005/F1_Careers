import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { listOpenJobs } from '@f1-job-radar/db';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function getNewThisWeek(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const limitParam = Number(request.query.get('limit'));
  const offsetParam = Number(request.query.get('offset'));

  const limit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

  const firstSeenAfter = new Date(Date.now() - WEEK_MS).toISOString();

  try {
    const { jobs, total } = await listOpenJobs({ firstSeenAfter, limit, offset });
    return { status: 200, jsonBody: { jobs, total, limit, offset } };
  } catch (err) {
    context.error('GET /api/jobs/new-this-week failed', err);
    return { status: 500, jsonBody: { error: 'Internal error fetching new jobs' } };
  }
}

app.http('getNewThisWeek', {
  route: 'jobs/new-this-week',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getNewThisWeek,
});
