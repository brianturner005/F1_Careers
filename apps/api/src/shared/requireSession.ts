import type { HttpRequest } from '@azure/functions';
import { getUserIdForSession } from '@f1-job-radar/db';

const BEARER_PREFIX = 'Bearer ';

// Session tokens travel as a bearer header rather than a cookie: the API
// (Function App) and web app (Static Web App) are on different origins in
// this infra layout, and a bearer token sidesteps SameSite/CORS-credentials
// complexity that cross-origin cookies would otherwise require.
export async function requireSession(request: HttpRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith(BEARER_PREFIX)) return null;

  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  if (!token) return null;

  return getUserIdForSession(token);
}
