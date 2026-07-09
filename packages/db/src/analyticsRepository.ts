import sql from 'mssql';
import type { HiringTrendPoint } from '@f1-job-radar/schema';
import { getPool } from './pool.js';

interface HiringTrendRow {
  period_start: Date;
  company: string;
  category: string;
  opened: number;
}

export function rowToHiringTrendPoint(row: HiringTrendRow): HiringTrendPoint {
  return {
    periodStart: row.period_start.toISOString(),
    company: row.company,
    category: row.category,
    opened: row.opened,
  };
}

export interface GetHiringTrendsOptions {
  weeks?: number;
}

const DEFAULT_WEEKS = 12;
const MAX_WEEKS = 52;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Buckets first_seen_at into rolling 7-day windows from the SQL Server epoch
// (day 0 = 1900-01-01) rather than true calendar weeks — a standard,
// index-friendly bucketing trick; good enough for a trend chart, not
// intended to line up with ISO week numbers.
export async function getHiringTrends(
  options: GetHiringTrendsOptions = {},
): Promise<HiringTrendPoint[]> {
  const weeks = Math.min(options.weeks ?? DEFAULT_WEEKS, MAX_WEEKS);
  const since = new Date(Date.now() - weeks * WEEK_MS);

  const pool = await getPool();
  const result = await pool.request().input('since', sql.DateTime2, since).query<HiringTrendRow>(`
      SELECT
        DATEADD(day, DATEDIFF(day, 0, first_seen_at) / 7 * 7, 0) AS period_start,
        company,
        category,
        COUNT(*) AS opened
      FROM jobs
      WHERE first_seen_at >= @since
      GROUP BY DATEADD(day, DATEDIFF(day, 0, first_seen_at) / 7 * 7, 0), company, category
      ORDER BY period_start ASC
    `);

  return result.recordset.map(rowToHiringTrendPoint);
}
