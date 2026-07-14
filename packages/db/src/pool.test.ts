import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { connectMock, closeMock, ConnectionPoolMock } = vi.hoisted(() => {
  const connectMock = vi.fn();
  const closeMock = vi.fn().mockResolvedValue(undefined);
  const ConnectionPoolMock = vi.fn().mockImplementation(() => ({
    connect: connectMock,
    close: closeMock,
  }));
  return { connectMock, closeMock, ConnectionPoolMock };
});

vi.mock('mssql', () => ({
  default: { ConnectionPool: ConnectionPoolMock },
}));

const { getPool, withDbConnection } = await import('./pool.js');

beforeEach(() => {
  process.env.SQL_CONNECTION_STRING = 'fake-connection-string';
  let poolId = 0;
  connectMock.mockImplementation(function (this: { close: typeof closeMock }) {
    poolId += 1;
    return Promise.resolve({ ...this, id: poolId });
  });
});

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.SQL_CONNECTION_STRING;
});

describe('getPool', () => {
  it('throws when called outside withDbConnection', async () => {
    await expect(getPool()).rejects.toThrow(/outside of withDbConnection/);
  });
});

describe('withDbConnection', () => {
  it('opens a pool, runs the callback, and closes the pool afterward', async () => {
    const result = await withDbConnection(async () => {
      const pool = await getPool();
      expect(pool).toBeDefined();
      expect(closeMock).not.toHaveBeenCalled();
      return 'done';
    });

    expect(result).toBe('done');
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('closes the pool even when the callback throws', async () => {
    await expect(
      withDbConnection(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('returns the same pool instance for every getPool() call within one connection scope', async () => {
    await withDbConnection(async () => {
      const first = await getPool();
      const second = await getPool();
      expect(first).toBe(second);
    });
  });

  it('gives concurrent, overlapping calls their own isolated pool instance', async () => {
    const seenPoolIds: number[] = [];

    async function unitOfWork(delayMs: number): Promise<void> {
      await withDbConnection(async () => {
        const pool = (await getPool()) as unknown as { id: number };
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        seenPoolIds.push(pool.id);
      });
    }

    // Two overlapping "invocations" running concurrently must not see each
    // other's pool — this is the exact scenario a shared module-level
    // singleton would get wrong (and did, before this fix).
    await Promise.all([unitOfWork(20), unitOfWork(0)]);

    expect(new Set(seenPoolIds).size).toBe(2);
    expect(closeMock).toHaveBeenCalledTimes(2);
  });

  it('throws if SQL_CONNECTION_STRING is not set', async () => {
    delete process.env.SQL_CONNECTION_STRING;
    await expect(withDbConnection(async () => 'unused')).rejects.toThrow(/SQL_CONNECTION_STRING/);
  });
});
