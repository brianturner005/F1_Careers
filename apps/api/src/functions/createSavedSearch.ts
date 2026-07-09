import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { createSavedSearch as createSavedSearchRow } from '@f1-job-radar/db';
import {
  ALERT_FREQUENCIES,
  type AlertFrequency,
  type SavedSearchFilters,
} from '@f1-job-radar/schema';
import { readJsonBody } from '../shared/readJsonBody.js';
import { requireSession } from '../shared/requireSession.js';

const FILTER_KEYS = [
  'company',
  'category',
  'workplaceType',
  'employmentType',
  'locationCountry',
  'search',
] as const satisfies ReadonlyArray<keyof SavedSearchFilters>;

function extractFilters(value: unknown): SavedSearchFilters {
  if (typeof value !== 'object' || value === null) return {};
  const filters: SavedSearchFilters = {};
  for (const key of FILTER_KEYS) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === 'string' && raw) filters[key] = raw;
  }
  return filters;
}

function isAlertFrequency(value: unknown): value is AlertFrequency {
  return typeof value === 'string' && (ALERT_FREQUENCIES as readonly string[]).includes(value);
}

export async function createSavedSearch(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const userId = await requireSession(request);
  if (!userId) return { status: 401, jsonBody: { error: 'Not signed in' } };

  const body = await readJsonBody(request);
  if (typeof body !== 'object' || body === null) {
    return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
  }

  const rawName = (body as { name?: unknown }).name;
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (!name) {
    return { status: 400, jsonBody: { error: 'name is required' } };
  }

  const frequency = (body as { frequency?: unknown }).frequency;
  if (!isAlertFrequency(frequency)) {
    return {
      status: 400,
      jsonBody: { error: `frequency must be one of: ${ALERT_FREQUENCIES.join(', ')}` },
    };
  }

  const filters = extractFilters((body as { filters?: unknown }).filters);
  if (Object.keys(filters).length === 0) {
    return { status: 400, jsonBody: { error: 'At least one filter is required' } };
  }

  try {
    const savedSearch = await createSavedSearchRow({ userId, name, filters, frequency });
    return { status: 201, jsonBody: { savedSearch } };
  } catch (err) {
    context.error('POST /api/saved-searches failed', err);
    return { status: 500, jsonBody: { error: 'Internal error' } };
  }
}

app.http('createSavedSearch', {
  route: 'saved-searches',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createSavedSearch,
});
