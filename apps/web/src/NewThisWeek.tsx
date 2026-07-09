import { useEffect, useState } from 'react';
import type { Job } from '@f1-job-radar/schema';
import { fetchNewThisWeek } from './api.js';

type LoadState = 'loading' | 'ready' | 'error';

export function groupByCompany(jobs: Job[]): Map<string, Job[]> {
  const groups = new Map<string, Job[]>();
  for (const job of jobs) {
    const list = groups.get(job.company) ?? [];
    list.push(job);
    groups.set(job.company, list);
  }
  return groups;
}

export function NewThisWeek() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchNewThisWeek()
      .then((data) => {
        if (cancelled) return;
        setJobs(data.jobs);
        setTotal(data.total);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = groupByCompany(jobs);

  return (
    <section>
      <h2>New This Week</h2>
      {state === 'loading' && <p>Loading…</p>}
      {state === 'error' && <p>Couldn&apos;t load this week&apos;s new postings.</p>}
      {state === 'ready' && total === 0 && (
        <p>No new postings in the last 7 days — check back soon.</p>
      )}
      {state === 'ready' && total > 0 && (
        <>
          <p>
            {total} new role{total === 1 ? '' : 's'} across F1 this week.
          </p>
          {[...groups.entries()].map(([company, companyJobs]) => (
            <div key={company}>
              <h3>{company}</h3>
              <ul>
                {companyJobs.map((job) => (
                  <li key={job.id}>
                    <a href={job.applyUrl} target="_blank" rel="noreferrer">
                      <strong>{job.title}</strong>
                    </a>
                    {job.locationText ? ` · ${job.locationText}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
