import { randomUUID } from 'node:crypto';
import type { AlertFrequency, SavedSearch, SavedSearchFilters } from '@f1-job-radar/schema';
import { getContainer, isCosmosNotFound } from './cosmosClient.js';

export interface CreateSavedSearchInput {
  userId: string;
  name: string;
  filters: SavedSearchFilters;
  frequency: AlertFrequency;
}

function toSavedSearch(doc: SavedSearch): SavedSearch {
  return {
    id: doc.id,
    userId: doc.userId,
    name: doc.name,
    filters: doc.filters,
    frequency: doc.frequency,
    createdAt: doc.createdAt,
    lastAlertedAt: doc.lastAlertedAt,
  };
}

export async function createSavedSearch(input: CreateSavedSearchInput): Promise<SavedSearch> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const container = getContainer('savedSearches');

  const doc: SavedSearch = {
    id,
    userId: input.userId,
    name: input.name,
    filters: input.filters,
    frequency: input.frequency,
    createdAt,
    lastAlertedAt: null,
  };
  await container.items.create(doc);

  return doc;
}

export async function listSavedSearchesForUser(userId: string): Promise<SavedSearch[]> {
  const container = getContainer('savedSearches');
  const { resources } = await container.items
    .query<SavedSearch>(
      {
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: userId }],
      },
      { partitionKey: userId },
    )
    .fetchAll();
  return resources.map(toSavedSearch);
}

// Returns true if a saved search owned by userId was deleted. Scoped to
// userId's partition, so an id belonging to a different user simply 404s
// rather than needing a separate ownership check.
export async function deleteSavedSearch(id: string, userId: string): Promise<boolean> {
  const container = getContainer('savedSearches');
  try {
    await container.item(id, userId).delete();
    return true;
  } catch (err) {
    if (isCosmosNotFound(err)) return false;
    throw err;
  }
}

// Candidates for the alert worker. Whether a given search is actually due
// today/this week is decided by the caller (packages/db has no notion of
// "now" as a business concept) — this just filters by frequency. Cross
// partition (no userId to scope to), fine at this app's user-count scale.
export async function listSavedSearchesByFrequency(
  frequency: AlertFrequency,
): Promise<SavedSearch[]> {
  const container = getContainer('savedSearches');
  const { resources } = await container.items
    .query<SavedSearch>({
      query: 'SELECT * FROM c WHERE c.frequency = @frequency',
      parameters: [{ name: '@frequency', value: frequency }],
    })
    .fetchAll();
  return resources.map(toSavedSearch);
}

export async function markSavedSearchAlerted(
  id: string,
  userId: string,
  alertedAt: string,
): Promise<void> {
  const container = getContainer('savedSearches');
  await container
    .item(id, userId)
    .patch([{ op: 'replace', path: '/lastAlertedAt', value: alertedAt }]);
}
