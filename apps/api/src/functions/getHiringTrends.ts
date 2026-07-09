import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { getHiringTrends } from '@f1-job-radar/db';

const DEFAULT_WEEKS = 12;
const MAX_WEEKS = 52;

export async function getHiringTrendsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const weeksParam = Number(request.query.get('weeks'));
  const weeks =
    Number.isFinite(weeksParam) && weeksParam > 0 ? Math.min(weeksParam, MAX_WEEKS) : DEFAULT_WEEKS;

  try {
    const trends = await getHiringTrends({ weeks });
    return { status: 200, jsonBody: { trends, weeks } };
  } catch (err) {
    context.error('GET /api/analytics/hiring-trends failed', err);
    return { status: 500, jsonBody: { error: 'Internal error fetching hiring trends' } };
  }
}

app.http('getHiringTrends', {
  route: 'analytics/hiring-trends',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getHiringTrendsHandler,
});
