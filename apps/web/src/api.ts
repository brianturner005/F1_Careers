import type { AlertFrequency, Job, SavedSearch, Source } from '@f1-job-radar/schema';

export interface JobsResponse {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

export interface JobFilters {
  company?: string;
  category?: string;
  workplaceType?: string;
  employmentType?: string;
  locationCountry?: string;
  search?: string;
}

export interface SourcesResponse {
  sources: Source[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const SESSION_STORAGE_KEY = 'f1jobradar.sessionToken';

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function authHeaders(): HeadersInit {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(data.error ?? `${fallbackMessage}: ${response.status}`);
  }
  return data;
}

export async function fetchJobs(
  filters: JobFilters = {},
  limit = 20,
  offset = 0,
): Promise<JobsResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.status}`);
  }
  return response.json() as Promise<JobsResponse>;
}

export async function fetchSources(): Promise<SourcesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sources`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sources: ${response.status}`);
  }
  return response.json() as Promise<SourcesResponse>;
}

export async function requestMagicLink(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/request-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseJsonOrThrow(response, 'Failed to request sign-in link');
}

export async function verifyMagicLink(
  token: string,
): Promise<{ sessionToken: string; email: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return parseJsonOrThrow(response, 'Failed to verify sign-in link');
}

export async function fetchMe(): Promise<{ email: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`Not signed in: ${response.status}`);
  }
  return response.json() as Promise<{ email: string }>;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', headers: authHeaders() });
  } finally {
    clearSessionToken();
  }
}

export async function fetchSavedSearches(): Promise<{ savedSearches: SavedSearch[] }> {
  const response = await fetch(`${API_BASE_URL}/api/saved-searches`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`Failed to fetch saved searches: ${response.status}`);
  }
  return response.json() as Promise<{ savedSearches: SavedSearch[] }>;
}

export interface CreateSavedSearchInput {
  name: string;
  filters: JobFilters;
  frequency: AlertFrequency;
}

export async function createSavedSearch(
  input: CreateSavedSearchInput,
): Promise<{ savedSearch: SavedSearch }> {
  const response = await fetch(`${API_BASE_URL}/api/saved-searches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(response, 'Failed to save search');
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/saved-searches/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete saved search: ${response.status}`);
  }
}
