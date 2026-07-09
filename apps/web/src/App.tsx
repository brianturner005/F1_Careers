import { useEffect, useState } from 'react';
import type { Job } from '@f1-job-radar/schema';
import { fetchJobs } from './api.js';

type LoadState = 'loading' | 'ready' | 'error';

export function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchJobs()
      .then((data) => {
        if (cancelled) return;
        setJobs(data.jobs);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>F1 Job Radar</h1>
      {state === 'loading' && <p>Loading jobs…</p>}
      {state === 'error' && <p>Couldn&apos;t load jobs. Try again shortly.</p>}
      {state === 'ready' && jobs.length === 0 && <p>No open roles right now.</p>}
      {state === 'ready' && jobs.length > 0 && (
        <ul>
          {jobs.map((job) => (
            <li key={job.id}>
              <a href={job.applyUrl} target="_blank" rel="noreferrer">
                <strong>{job.title}</strong>
              </a>
              {' — '}
              {job.company}
              {job.locationText ? ` · ${job.locationText}` : ''}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
