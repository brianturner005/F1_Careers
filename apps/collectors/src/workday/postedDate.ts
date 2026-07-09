const DAY_MS = 24 * 60 * 60 * 1000;

// Workday's list endpoint returns relative text ("Posted Today",
// "Posted 3 Days Ago") rather than an absolute date, so this is
// necessarily approximate. An absolute date is only available from the
// job-detail endpoint, which we don't call for every posting on every run.
export function parseRelativePostedOn(
  text: string | undefined,
  now: Date = new Date(),
): string | null {
  if (!text) return null;
  const normalized = text.trim().toLowerCase();
  if (normalized.includes('today')) return now.toISOString();
  if (normalized.includes('yesterday')) return new Date(now.getTime() - DAY_MS).toISOString();

  const match = normalized.match(/(\d+)\+?\s*days?\s*ago/);
  if (match?.[1]) {
    const days = Number(match[1]);
    return new Date(now.getTime() - days * DAY_MS).toISOString();
  }
  return null;
}
