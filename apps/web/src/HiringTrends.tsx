import { useEffect, useState } from 'react';
import type { HiringTrendPoint } from '@f1-job-radar/schema';
import { fetchHiringTrends } from './api.js';

type LoadState = 'loading' | 'ready' | 'error';

export interface CompanyTotal {
  company: string;
  total: number;
}

export function aggregateByCompany(points: HiringTrendPoint[]): CompanyTotal[] {
  const totals = new Map<string, number>();
  for (const point of points) {
    totals.set(point.company, (totals.get(point.company) ?? 0) + point.opened);
  }
  return [...totals.entries()]
    .map(([company, total]) => ({ company, total }))
    .sort((a, b) => b.total - a.total);
}

export function HiringTrends() {
  const [points, setPoints] = useState<HiringTrendPoint[]>([]);
  const [weeks, setWeeks] = useState(12);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    fetchHiringTrends(weeks)
      .then((data) => {
        if (cancelled) return;
        setPoints(data.trends);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [weeks]);

  const totals = aggregateByCompany(points);
  const maxTotal = Math.max(1, ...totals.map((t) => t.total));

  return (
    <section>
      <h2>Hiring Trends</h2>
      <label>
        Window:{' '}
        <select value={weeks} onChange={(event) => setWeeks(Number(event.target.value))}>
          <option value={4}>Last 4 weeks</option>
          <option value={12}>Last 12 weeks</option>
          <option value={26}>Last 6 months</option>
          <option value={52}>Last year</option>
        </select>
      </label>

      {state === 'loading' && <p>Loading…</p>}
      {state === 'error' && <p>Couldn&apos;t load hiring trends.</p>}
      {state === 'ready' && totals.length === 0 && <p>No postings recorded in this window yet.</p>}
      {state === 'ready' && totals.length > 0 && (
        <ul className="hiring-trends">
          {totals.map(({ company, total }) => (
            <li key={company}>
              <div className="hiring-trends-label">
                {company} — {total} role{total === 1 ? '' : 's'}
              </div>
              <div className="hiring-trends-track">
                <div
                  className="hiring-trends-bar"
                  style={{ width: `${(total / maxTotal) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
