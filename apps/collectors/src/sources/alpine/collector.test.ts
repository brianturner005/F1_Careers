import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { alpineCollector } from './collector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'sample-response.json'), 'utf-8'),
);

describe('alpineCollector', () => {
  it('parses a recorded Workday CXS fixture into RawPostings', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);

    const postings = await alpineCollector.fetch();

    expect(postings).toHaveLength(2);
    expect(postings[1]).toMatchObject({
      externalId: 'R-30012',
      title: 'IT Support Technician',
      locationText: 'Enstone, United Kingdom',
    });
    expect(postings[0]?.applyUrl).toBe(
      'https://alliancewd.wd3.myworkdayjobs.com/en-US/alpine-racing-careers/job/Viry-Chatillon/Power-Unit-Design-Engineer_R-30011',
    );

    vi.unstubAllGlobals();
  });
});
