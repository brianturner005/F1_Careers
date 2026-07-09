// Shapes for Pinpoint's public `postings.json` job feed. Documented from
// Pinpoint's own developer docs (see docs/sources.md) — NOT captured from a
// live response, since this environment's egress policy blocks
// *.pinpointhq.com. In particular, whether the top-level response is a bare
// array (assumed here) or wrapped in an object, and the exact posted-date
// field name, are both unconfirmed. Verify against a live response before
// production use.
export interface PinpointLocation {
  city?: string;
  region?: string;
  country?: string;
}

export interface PinpointDepartment {
  id?: string;
  name?: string;
}

export interface PinpointPosting {
  id: string | number;
  title: string;
  url: string;
  department?: PinpointDepartment;
  location?: PinpointLocation;
  description?: string;
  key_responsibilities?: string;
  skills_knowledge_expertise?: string;
  benefits?: string;
}

export type PinpointPostingsResponse = PinpointPosting[];
