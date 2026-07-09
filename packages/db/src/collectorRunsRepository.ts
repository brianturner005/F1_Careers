import sql from 'mssql';
import type { CollectorRun } from '@f1-job-radar/schema';
import { getPool } from './pool.js';

// Records a run in the audit log and updates the parent source's health
// summary — this pair is what the collector-health dashboard (brief §8,
// principle 2) reads from.
export async function recordCollectorRun(run: CollectorRun): Promise<void> {
  const pool = await getPool();

  await pool
    .request()
    .input('source', sql.NVarChar, run.source)
    .input('startedAt', sql.DateTime2, new Date(run.startedAt))
    .input('finishedAt', sql.DateTime2, new Date(run.finishedAt))
    .input('postingsFound', sql.Int, run.postingsFound)
    .input('postingsNew', sql.Int, run.postingsNew)
    .input('postingsClosed', sql.Int, run.postingsClosed)
    .input('error', sql.NVarChar(sql.MAX), run.error).query(`
      INSERT INTO collector_runs
        (source, started_at, finished_at, postings_found, postings_new, postings_closed, error)
      VALUES
        (@source, @startedAt, @finishedAt, @postingsFound, @postingsNew, @postingsClosed, @error)
    `);

  await pool
    .request()
    .input('source', sql.NVarChar, run.source)
    .input('lastRunAt', sql.DateTime2, new Date(run.finishedAt))
    .input('status', sql.NVarChar, run.error ? 'failing' : 'healthy').query(`
      UPDATE sources SET last_run_at = @lastRunAt, status = @status WHERE id = @source
    `);
}
