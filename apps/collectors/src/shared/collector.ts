import type { RawPosting } from '@f1-job-radar/schema';

export interface CollectorConfig {
  /** Stable id used as the `source` field on every Job this collector produces, and as its DB key. */
  id: string;
  company: string;
  atsPlatform: string;
}

export interface Collector {
  readonly config: CollectorConfig;
  fetch(): Promise<RawPosting[]>;
}
