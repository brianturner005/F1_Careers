import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Job } from '@f1-job-radar/schema';
import { CATEGORIES, EMPLOYMENT_TYPES, WORKPLACE_TYPES } from '@f1-job-radar/schema';
import { fetchJobs, type JobFilters } from './api.js';

type LoadState = 'loading' | 'ready' | 'error';

const PAGE_SIZE = 20;

interface JobsFeedProps {
  companies: string[];
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  saveSearchSlot?: ReactNode;
}

export function JobsFeed({ companies, filters, onFiltersChange, saveSearchSlot }: JobsFeedProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadState>('loading');
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    fetchJobs(filters, PAGE_SIZE, 0)
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

  async function loadMore(): Promise<void> {
    setLoadingMore(true);
    try {
      const data = await fetchJobs(filters, PAGE_SIZE, jobs.length);
      setJobs((prev) => [...prev, ...data.jobs]);
    } catch {
      setState('error');
    } finally {
      setLoadingMore(false);
    }
  }

  function updateFilter(key: keyof JobFilters, value: string): void {
    onFiltersChange({ ...filters, [key]: value || undefined });
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

      {saveSearchSlot}

      {state === 'loading' && <p className="state-message">Loading jobs…</p>}
      {state === 'error' && (
        <p className="state-message">Couldn&apos;t load jobs. Try again shortly.</p>
      )}
      {state === 'ready' && jobs.length === 0 && (
        <p className="state-message">No open roles match these filters.</p>
      )}
      {state === 'ready' && jobs.length > 0 && (
        <>
          <p className="results-count">
            {total} open role{total === 1 ? '' : 's'}
          </p>
          <ul className="job-list">
            {jobs.map((job) => (
              <li key={job.id} className="job-card">
                <a href={job.applyUrl} target="_blank" rel="noreferrer" className="job-title">
                  {job.title}
                </a>
                <span className="job-meta">
                  {job.company}
                  {job.locationText ? ` · ${job.locationText}` : ''}
                </span>
                <span className="job-category">{job.category}</span>
              </li>
            ))}
          </ul>
          {jobs.length < total && (
            <button type="button" className="load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : `Load more (${total - jobs.length} remaining)`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
