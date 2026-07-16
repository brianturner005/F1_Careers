import type { HiringTrendPoint } from '@f1-job-radar/schema';
import { getContainer } from './cosmosClient.js';

export interface GetHiringTrendsOptions {
  weeks?: number;
}

const DEFAULT_WEEKS = 12;
const MAX_WEEKS = 52;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// Buckets firstSeenAt into rolling 7-day windows from the Unix epoch --
// same standard bucketing trick the old SQL DATEADD/DATEDIFF version used
// (just against a different epoch, which doesn't matter since only the
// bucket boundaries relative to each other are meaningful here, not any
// particular calendar alignment). Done in app code because Cosmos's query
// language has no DATEADD/DATEDIFF equivalent, and at this app's scale
// fetching the (small) matching set and bucketing/aggregating in memory is
// simpler than trying to express it as a single query.
export function bucketStart(iso: string): string {
  const ms = new Date(iso).getTime();
  const daysSinceEpoch = Math.floor(ms / DAY_MS);
  const bucketStartDays = Math.floor(daysSinceEpoch / 7) * 7;
  return new Date(bucketStartDays * DAY_MS).toISOString();
}

interface JobSummary {
  company: string;
  category: string;
  firstSeenAt: string;
}

export async function getHiringTrends(
  options: GetHiringTrendsOptions = {},
): Promise<HiringTrendPoint[]> {
  const weeks = Math.min(options.weeks ?? DEFAULT_WEEKS, MAX_WEEKS);
  const since = new Date(Date.now() - weeks * WEEK_MS).toISOString();

  const container = getContainer('jobs');
  const { resources } = await container.items
    .query<JobSummary>({
      query: 'SELECT c.company, c.category, c.firstSeenAt FROM c WHERE c.firstSeenAt >= @since',
      parameters: [{ name: '@since', value: since }],
    })
    .fetchAll();

  const buckets = new Map<string, HiringTrendPoint>();
  for (const { company, category, firstSeenAt } of resources) {
    const periodStart = bucketStart(firstSeenAt);
    const key = `${periodStart}|${company}|${category}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.opened += 1;
    } else {
      buckets.set(key, { periodStart, company, category, opened: 1 });
    }
  }

  return [...buckets.values()].sort((a, b) => a.periodStart.localeCompare(b.periodStart));
}
