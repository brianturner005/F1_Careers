import { useEffect, useState } from 'react';
import type { Job } from '@f1-job-radar/schema';
import { CATEGORIES, EMPLOYMENT_TYPES, WORKPLACE_TYPES } from '@f1-job-radar/schema';
import { fetchJobs, type JobFilters } from './api.js';

type LoadState = 'loading' | 'ready' | 'error';

interface JobsFeedProps {
  companies: string[];
}

export function JobsFeed({ companies }: JobsFeedProps) {
  const [filters, setFilters] = useState<JobFilters>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    fetchJobs(filters)
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
  }, [filters]);

  function updateFilter(key: keyof JobFilters, value: string): void {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  return (
    <section>
      <form aria-label="Filter jobs" onSubmit={(event) => event.preventDefault()}>
        <input
          type="search"
          placeholder="Search title or description…"
          value={filters.search ?? ''}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
        <select
          aria-label="Team"
          value={filters.company ?? ''}
          onChange={(event) => updateFilter('company', event.target.value)}
        >
          <option value="">All teams</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
        <select
          aria-label="Category"
          value={filters.category ?? ''}
          onChange={(event) => updateFilter('category', event.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          aria-label="Workplace type"
          value={filters.workplaceType ?? ''}
          onChange={(event) => updateFilter('workplaceType', event.target.value)}
        >
          <option value="">Any workplace</option>
          {WORKPLACE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          aria-label="Employment type"
          value={filters.employmentType ?? ''}
          onChange={(event) => updateFilter('employmentType', event.target.value)}
        >
          <option value="">Any employment type</option>
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </form>

      {state === 'loading' && <p>Loading jobs…</p>}
      {state === 'error' && <p>Couldn&apos;t load jobs. Try again shortly.</p>}
      {state === 'ready' && jobs.length === 0 && <p>No open roles match these filters.</p>}
      {state === 'ready' && jobs.length > 0 && (
        <>
          <p>
            {total} open role{total === 1 ? '' : 's'}
          </p>
          <ul>
            {jobs.map((job) => (
              <li key={job.id}>
                <a href={job.applyUrl} target="_blank" rel="noreferrer">
                  <strong>{job.title}</strong>
                </a>
                {' — '}
                {job.company}
                {job.locationText ? ` · ${job.locationText}` : ''}
                {' · '}
                <span>{job.category}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
