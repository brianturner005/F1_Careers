import { randomUUID } from 'node:crypto';
import sql from 'mssql';
import type { AlertFrequency, SavedSearch, SavedSearchFilters } from '@f1-job-radar/schema';
import { rowToSavedSearch, type SavedSearchRow } from './accountsRowMapping.js';
import { getPool } from './pool.js';

export interface CreateSavedSearchInput {
  userId: string;
  name: string;
  filters: SavedSearchFilters;
  frequency: AlertFrequency;
}

export async function createSavedSearch(input: CreateSavedSearchInput): Promise<SavedSearch> {
  const id = randomUUID();
  const createdAt = new Date();
  const pool = await getPool();

  await pool
    .request()
    .input('id', sql.NVarChar, id)
    .input('userId', sql.NVarChar, input.userId)
    .input('name', sql.NVarChar, input.name)
    .input('filters', sql.NVarChar, JSON.stringify(input.filters))
    .input('frequency', sql.NVarChar, input.frequency)
    .input('createdAt', sql.DateTime2, createdAt).query(`
      INSERT INTO saved_searches (id, user_id, name, filters, frequency, created_at)
      VALUES (@id, @userId, @name, @filters, @frequency, @createdAt)
    `);

  return {
    id,
    userId: input.userId,
    name: input.name,
    filters: input.filters,
    frequency: input.frequency,
    createdAt: createdAt.toISOString(),
    lastAlertedAt: null,
  };
}

export async function listSavedSearchesForUser(userId: string): Promise<SavedSearch[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.NVarChar, userId)
    .query<SavedSearchRow>(
      'SELECT * FROM saved_searches WHERE user_id = @userId ORDER BY created_at DESC',
    );
  return result.recordset.map(rowToSavedSearch);
}

// Returns true if a row owned by userId was deleted.
export async function deleteSavedSearch(id: string, userId: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.NVarChar, id)
    .input('userId', sql.NVarChar, userId)
    .query('DELETE FROM saved_searches WHERE id = @id AND user_id = @userId');
  return (result.rowsAffected[0] ?? 0) > 0;
}

// Candidates for the alert worker. Whether a given search is actually due
// today/this week is decided by the caller (packages/db has no notion of
// "now" as a business concept) — this just filters by frequency.
export async function listSavedSearchesByFrequency(
  frequency: AlertFrequency,
): Promise<SavedSearch[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('frequency', sql.NVarChar, frequency)
    .query<SavedSearchRow>('SELECT * FROM saved_searches WHERE frequency = @frequency');
  return result.recordset.map(rowToSavedSearch);
}

export async function markSavedSearchAlerted(id: string, alertedAt: string): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.NVarChar, id)
    .input('alertedAt', sql.DateTime2, new Date(alertedAt))
    .query('UPDATE saved_searches SET last_alerted_at = @alertedAt WHERE id = @id');
}
