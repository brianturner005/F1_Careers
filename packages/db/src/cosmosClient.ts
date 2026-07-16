import { CosmosClient, type Container } from '@azure/cosmos';

// Unlike the SQL connection pool this replaces, a single CosmosClient is
// meant to be created once and reused indefinitely -- Cosmos DB bills per
// request unit consumed, not per connection held open, so there's no
// auto-pause/leaked-connection cost risk to guard against here.
let client: CosmosClient | null = null;

function getClient(): CosmosClient {
  if (client) return client;
  const connectionString = process.env.COSMOS_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('COSMOS_CONNECTION_STRING environment variable is not set');
  }
  client = new CosmosClient(connectionString);
  return client;
}

export type ContainerName =
  | 'jobs'
  | 'sources'
  | 'collectorRuns'
  | 'users'
  | 'magicLinkTokens'
  | 'sessions'
  | 'savedSearches'
  | 'alertLog';

export function getContainer(name: ContainerName): Container {
  const databaseName = process.env.COSMOS_DATABASE_NAME;
  if (!databaseName) {
    throw new Error('COSMOS_DATABASE_NAME environment variable is not set');
  }
  return getClient().database(databaseName).container(name);
}

function statusCodeOf(err: unknown): number | undefined {
  return typeof err === 'object' && err !== null && 'code' in err
    ? ((err as { code: unknown }).code as number | undefined)
    : undefined;
}

export function isCosmosNotFound(err: unknown): boolean {
  return statusCodeOf(err) === 404;
}

export function isCosmosConflict(err: unknown): boolean {
  return statusCodeOf(err) === 409;
}
