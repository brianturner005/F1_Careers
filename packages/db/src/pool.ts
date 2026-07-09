import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool) return pool;
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('SQL_CONNECTION_STRING environment variable is not set');
  }
  pool = await new sql.ConnectionPool(connectionString).connect();
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
