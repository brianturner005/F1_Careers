import { createHash } from 'node:crypto';

// Job.id per brief §7: "hash of source + external_id". Stable across runs
// so re-fetching the same posting always maps to the same row.
export function computeJobId(source: string, externalId: string): string {
  return createHash('sha256').update(`${source}:${externalId}`).digest('hex').slice(0, 24);
}
