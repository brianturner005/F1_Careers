import type { Job, RawPosting } from '@f1-job-radar/schema';
import type { CollectorConfig } from './collector.js';
import { classify } from './classify.js';
import {
  extractTags,
  guessEmploymentType,
  guessLocationCountry,
  guessWorkplaceType,
} from './heuristics.js';
import { computeJobId } from './id.js';

const EXCERPT_MAX_LENGTH = 500;

export function normalizePosting(raw: RawPosting, config: CollectorConfig, now: string): Job {
  const locationText = raw.locationText ?? null;
  const descriptionExcerpt = (raw.descriptionExcerpt ?? '').slice(0, EXCERPT_MAX_LENGTH);

  return {
    id: computeJobId(config.id, raw.externalId),
    source: config.id,
    externalId: raw.externalId,
    company: config.company,
    title: raw.title,
    category: classify(raw.title, raw.rawDepartment ?? null),
    rawDepartment: raw.rawDepartment ?? null,
    locationText,
    locationCountry: guessLocationCountry(locationText),
    workplaceType: guessWorkplaceType(locationText),
    employmentType: guessEmploymentType(raw.title),
    descriptionExcerpt,
    applyUrl: raw.applyUrl,
    postedAt: raw.postedAt ?? null,
    firstSeenAt: now,
    lastSeenAt: now,
    status: 'open',
    tags: extractTags(raw.title, descriptionExcerpt),
  };
}

export function normalizePostings(raw: RawPosting[], config: CollectorConfig, now: string): Job[] {
  return raw.map((posting) => normalizePosting(posting, config, now));
}
