import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { cadillacCollector } from './collector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'sample-response.json'), 'utf-8'),
);

describe('cadillacCollector', () => {
  it('parses a recorded Workable jobs fixture into RawPostings', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);

    const postings = await cadillacCollector.fetch();

    expect(postings).toHaveLength(2);
    expect(postings[0]).toMatchObject({
      externalId: 'CADF1001',
      title: 'Site Reliability Engineer',
      locationText: 'Fishers, Indiana, United States',
      rawDepartment: 'Information Technology',
      applyUrl: 'https://apply.workable.com/cadillacf1team/j/CADF1001/',
      postedAt: '2026-07-01T00:00:00.000Z',
    });

    vi.unstubAllGlobals();
  });

  it('throws a descriptive error on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500, statusText: 'Internal Server Error' })),
    );

    await expect(cadillacCollector.fetch()).rejects.toThrow(/500/);

    vi.unstubAllGlobals();
  });
});
