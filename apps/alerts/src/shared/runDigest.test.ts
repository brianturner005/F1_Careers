import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedSearch } from '@f1-job-radar/schema';

const {
  listSavedSearchesByFrequencyMock,
  listOpenJobsMock,
  markSavedSearchAlertedMock,
  recordAlertMock,
  getUserByIdMock,
  sendMock,
  createEmailSenderMock,
} = vi.hoisted(() => ({
  listSavedSearchesByFrequencyMock: vi.fn(),
  listOpenJobsMock: vi.fn(),
  markSavedSearchAlertedMock: vi.fn(),
  recordAlertMock: vi.fn(),
  getUserByIdMock: vi.fn(),
  sendMock: vi.fn(),
  createEmailSenderMock: vi.fn(),
}));

vi.mock('@f1-job-radar/db', () => ({
  listSavedSearchesByFrequency: listSavedSearchesByFrequencyMock,
  listOpenJobs: listOpenJobsMock,
  markSavedSearchAlerted: markSavedSearchAlertedMock,
  recordAlert: recordAlertMock,
  getUserById: getUserByIdMock,
}));

vi.mock('@f1-job-radar/email', () => ({
  createEmailSender: createEmailSenderMock,
  digestEmail: (search: SavedSearch, jobs: unknown[]) => ({
    subject: `${jobs.length} for ${search.name}`,
    text: 'body',
  }),
}));

const { runDigest } = await import('./runDigest.js');

const logger = { log: vi.fn(), error: vi.fn() };

function makeSearch(overrides: Partial<SavedSearch> = {}): SavedSearch {
  return {
    id: 's1',
    userId: 'u1',
    name: 'SRE roles',
    filters: { search: 'sre' },
    frequency: 'daily',
    createdAt: '2026-07-01T00:00:00.000Z',
    lastAlertedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  createEmailSenderMock.mockReturnValue({ send: sendMock });
  recordAlertMock.mockResolvedValue(undefined);
  markSavedSearchAlertedMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('runDigest', () => {
  it('sends an email and records the alert when new jobs match', async () => {
    createEmailSenderMock.mockReturnValue({ send: sendMock });
    listSavedSearchesByFrequencyMock.mockResolvedValue([makeSearch()]);
    listOpenJobsMock.mockResolvedValue({ jobs: [{ id: 'j1' }], total: 1 });
    getUserByIdMock.mockResolvedValue({ id: 'u1', email: 'brian@example.com', createdAt: 'x' });

    await runDigest('daily', logger, new Date('2026-07-09T12:00:00.000Z'));

    expect(listOpenJobsMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'sre', firstSeenAfter: '2026-07-01T00:00:00.000Z' }),
    );
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'brian@example.com' }));
    expect(markSavedSearchAlertedMock).toHaveBeenCalledWith('s1', 'u1', '2026-07-09T12:00:00.000Z');
    expect(recordAlertMock).toHaveBeenCalledWith({
      savedSearchId: 's1',
      sentAt: '2026-07-09T12:00:00.000Z',
      jobCount: 1,
      error: null,
    });
  });

  it('skips sending an email when there are no new matches, but still marks alerted', async () => {
    listSavedSearchesByFrequencyMock.mockResolvedValue([makeSearch()]);
    listOpenJobsMock.mockResolvedValue({ jobs: [], total: 0 });

    await runDigest('daily', logger, new Date('2026-07-09T12:00:00.000Z'));

    expect(sendMock).not.toHaveBeenCalled();
    expect(markSavedSearchAlertedMock).toHaveBeenCalled();
    expect(recordAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({ jobCount: 0, error: null }),
    );
  });

  it('skips searches that are not yet due', async () => {
    listSavedSearchesByFrequencyMock.mockResolvedValue([
      makeSearch({ lastAlertedAt: '2026-07-09T01:00:00.000Z' }),
    ]);

    await runDigest('daily', logger, new Date('2026-07-09T12:00:00.000Z'));

    expect(listOpenJobsMock).not.toHaveBeenCalled();
  });

  it('records the error and continues when a search fails', async () => {
    listSavedSearchesByFrequencyMock.mockResolvedValue([makeSearch()]);
    listOpenJobsMock.mockRejectedValue(new Error('db exploded'));

    await runDigest('daily', logger, new Date('2026-07-09T12:00:00.000Z'));

    expect(recordAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'db exploded', jobCount: 0 }),
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
