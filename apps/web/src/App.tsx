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
import { HiringTrends } from './HiringTrends.js';
import { JobsFeed } from './JobsFeed.js';
import { NewThisWeek } from './NewThisWeek.js';
import { SaveSearchForm } from './SaveSearchForm.js';
import { SavedSearches } from './SavedSearches.js';
import { SignIn } from './SignIn.js';
import { SourceHealth } from './SourceHealth.js';

type View = 'feed' | 'health' | 'trends' | 'new' | 'saved' | 'signin' | 'about';

const PATH_TO_VIEW: Record<string, View> = {
  '/about': 'about',
  '/new-this-week': 'new',
};

export function App() {
  const [view, setView] = useState<View>(PATH_TO_VIEW[window.location.pathname] ?? 'feed');
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
    <>
      <header>
        <div className="wrap">
          <h1>🏎️ Paddock Jobs</h1>
          <nav className="tabs">
            <button type="button" onClick={() => setView('feed')} aria-pressed={view === 'feed'}>
              Jobs
            </button>
            <button type="button" onClick={() => setView('new')} aria-pressed={view === 'new'}>
              New This Week
            </button>
            <button
              type="button"
              onClick={() => setView('health')}
              aria-pressed={view === 'health'}
            >
              Source Health
            </button>
            <button
              type="button"
              onClick={() => setView('trends')}
              aria-pressed={view === 'trends'}
            >
              Hiring Trends
            </button>
            {email && (
              <button
                type="button"
                onClick={() => setView('saved')}
                aria-pressed={view === 'saved'}
              >
                Saved Searches
              </button>
            )}
            <button type="button" onClick={() => setView('about')} aria-pressed={view === 'about'}>
              About
            </button>
          </nav>
          <div className="account">
            {email ? (
              <>
                <span>{email}</span>
                <button type="button" className="danger" onClick={handleSignOut}>
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
          </div>
        </div>
      </header>

      <main>
        <div className="wrap">
          {view === 'feed' && (
            <JobsFeed
              companies={companies}
              filters={filters}
              onFiltersChange={setFilters}
              saveSearchSlot={email ? <SaveSearchForm filters={filters} /> : undefined}
            />
          )}
          {view === 'new' && <NewThisWeek />}
          {view === 'health' && <SourceHealth sources={sources} />}
          {view === 'trends' && <HiringTrends />}
          {view === 'saved' && email && <SavedSearches />}
          {view === 'signin' && <SignIn />}
          {view === 'about' && <About />}
        </div>
      </main>
    </>
  );
}
