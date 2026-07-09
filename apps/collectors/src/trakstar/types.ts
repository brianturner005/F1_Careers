// Trakstar Hire has no public JSON jobs API (/api/jobs and /api/jobs/{id}
// return 404 for unauthenticated requests) — the only public option is an
// RSS/XML feed at https://{subdomain}.hire.trakstar.com/jobfeeds/{CompanyName},
// using a custom `job:` XML namespace (https://recruiterbox.com/rss/job/)
// for location/team/type. Field names here are inferred from third-party
// documentation of that namespace, NOT captured from a live feed — this
// environment's egress policy blocks *.hire.trakstar.com. Verify against a
// live feed before production use, same caveat as every other ATS client
// in this repo.
export interface TrakstarFeedItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  guid?: string | { '#text': string };
  'job:location'?: string;
  'job:team'?: string;
  'job:type'?: string;
}

export interface TrakstarFeed {
  rss?: {
    channel?: {
      item?: TrakstarFeedItem | TrakstarFeedItem[];
    };
  };
}
