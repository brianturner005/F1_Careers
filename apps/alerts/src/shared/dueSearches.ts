import type { AlertFrequency, SavedSearch } from '@f1-job-radar/schema';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function isDue(search: SavedSearch, frequency: AlertFrequency, now: Date): boolean {
  if (!search.lastAlertedAt) return true;

  const lastAlertedAt = new Date(search.lastAlertedAt);
  if (frequency === 'daily') {
    return !isSameUtcDay(lastAlertedAt, now);
  }
  return now.getTime() - lastAlertedAt.getTime() >= WEEK_MS;
}

export function selectDueSearches(
  searches: SavedSearch[],
  frequency: AlertFrequency,
  now: Date,
): SavedSearch[] {
  return searches.filter((search) => isDue(search, frequency, now));
}
