import sql from 'mssql';
import type { Job } from '@f1-job-radar/schema';
import { getPool } from './pool.js';
import { rowToJob, type JobRow } from './rowMapping.js';

export async function getOpenJobsBySource(source: string): Promise<Job[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('source', sql.NVarChar, source)
    .query<JobRow>("SELECT * FROM jobs WHERE source = @source AND status = 'open'");
  return result.recordset.map(rowToJob);
}

// Insert-or-update every job in one transaction, keyed on the primary key
// `id` (hash of source + externalId — see packages/schema Job.id).
export async function upsertJobs(jobs: Job[]): Promise<void> {
  if (jobs.length === 0) return;

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    for (const job of jobs) {
      await transaction
        .request()
        .input('id', sql.NVarChar, job.id)
        .input('source', sql.NVarChar, job.source)
        .input('externalId', sql.NVarChar, job.externalId)
        .input('company', sql.NVarChar, job.company)
        .input('title', sql.NVarChar, job.title)
        .input('category', sql.NVarChar, job.category)
        .input('rawDepartment', sql.NVarChar, job.rawDepartment)
        .input('locationText', sql.NVarChar, job.locationText)
        .input('locationCountry', sql.NChar(2), job.locationCountry)
        .input('workplaceType', sql.NVarChar, job.workplaceType)
        .input('employmentType', sql.NVarChar, job.employmentType)
        .input('descriptionExcerpt', sql.NVarChar, job.descriptionExcerpt)
        .input('applyUrl', sql.NVarChar, job.applyUrl)
        .input('postedAt', sql.DateTime2, job.postedAt ? new Date(job.postedAt) : null)
        .input('firstSeenAt', sql.DateTime2, new Date(job.firstSeenAt))
        .input('lastSeenAt', sql.DateTime2, new Date(job.lastSeenAt))
        .input('status', sql.NVarChar, job.status)
        .input('tags', sql.NVarChar, JSON.stringify(job.tags)).query(`
          MERGE jobs AS target
          USING (SELECT @id AS id) AS src
          ON target.id = src.id
          WHEN MATCHED THEN UPDATE SET
            title = @title,
            category = @category,
            raw_department = @rawDepartment,
            location_text = @locationText,
            location_country = @locationCountry,
            workplace_type = @workplaceType,
            employment_type = @employmentType,
            description_excerpt = @descriptionExcerpt,
            apply_url = @applyUrl,
            posted_at = @postedAt,
            last_seen_at = @lastSeenAt,
            status = @status,
            tags = @tags
          WHEN NOT MATCHED THEN INSERT
            (id, source, external_id, company, title, category, raw_department, location_text,
             location_country, workplace_type, employment_type, description_excerpt, apply_url,
             posted_at, first_seen_at, last_seen_at, status, tags)
            VALUES
            (@id, @source, @externalId, @company, @title, @category, @rawDepartment, @locationText,
             @locationCountry, @workplaceType, @employmentType, @descriptionExcerpt, @applyUrl,
             @postedAt, @firstSeenAt, @lastSeenAt, @status, @tags);
        `);
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export interface ListOpenJobsOptions {
  limit?: number;
  offset?: number;
}

export interface ListOpenJobsResult {
  jobs: Job[];
  total: number;
}

const DEFAULT_PAGE_SIZE = 20;

export async function listOpenJobs(options: ListOpenJobsOptions = {}): Promise<ListOpenJobsResult> {
  const limit = options.limit ?? DEFAULT_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const pool = await getPool();
  const result = await pool
    .request()
    .input('limit', sql.Int, limit)
    .input('offset', sql.Int, offset).query<JobRow & { total_count: number }>(`
      SELECT *, COUNT(*) OVER() AS total_count
      FROM jobs
      WHERE status = 'open'
      ORDER BY COALESCE(posted_at, first_seen_at) DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

  return {
    jobs: result.recordset.map(rowToJob),
    total: result.recordset[0]?.total_count ?? 0,
  };
}
