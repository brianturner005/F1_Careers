export const WORKPLACE_TYPES = ['onsite', 'hybrid', 'remote', 'unknown'] as const;
export type WorkplaceType = (typeof WORKPLACE_TYPES)[number];

export const EMPLOYMENT_TYPES = [
  'permanent',
  'contract',
  'internship',
  'graduate',
  'unknown',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const JOB_STATUSES = ['open', 'closed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

// Initial taxonomy per project brief §7. Keep additions append-only so
// historical `category` values on stored jobs stay valid.
export const CATEGORIES = [
  'Software & IT',
  'Data & Performance',
  'Vehicle Design & Engineering',
  'Aerodynamics',
  'Manufacturing & Production',
  'Trackside & Race Operations',
  'Quality & Inspection',
  'Logistics & Operations',
  'Marketing, Comms & Commercial',
  'Finance, Legal & HR',
  'Early Careers (Intern/Grad)',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];
