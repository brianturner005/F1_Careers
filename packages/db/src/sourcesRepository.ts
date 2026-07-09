import type { Source, SourceStatus } from '@f1-job-radar/schema';
import { getPool } from './pool.js';

interface SourceRow {
  id: string;
  display_name: string;
  company: string;
  ats_platform: string;
  status: string;
  last_run_at: Date | null;
}

function rowToSource(row: SourceRow): Source {
  return {
    id: row.id,
    displayName: row.display_name,
    company: row.company,
    atsPlatform: row.ats_platform,
    status: row.status as SourceStatus,
    lastRunAt: row.last_run_at ? row.last_run_at.toISOString() : null,
  };
}

// Backs the collector-health admin view (brief §8, principle 2).
export async function listSources(): Promise<Source[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query<SourceRow>('SELECT * FROM sources ORDER BY display_name');
  return result.recordset.map(rowToSource);
}
