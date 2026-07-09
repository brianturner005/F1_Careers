-- Phase 2 schema: accounts, saved searches, and the alert digest audit log.
-- Application IDs (users.id, saved_searches.id) are crypto.randomUUID()
-- values generated in code, not IDENTITY columns.

CREATE TABLE users (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    email NVARCHAR(320) NOT NULL UNIQUE,
    created_at DATETIME2 NOT NULL
);

-- Only a SHA-256 hash of each token is stored, never the raw value, so a DB
-- read alone can't be used to sign in or hijack a session.
CREATE TABLE magic_link_tokens (
    token_hash NVARCHAR(64) NOT NULL PRIMARY KEY,
    user_id NVARCHAR(36) NOT NULL REFERENCES users(id),
    expires_at DATETIME2 NOT NULL,
    consumed_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL
);

CREATE TABLE sessions (
    token_hash NVARCHAR(64) NOT NULL PRIMARY KEY,
    user_id NVARCHAR(36) NOT NULL REFERENCES users(id),
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL
);

CREATE INDEX IX_sessions_user ON sessions(user_id);

CREATE TABLE saved_searches (
    id NVARCHAR(36) NOT NULL PRIMARY KEY,
    user_id NVARCHAR(36) NOT NULL REFERENCES users(id),
    name NVARCHAR(200) NOT NULL,
    filters NVARCHAR(MAX) NOT NULL,
    frequency NVARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL,
    last_alerted_at DATETIME2 NULL
);

CREATE INDEX IX_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IX_saved_searches_frequency ON saved_searches(frequency);

CREATE TABLE alert_log (
    id INT IDENTITY(1,1) PRIMARY KEY,
    saved_search_id NVARCHAR(36) NOT NULL REFERENCES saved_searches(id),
    sent_at DATETIME2 NOT NULL,
    job_count INT NOT NULL,
    error NVARCHAR(MAX) NULL
);

CREATE INDEX IX_alert_log_saved_search_sent ON alert_log(saved_search_id, sent_at DESC);
