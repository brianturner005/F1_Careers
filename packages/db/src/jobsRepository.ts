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
  company?: string;
  category?: string;
  locationCountry?: string;
  workplaceType?: string;
  employmentType?: string;
  /** Case-insensitive substring match against title + description. */
  search?: string;
  /** ISO timestamp; only jobs first seen strictly after this are returned. Used by the alert digest worker. */
  firstSeenAfter?: string;
}

export interface ListOpenJobsResult {
  jobs: Job[];
  total: number;
}

const DEFAULT_PAGE_SIZE = 20;

// Escapes LIKE wildcards in user-supplied search text so `%`/`_` are matched
// literally rather than acting as wildcards. The escaped value is still
// bound via a parameterized input, never concatenated into the query text.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export async function listOpenJobs(options: ListOpenJobsOptions = {}): Promise<ListOpenJobsResult> {
  const limit = options.limit ?? DEFAULT_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const pool = await getPool();
  const request = pool.request().input('limit', sql.Int, limit).input('offset', sql.Int, offset);

  const conditions = ["status = 'open'"];

  if (options.company) {
    request.input('company', sql.NVarChar, options.company);
    conditions.push('company = @company');
  }
  if (options.category) {
    request.input('category', sql.NVarChar, options.category);
    conditions.push('category = @category');
  }
  if (options.locationCountry) {
    request.input('locationCountry', sql.NChar(2), options.locationCountry);
    conditions.push('location_country = @locationCountry');
  }
  if (options.workplaceType) {
    request.input('workplaceType', sql.NVarChar, options.workplaceType);
    conditions.push('workplace_type = @workplaceType');
  }
  if (options.employmentType) {
    request.input('employmentType', sql.NVarChar, options.employmentType);
    conditions.push('employment_type = @employmentType');
  }
  if (options.search) {
    request.input('search', sql.NVarChar, `%${escapeLikePattern(options.search)}%`);
    conditions.push(
      "(title LIKE @search ESCAPE '\\' OR description_excerpt LIKE @search ESCAPE '\\')",
    );
  }
  if (options.firstSeenAfter) {
    request.input('firstSeenAfter', sql.DateTime2, new Date(options.firstSeenAfter));
    conditions.push('first_seen_at > @firstSeenAfter');
  }

  const result = await request.query<JobRow & { total_count: number }>(`
    SELECT *, COUNT(*) OVER() AS total_count
    FROM jobs
    WHERE ${conditions.join(' AND ')}
    ORDER BY COALESCE(posted_at, first_seen_at) DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return {
    jobs: result.recordset.map(rowToJob),
    total: result.recordset[0]?.total_count ?? 0,
  };
}
