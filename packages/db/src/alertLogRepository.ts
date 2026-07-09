import sql from 'mssql';
import { getPool } from './pool.js';

export interface RecordAlertInput {
  savedSearchId: string;
  sentAt: string;
  jobCount: number;
  error: string | null;
}

export async function recordAlert(input: RecordAlertInput): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('savedSearchId', sql.NVarChar, input.savedSearchId)
    .input('sentAt', sql.DateTime2, new Date(input.sentAt))
    .input('jobCount', sql.Int, input.jobCount)
    .input('error', sql.NVarChar(sql.MAX), input.error).query(`
      INSERT INTO alert_log (saved_search_id, sent_at, job_count, error)
      VALUES (@savedSearchId, @sentAt, @jobCount, @error)
    `);
}
