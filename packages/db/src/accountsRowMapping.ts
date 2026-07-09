import type { AlertFrequency, SavedSearch, SavedSearchFilters, User } from '@f1-job-radar/schema';

export interface UserRow {
  id: string;
  email: string;
  created_at: Date;
}

export function rowToUser(row: UserRow): User {
  return { id: row.id, email: row.email, createdAt: row.created_at.toISOString() };
}

export interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  filters: string;
  frequency: string;
  created_at: Date;
  last_alerted_at: Date | null;
}

export function rowToSavedSearch(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    filters: JSON.parse(row.filters) as SavedSearchFilters,
    frequency: row.frequency as AlertFrequency,
    createdAt: row.created_at.toISOString(),
    lastAlertedAt: row.last_alerted_at ? row.last_alerted_at.toISOString() : null,
  };
}
