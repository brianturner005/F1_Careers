import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { listOpenJobs } from '@f1-job-radar/db';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function getJobs(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const limitParam = Number(request.query.get('limit'));
  const offsetParam = Number(request.query.get('offset'));

  const limit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

  try {
    const { jobs, total } = await listOpenJobs({ limit, offset });
    return {
      status: 200,
      jsonBody: { jobs, total, limit, offset },
    };
  } catch (err) {
    context.error('GET /api/jobs failed', err);
    return { status: 500, jsonBody: { error: 'Internal error fetching jobs' } };
  }
}

app.http('getJobs', {
  route: 'jobs',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getJobs,
});
