import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withDbConnection } from '@f1-job-radar/db';

type HttpHandler = (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>;

// Every HTTP function that touches the DB wraps its handler in this so the
// connection it opens is always closed at the end of the request — see
// packages/db/src/pool.ts for why that matters (a leaked connection defeats
// Azure SQL serverless auto-pause and bills for continuous compute).
export function withDb(handler: HttpHandler): HttpHandler {
  return (request, context) => withDbConnection(() => handler(request, context));
}
