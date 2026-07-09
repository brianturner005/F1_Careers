import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { mercedesAmgPetronasCollector } from './collector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'sample-response.json'), 'utf-8'),
);

describe('mercedesAmgPetronasCollector', () => {
  it('parses a recorded Workday CXS fixture into RawPostings', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 }));
    vi.stubGlobal('fetch', fetchImpl);

    const postings = await mercedesAmgPetronasCollector.fetch();

    expect(postings).toHaveLength(2);
    expect(postings[0]).toMatchObject({
      externalId: 'R-20031',
      title: 'Cloud Platform Engineer',
      locationText: 'Brackley, United Kingdom',
    });
    expect(postings[0]?.applyUrl).toBe(
      'https://mbgp.wd3.myworkdayjobs.com/en-US/Mercedes-AMGF1/job/Brackley/Cloud-Platform-Engineer_R-20031',
    );

    vi.unstubAllGlobals();
  });
});
