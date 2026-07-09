import { useEffect, useState } from 'react';
import type { Source } from '@f1-job-radar/schema';
import {
  clearSessionToken,
  fetchMe,
  fetchSources,
  getSessionToken,
  logout as apiLogout,
  type JobFilters,
} from './api.js';
import { About } from './About.js';
import { JobsFeed } from './JobsFeed.js';
import { SaveSearchForm } from './SaveSearchForm.js';
import { SavedSearches } from './SavedSearches.js';
import { SignIn } from './SignIn.js';
import { SourceHealth } from './SourceHealth.js';

type View = 'feed' | 'health' | 'saved' | 'signin' | 'about';

export function App() {
  const [view, setView] = useState<View>(window.location.pathname === '/about' ? 'about' : 'feed');
  const [sources, setSources] = useState<Source[]>([]);
  const [filters, setFilters] = useState<JobFilters>({});
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchSources()
      .then((data) => setSources(data.sources))
      .catch(() => setSources([]));
  }, []);

  useEffect(() => {
    if (!getSessionToken()) return;
    fetchMe()
      .then((data) => setEmail(data.email))
      .catch(() => {
        clearSessionToken();
        setEmail(null);
      });
  }, []);

  async function handleSignOut(): Promise<void> {
    await apiLogout();
    setEmail(null);
    setView('feed');
  }

  const companies = [...new Set(sources.map((source) => source.company))].sort();

  return (
    <main>
      <header>
        <h1>F1 Job Radar</h1>
        <nav>
          <button type="button" onClick={() => setView('feed')} aria-pressed={view === 'feed'}>
            Jobs
          </button>
          <button type="button" onClick={() => setView('health')} aria-pressed={view === 'health'}>
            Source Health
          </button>
          {email && (
            <button type="button" onClick={() => setView('saved')} aria-pressed={view === 'saved'}>
              Saved Searches
            </button>
          )}
          <button type="button" onClick={() => setView('about')} aria-pressed={view === 'about'}>
            About
          </button>
          {email ? (
            <>
              <span>{email}</span>
              <button type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setView('signin')}
              aria-pressed={view === 'signin'}
            >
              Sign in
            </button>
          )}
        </nav>
      </header>

      {view === 'feed' && (
        <JobsFeed
          companies={companies}
          filters={filters}
          onFiltersChange={setFilters}
          saveSearchSlot={email ? <SaveSearchForm filters={filters} /> : undefined}
        />
      )}
      {view === 'health' && <SourceHealth sources={sources} />}
      {view === 'saved' && email && <SavedSearches />}
      {view === 'signin' && <SignIn />}
      {view === 'about' && <About />}
    </main>
  );
}
