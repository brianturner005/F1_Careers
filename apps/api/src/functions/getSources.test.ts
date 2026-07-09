import { describe, expect, it, vi } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const { listSourcesMock } = vi.hoisted(() => ({ listSourcesMock: vi.fn() }));
vi.mock('@f1-job-radar/db', () => ({ listSources: listSourcesMock }));

const { getSources } = await import('./getSources.js');

const request = {} as unknown as HttpRequest;
const context = { error: vi.fn(), log: vi.fn() } as unknown as InvocationContext;

describe('getSources', () => {
  it('returns the source list', async () => {
    const sources = [
      {
        id: 'workday-red-bull-racing',
        displayName: 'Red Bull Racing (Workday)',
        company: 'Oracle Red Bull Racing',
        atsPlatform: 'Workday',
        status: 'healthy',
        lastRunAt: '2026-07-09T00:00:00.000Z',
      },
    ];
    listSourcesMock.mockResolvedValue(sources);

    const response = await getSources(request, context);

    expect(response.status).toBe(200);
    expect(response.jsonBody).toEqual({ sources });
  });

  it('returns 500 when the DB call fails', async () => {
    listSourcesMock.mockRejectedValue(new Error('boom'));

    const response = await getSources(request, context);

    expect(response.status).toBe(500);
  });
});
