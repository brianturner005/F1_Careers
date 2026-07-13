export function About() {
  return (
    <article>
      <h2>About Paddock Jobs</h2>
      <p>
        I&apos;m a senior SRE/cloud engineer and Navy veteran working to break into motorsport — and
        tired of manually checking a dozen different careers portals for openings. Paddock Jobs pulls
        every open role across motorsport teams into one feed, normalizes it, and can email you the
        moment something new matches what you&apos;re looking for. Formula 1 is fully covered today;
        WEC/IMSA endurance racing is next.
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
