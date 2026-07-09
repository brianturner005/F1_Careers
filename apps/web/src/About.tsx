export function About() {
  return (
    <article>
      <h2>About F1 Job Radar</h2>
      <p>
        I&apos;m a senior SRE/cloud engineer and Navy veteran working to break into Formula 1 — and
        tired of manually checking eleven different careers portals for openings. F1 Job Radar pulls
        every open role across F1 teams into one feed, normalizes it, and can email you the moment
        something new matches what you&apos;re looking for.
      </p>
      <p>
        It&apos;s also a live demonstration of the cloud architecture, data engineering, and product
        instincts I&apos;d bring to a technology role in the paddock: collectors built as pluggable
        modules per data source, a normalized schema, collector health monitoring, and this feed and
        alerting layer on top — all running on Azure.
      </p>
      <p>
        We never take applications through this site — every listing links to the team&apos;s own
        official posting.
      </p>
    </article>
  );
}
