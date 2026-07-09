import type { EmploymentType, WorkplaceType } from '@f1-job-radar/schema';

export function guessWorkplaceType(locationText: string | null): WorkplaceType {
  if (!locationText) return 'unknown';
  if (/remote/i.test(locationText)) return 'remote';
  if (/hybrid/i.test(locationText)) return 'hybrid';
  return 'onsite';
}

export function guessEmploymentType(title: string): EmploymentType {
  if (/intern(ship)?/i.test(title)) return 'internship';
  if (/graduate|apprentice(ship)?/i.test(title)) return 'graduate';
  if (/\b(contract|fixed.?term|temporary)\b/i.test(title)) return 'contract';
  return 'unknown';
}

// Best-effort location -> ISO country code, seeded with the 11 team home
// locations. Approximate by design; refine as real location strings are observed.
const COUNTRY_HINTS: Array<{ country: string; pattern: RegExp }> = [
  {
    country: 'GB',
    pattern:
      /\b(UK|United Kingdom|England|Milton Keynes|Brackley|Woking|Silverstone|Northampton(shire)?|Banbury|Bicester|Grove|Enstone|Brixworth)\b/i,
  },
  { country: 'IT', pattern: /\b(Italy|Italia|Maranello|Faenza)\b/i },
  {
    country: 'US',
    pattern: /\b(USA|United States|Fishers|Indiana|Kannapolis|North Carolina|Charlotte)\b/i,
  },
  { country: 'CH', pattern: /\b(Switzerland|Hinwil)\b/i },
  { country: 'FR', pattern: /\b(France|Viry-Ch[aâ]tillon|Viry)\b/i },
  { country: 'DE', pattern: /\b(Germany|Neuburg|Cologne|K[oö]ln)\b/i },
];

export function guessLocationCountry(locationText: string | null): string | null {
  if (!locationText) return null;
  for (const hint of COUNTRY_HINTS) {
    if (hint.pattern.test(locationText)) return hint.country;
  }
  return null;
}

const TAG_KEYWORDS = [
  'python',
  'typescript',
  'javascript',
  'kubernetes',
  'docker',
  'azure',
  'aws',
  'gcp',
  'terraform',
  'ci/cd',
  'catia',
  'ansys',
  'cfd',
  'matlab',
  'sql',
  '.net',
  'c++',
  'react',
];

export function extractTags(title: string, description: string): string[] {
  const haystack = `${title} ${description}`.toLowerCase();
  return TAG_KEYWORDS.filter((keyword) => haystack.includes(keyword));
}
