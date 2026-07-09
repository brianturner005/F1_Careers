import type { RawPosting } from '@f1-job-radar/schema';
import type { PinpointPosting, PinpointPostingsResponse } from './types.js';

export const PINPOINT_USER_AGENT =
  'F1JobRadarBot/0.1 (+https://github.com/brianturner005/F1_Careers)';

export interface PinpointCollectorOptions {
  subdomain: string;
  fetchImpl?: typeof fetch;
}

export async function fetchPinpointPostings(
  options: PinpointCollectorOptions,
): Promise<RawPosting[]> {
  const doFetch = options.fetchImpl ?? fetch;
  const url = `https://${options.subdomain}.pinpointhq.com/postings.json`;

  const response = await doFetch(url, {
    headers: { 'User-Agent': PINPOINT_USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(
      `Pinpoint request failed for ${options.subdomain}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as PinpointPostingsResponse;
  return data.map(toRawPosting);
}

function toRawPosting(posting: PinpointPosting): RawPosting {
  const descriptionHtml = [
    posting.description,
    posting.key_responsibilities,
    posting.skills_knowledge_expertise,
    posting.benefits,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' ');

  return {
    externalId: String(posting.id),
    title: posting.title,
    locationText: formatLocation(posting.location),
    rawDepartment: posting.department?.name ?? null,
    applyUrl: posting.url,
    descriptionExcerpt: stripHtml(descriptionHtml),
    // Pinpoint's postings.json doesn't document a posted-date field;
    // verify live before relying on one.
    postedAt: null,
  };
}

function formatLocation(location: PinpointPosting['location']): string | null {
  if (!location) return null;
  const parts = [location.city, location.region, location.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
