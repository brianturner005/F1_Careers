import type { SqlParameter } from '@azure/cosmos';
import type { Job } from '@f1-job-radar/schema';
import { getContainer } from './cosmosClient.js';

// Cosmos documents in the `jobs` container already match this shape
// directly; this just discards Cosmos's system properties (_rid, _etag,
// etc.) so they never leak into an API response.
function toJob(doc: Job): Job {
  return {
    id: doc.id,
    source: doc.source,
    externalId: doc.externalId,
    company: doc.company,
    title: doc.title,
    category: doc.category,
    rawDepartment: doc.rawDepartment,
    locationText: doc.locationText,
    locationCountry: doc.locationCountry,
    workplaceType: doc.workplaceType,
    employmentType: doc.employmentType,
    descriptionExcerpt: doc.descriptionExcerpt,
    applyUrl: doc.applyUrl,
    postedAt: doc.postedAt,
    firstSeenAt: doc.firstSeenAt,
    lastSeenAt: doc.lastSeenAt,
    status: doc.status,
    tags: doc.tags,
  };
}

export async function getOpenJobsBySource(source: string): Promise<Job[]> {
  const container = getContainer('jobs');
  const { resources } = await container.items
    .query<Job>(
      {
        query: "SELECT * FROM c WHERE c.source = @source AND c.status = 'open'",
        parameters: [{ name: '@source', value: source }],
      },
      { partitionKey: source },
    )
    .fetchAll();
  return resources.map(toJob);
}

// Each job document already carries its final field values by the time it
// reaches here (see diffPostings, which merges in the original firstSeenAt
// for updated/unchanged jobs) so a plain whole-document upsert is correct —
// no separate insert-vs-update branching needed the way the old SQL MERGE
// required.
export async function upsertJobs(jobs: Job[]): Promise<void> {
  if (jobs.length === 0) return;
  const container = getContainer('jobs');
  await Promise.all(jobs.map((job) => container.items.upsert(job)));
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

export async function listOpenJobs(options: ListOpenJobsOptions = {}): Promise<ListOpenJobsResult> {
  const limit = options.limit ?? DEFAULT_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const conditions = ["c.status = 'open'"];
  const parameters: SqlParameter[] = [];

  if (options.company) {
    conditions.push('c.company = @company');
    parameters.push({ name: '@company', value: options.company });
  }
  if (options.category) {
    conditions.push('c.category = @category');
    parameters.push({ name: '@category', value: options.category });
  }
  if (options.locationCountry) {
    conditions.push('c.locationCountry = @locationCountry');
    parameters.push({ name: '@locationCountry', value: options.locationCountry });
  }
  if (options.workplaceType) {
    conditions.push('c.workplaceType = @workplaceType');
    parameters.push({ name: '@workplaceType', value: options.workplaceType });
  }
  if (options.employmentType) {
    conditions.push('c.employmentType = @employmentType');
    parameters.push({ name: '@employmentType', value: options.employmentType });
  }
  if (options.search) {
    conditions.push(
      '(CONTAINS(c.title, @search, true) OR CONTAINS(c.descriptionExcerpt, @search, true))',
    );
    parameters.push({ name: '@search', value: options.search });
  }
  if (options.firstSeenAfter) {
    conditions.push('c.firstSeenAt > @firstSeenAfter');
    parameters.push({ name: '@firstSeenAfter', value: options.firstSeenAfter });
  }

  const container = getContainer('jobs');
  const { resources } = await container.items
    .query<Job>({
      query: `SELECT * FROM c WHERE ${conditions.join(' AND ')}`,
      parameters,
    })
    .fetchAll();

  const jobs = resources.map(toJob);

  // Cosmos's ORDER BY can't express "postedAt, falling back to firstSeenAt
  // when null" the way the old SQL COALESCE could -- at this app's scale
  // (a few thousand jobs at most) sorting and paginating in memory here is
  // simpler than fighting that, and plenty fast. Same trade-off as
  // getHiringTrends's week-bucketing below.
  jobs.sort((a, b) => (b.postedAt ?? b.firstSeenAt).localeCompare(a.postedAt ?? a.firstSeenAt));

  return {
    jobs: jobs.slice(offset, offset + limit),
    total: jobs.length,
  };
}
