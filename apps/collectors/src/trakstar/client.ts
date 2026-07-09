import { XMLParser } from 'fast-xml-parser';
import type { RawPosting } from '@f1-job-radar/schema';
import type { TrakstarFeed, TrakstarFeedItem } from './types.js';

export const TRAKSTAR_USER_AGENT =
  'F1JobRadarBot/0.1 (+https://github.com/brianturner005/F1_Careers)';

export interface TrakstarCollectorOptions {
  subdomain: string;
  /** Case-sensitive per Trakstar's documented feed URL pattern. */
  companyName: string;
  fetchImpl?: typeof fetch;
}

const parser = new XMLParser({ ignoreAttributes: false });

export async function fetchTrakstarPostings(
  options: TrakstarCollectorOptions,
): Promise<RawPosting[]> {
  const doFetch = options.fetchImpl ?? fetch;
  const url = `https://${options.subdomain}.hire.trakstar.com/jobfeeds/${options.companyName}`;

  const response = await doFetch(url, {
    headers: { 'User-Agent': TRAKSTAR_USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(
      `Trakstar request failed for ${options.subdomain}: ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();
  const feed = parser.parse(xml) as TrakstarFeed;
  const items = feed.rss?.channel?.item;
  const itemList = Array.isArray(items) ? items : items ? [items] : [];

  return itemList.map(toRawPosting);
}

function toRawPosting(item: TrakstarFeedItem): RawPosting {
  const guid = typeof item.guid === 'string' ? item.guid : item.guid?.['#text'];

  return {
    externalId: guid ?? item.link ?? item.title ?? '',
    title: item.title ?? '',
    locationText: item['job:location'] ?? null,
    rawDepartment: item['job:team'] ?? null,
    applyUrl: item.link ?? '',
    descriptionExcerpt: stripHtml(item.description ?? ''),
    postedAt: item.pubDate ? safeParseDate(item.pubDate) : null,
  };
}

function safeParseDate(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
