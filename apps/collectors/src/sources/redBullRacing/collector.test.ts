import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { redBullRacingCollector } from './collector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'sample-response.json'), 'utf-8'),
);

describe('redBullRacingCollector', () => {
  it('parses a recorded Workday CXS fixture into RawPostings', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);

    const postings = await redBullRacingCollector.fetch();

    expect(postings).toHaveLength(3);
    expect(postings[0]).toMatchObject({
      externalId: 'R-10021',
      title: 'Senior Site Reliability Engineer',
      locationText: 'Milton Keynes, United Kingdom',
    });
    expect(postings[0]?.applyUrl).toBe(
      'https://redbulltechnology.wd3.myworkdayjobs.com/en-US/RB_Racing/job/Milton-Keynes/Senior-Site-Reliability-Engineer_R-10021',
    );
    // Only one page requested since the fixture's `total` (3) fits in the first page.
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('throws a descriptive error when Workday responds with a non-OK status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503, statusText: 'Service Unavailable' })),
    );

    await expect(redBullRacingCollector.fetch()).rejects.toThrow(/503/);

    vi.unstubAllGlobals();
  });
});
