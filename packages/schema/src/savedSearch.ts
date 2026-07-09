// MVP ships daily/weekly digests only (brief §4.3: "MVP can start with a
// single 'all new jobs' daily digest and grow into per-search alerts").
// Instant alerts would need to hook into the collector diff step rather
// than a timer, so it's left out here rather than exposed as a selectable
// option that silently does nothing.
export const ALERT_FREQUENCIES = ['daily', 'weekly'] as const;
export type AlertFrequency = (typeof ALERT_FREQUENCIES)[number];

// Mirrors ListOpenJobsOptions' filter fields (packages/db), minus
// limit/offset, so it can be stored as JSON and reused by both the API and
// the alert digest worker.
export interface SavedSearchFilters {
  company?: string;
  category?: string;
  workplaceType?: string;
  employmentType?: string;
  locationCountry?: string;
  search?: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SavedSearchFilters;
  frequency: AlertFrequency;
  createdAt: string;
  lastAlertedAt: string | null;
}

export interface AlertLogEntry {
  id: number;
  savedSearchId: string;
  sentAt: string;
  jobCount: number;
  error: string | null;
}
