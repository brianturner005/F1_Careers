import { useEffect, useState } from 'react';
import type { Source } from '@f1-job-radar/schema';
import { fetchSources } from './api.js';
import { JobsFeed } from './JobsFeed.js';
import { SourceHealth } from './SourceHealth.js';

type View = 'feed' | 'health';

export function App() {
  const [view, setView] = useState<View>('feed');
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    fetchSources()
      .then((data) => setSources(data.sources))
      .catch(() => setSources([]));
  }, []);

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
        </nav>
      </header>
      {view === 'feed' ? <JobsFeed companies={companies} /> : <SourceHealth sources={sources} />}
    </main>
  );
}
