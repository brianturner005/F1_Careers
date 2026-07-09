import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { pirelliCollector } from './collector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureXml = readFileSync(join(__dirname, 'fixtures', 'sample-response.xml'), 'utf-8');

describe('pirelliCollector', () => {
  it('parses a recorded Trakstar RSS fixture into RawPostings', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(fixtureXml, {
          status: 200,
          headers: { 'Content-Type': 'application/rss+xml' },
        }),
    );
    vi.stubGlobal('fetch', fetchImpl);

    const postings = await pirelliCollector.fetch();

    expect(postings).toHaveLength(2);
    expect(postings[0]).toMatchObject({
      externalId: 'https://pirelli.hire.trakstar.com/jobs/123',
      title: 'Motorsport Data Engineer',
      locationText: 'Milan, Italy',
      rawDepartment: 'Motorsport',
      applyUrl: 'https://pirelli.hire.trakstar.com/jobs/123',
      postedAt: new Date('Mon, 06 Jul 2026 00:00:00 GMT').toISOString(),
    });
    expect(postings[0]?.descriptionExcerpt).not.toMatch(/<[^>]+>/);
    expect(postings[0]?.descriptionExcerpt).toContain('tyre performance analysis');

    vi.unstubAllGlobals();
  });

  it('throws a descriptive error on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404, statusText: 'Not Found' })),
    );

    await expect(pirelliCollector.fetch()).rejects.toThrow(/404/);

    vi.unstubAllGlobals();
  });
});
