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
      {state === 'loading' && <p className="state-message">Loading…</p>}
      {state === 'error' && (
        <p className="state-message">Couldn&apos;t load this week&apos;s new postings.</p>
      )}
      {state === 'ready' && total === 0 && (
        <p className="state-message">No new postings in the last 7 days — check back soon.</p>
      )}
      {state === 'ready' && total > 0 && (
        <>
          <p className="results-count">
            {total} new role{total === 1 ? '' : 's'} across F1 this week.
          </p>
          {[...groups.entries()].map(([company, companyJobs]) => (
            <div key={company} className="company-group">
              <h3>{company}</h3>
              <ul className="job-list">
                {companyJobs.map((job) => (
                  <li key={job.id} className="job-card">
                    <a href={job.applyUrl} target="_blank" rel="noreferrer" className="job-title">
                      {job.title}
                    </a>
                    {job.locationText ? <span className="job-meta">{job.locationText}</span> : null}
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
