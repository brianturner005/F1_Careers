import { AsyncLocalStorage } from 'node:async_hooks';
import sql from 'mssql';

// Scoped per invocation (one HTTP request, one collector run, one digest run)
// rather than cached at module scope. A cached singleton pool never closes
// between invocations, which holds an open connection to Azure SQL forever —
// and Azure SQL serverless auto-pause requires *zero* open connections for
// the full idle delay, so a single leaked connection defeats auto-pause
// entirely and bills for continuous compute instead of pausing when idle.
const poolStorage = new AsyncLocalStorage<sql.ConnectionPool>();

export async function getPool(): Promise<sql.ConnectionPool> {
  const pool = poolStorage.getStore();
  if (!pool) {
    throw new Error('getPool() called outside of withDbConnection()');
  }
  return pool;
}

// Every top-level entry point (an HTTP handler, a collector run, a digest
// run) wraps its body in this so the connection it opens is always closed
// when that unit of work finishes, letting Azure SQL auto-pause do its job.
export async function withDbConnection<T>(fn: () => Promise<T>): Promise<T> {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('SQL_CONNECTION_STRING environment variable is not set');
  }
  const pool = await new sql.ConnectionPool(connectionString).connect();
  try {
    return await poolStorage.run(pool, fn);
  } finally {
    await pool.close();
  }
}
