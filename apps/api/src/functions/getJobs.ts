import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { listOpenJobs, type ListOpenJobsOptions } from '@f1-job-radar/db';
import { withDb } from '../shared/withDb.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Query params that pass straight through to a ListOpenJobsOptions field of
// the same name — every one is an exact-match filter, applied only when present.
const PASSTHROUGH_FILTERS = [
  'company',
  'category',
  'locationCountry',
  'workplaceType',
  'employmentType',
  'search',
] as const satisfies ReadonlyArray<keyof ListOpenJobsOptions>;

export async function getJobs(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const limitParam = Number(request.query.get('limit'));
  const offsetParam = Number(request.query.get('offset'));

  const limit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

  const options: ListOpenJobsOptions = { limit, offset };
  for (const key of PASSTHROUGH_FILTERS) {
    const value = request.query.get(key);
    if (value) options[key] = value;
  }

  try {
    const { jobs, total } = await listOpenJobs(options);
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
  handler: withDb(getJobs),
});
