import { useEffect, useState } from 'react';
import type { SavedSearch } from '@f1-job-radar/schema';
import { deleteSavedSearch, fetchSavedSearches } from './api.js';

type LoadState = 'loading' | 'ready' | 'error';

export function SavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  function load(): void {
    setState('loading');
    fetchSavedSearches()
      .then((data) => {
        setSavedSearches(data.savedSearches);
        setState('ready');
      })
      .catch(() => setState('error'));
  }

  useEffect(load, []);

  async function handleDelete(id: string): Promise<void> {
    await deleteSavedSearch(id);
    load();
  }

  if (state === 'loading') return <p>Loading saved searches…</p>;
  if (state === 'error') return <p>Couldn&apos;t load saved searches.</p>;
  if (savedSearches.length === 0) {
    return <p>No saved searches yet — set filters on the Jobs tab and save them.</p>;
  }

  return (
    <ul>
      {savedSearches.map((search) => (
        <li key={search.id}>
          <strong>{search.name}</strong> — {search.frequency} digest
          <button type="button" onClick={() => handleDelete(search.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
