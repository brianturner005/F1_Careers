import type { RawPosting } from '@f1-job-radar/schema';
import type { WorkdayJobPosting, WorkdayJobsResponse } from './types.js';
import { parseRelativePostedOn } from './postedDate.js';

export const WORKDAY_USER_AGENT =
  'F1JobRadarBot/0.1 (+https://github.com/brianturner005/F1_Careers)';

export interface WorkdayCollectorOptions {
  tenant: string;
  site: string;
  /** Override the Workday data-center host (e.g. wd1/wd5 tenants). Defaults to `${tenant}.wd3.myworkdayjobs.com`. */
  host?: string;
  pageSize?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULT_PAGE_SIZE = 20;
// Safety cap so a misbehaving `total` value can't loop forever — 25 * 20 = 500
// postings, far above what any single team's careers site lists at once.
const MAX_PAGES = 25;

export async function fetchWorkdayPostings(
  options: WorkdayCollectorOptions,
): Promise<RawPosting[]> {
  const host = options.host ?? `${options.tenant}.wd3.myworkdayjobs.com`;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const doFetch = options.fetchImpl ?? fetch;
  const listUrl = `https://${host}/wday/cxs/${options.tenant}/${options.site}/jobs`;

  const postings: RawPosting[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await doFetch(listUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': WORKDAY_USER_AGENT,
      },
      body: JSON.stringify({ appliedFacets: {}, limit: pageSize, offset, searchText: '' }),
    });

    if (!response.ok) {
      throw new Error(
        `Workday request failed for ${options.tenant}/${options.site}: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as WorkdayJobsResponse;
    for (const posting of data.jobPostings) {
      postings.push(toRawPosting(posting, host, options.site));
    }

    offset += pageSize;
    if (data.jobPostings.length < pageSize || offset >= data.total) break;
  }

  return postings;
}

function toRawPosting(posting: WorkdayJobPosting, host: string, site: string): RawPosting {
  // The requisition id (bulletFields[0], e.g. "R-12345") is more stable than
  // externalPath, which changes if the title/slug changes. Falls back to
  // externalPath if bulletFields is absent.
  const externalId = posting.bulletFields?.[0] ?? posting.externalPath;
  return {
    externalId,
    title: posting.title,
    locationText: posting.locationsText ?? null,
    applyUrl: `https://${host}/en-US/${site}${posting.externalPath}`,
    postedAt: parseRelativePostedOn(posting.postedOn),
  };
}
