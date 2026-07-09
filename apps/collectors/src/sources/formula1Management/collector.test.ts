import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { formula1ManagementCollector } from './collector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'sample-response.json'), 'utf-8'),
);

describe('formula1ManagementCollector', () => {
  it('parses a recorded Workday CXS fixture into RawPostings', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);

    const postings = await formula1ManagementCollector.fetch();

    expect(postings).toHaveLength(2);
    expect(postings[1]).toMatchObject({
      externalId: 'R-40012',
      title: 'Commercial Rights Analyst',
      locationText: 'London, United Kingdom',
    });
    expect(postings[0]?.applyUrl).toBe(
      'https://formulaone.wd3.myworkdayjobs.com/en-US/F1/job/Biggin-Hill/Broadcast-Systems-Engineer_R-40011',
    );

    vi.unstubAllGlobals();
  });
});
