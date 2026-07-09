import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { astonMartinCollector } from './collector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'sample-response.json'), 'utf-8'),
);

describe('astonMartinCollector', () => {
  it('parses a recorded Pinpoint postings.json fixture into RawPostings', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);

    const postings = await astonMartinCollector.fetch();

    expect(postings).toHaveLength(2);
    expect(postings[0]).toMatchObject({
      externalId: '53913',
      title: 'Aerodynamicist',
      locationText: 'Silverstone, England, United Kingdom',
      rawDepartment: 'Aerodynamics',
      applyUrl: 'https://astonmartinf1.pinpointhq.com/en/jobs/53913',
    });
    expect(postings[0]?.descriptionExcerpt).not.toMatch(/<[^>]+>/);
    expect(postings[0]?.descriptionExcerpt).toContain('Run CFD simulations');

    vi.unstubAllGlobals();
  });

  it('throws a descriptive error on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404, statusText: 'Not Found' })),
    );

    await expect(astonMartinCollector.fetch()).rejects.toThrow(/404/);

    vi.unstubAllGlobals();
  });
});
