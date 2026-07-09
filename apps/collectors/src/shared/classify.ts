import type { Category } from '@f1-job-radar/schema';

// Deterministic keyword rules per project brief §7 note: "Category mapping
// can start as keyword rules per source." Order matters — first match wins,
// most specific rules first.
const RULES: Array<{ category: Category; pattern: RegExp }> = [
  {
    category: 'Early Careers (Intern/Grad)',
    pattern: /\b(graduate|intern(ship)?|apprentice(ship)?|placement|early careers)\b/i,
  },
  { category: 'Aerodynamics', pattern: /\baero(dynamic)?s?\b/i },
  {
    category: 'Data & Performance',
    pattern:
      /\b(data (scientist|engineer|analyst)|performance engineer|analytics|machine learning|simulation)\b/i,
  },
  {
    category: 'Software & IT',
    pattern:
      /\b(software|developer|devops|sre|site reliability|cloud|it support|it technician|infrastructure engineer|cyber|network engineer)\b/i,
  },
  {
    category: 'Vehicle Design & Engineering',
    pattern:
      /\b(design engineer|vehicle dynamics|chassis|mechanical design|systems engineer|cad)\b/i,
  },
  {
    category: 'Manufacturing & Production',
    pattern: /\b(manufactur|machinist|composite|production|cnc|fabricat|laminat)\b/i,
  },
  {
    category: 'Trackside & Race Operations',
    pattern: /\b(trackside|race engineer|race operations|mechanic|pit crew|travel(l)?ing)\b/i,
  },
  { category: 'Quality & Inspection', pattern: /\b(quality|inspect|ndt|metrology)\b/i },
  {
    category: 'Logistics & Operations',
    pattern: /\b(logistics|supply chain|warehouse|freight|procurement|buyer)\b/i,
  },
  {
    category: 'Marketing, Comms & Commercial',
    pattern:
      /\b(marketing|communications?|commercial|partnership|sponsorship|brand|content creator|social media)\b/i,
  },
  {
    category: 'Finance, Legal & HR',
    pattern:
      /\b(finance|accountant|accounting|legal|counsel|human resources|\bhr\b|payroll|recruit(ment|er)?)\b/i,
  },
];

export function classify(title: string, rawDepartment: string | null): Category {
  const haystack = `${title} ${rawDepartment ?? ''}`;
  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) return rule.category;
  }
  return 'Other';
}
