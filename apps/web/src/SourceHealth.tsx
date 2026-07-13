import type { Source } from '@f1-job-radar/schema';

interface SourceHealthProps {
  sources: Source[];
}

export function SourceHealth({ sources }: SourceHealthProps) {
  if (sources.length === 0) {
    return <p className="state-message">No collector runs recorded yet.</p>;
  }

  return (
    <section>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Team</th>
              <th>ATS</th>
              <th>Status</th>
              <th>Last run</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td>{source.displayName}</td>
                <td>{source.company}</td>
                <td>{source.atsPlatform}</td>
                <td>
                  <span className={`status status-${source.status}`}>{source.status}</span>
                </td>
                <td>{source.lastRunAt ? new Date(source.lastRunAt).toLocaleString() : 'never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
