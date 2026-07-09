import type { HttpRequest } from '@azure/functions';

export async function readJsonBody(request: HttpRequest): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
