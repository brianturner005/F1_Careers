export type SourceStatus = 'healthy' | 'degraded' | 'failing';

// One row per collector run — feeds the collector-health admin view (brief §8, principle 2).
export interface CollectorRun {
  source: string;
  startedAt: string;
  finishedAt: string;
  postingsFound: number;
  postingsNew: number;
  postingsClosed: number;
  error: string | null;
}

export interface Source {
  id: string;
  displayName: string;
  company: string;
  atsPlatform: string;
  status: SourceStatus;
  lastRunAt: string | null;
}
