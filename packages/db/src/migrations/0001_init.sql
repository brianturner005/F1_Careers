-- Phase 0 schema: sources, jobs, collector_runs.
-- Applied by hand for now; a migration runner can be introduced once there's
-- more than one migration file to sequence.

CREATE TABLE sources (
    id NVARCHAR(100) NOT NULL PRIMARY KEY,
    display_name NVARCHAR(200) NOT NULL,
    company NVARCHAR(200) NOT NULL,
    ats_platform NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'healthy',
    last_run_at DATETIME2 NULL
);

CREATE TABLE jobs (
    id NVARCHAR(24) NOT NULL PRIMARY KEY,
    source NVARCHAR(100) NOT NULL REFERENCES sources(id),
    external_id NVARCHAR(200) NOT NULL,
    company NVARCHAR(200) NOT NULL,
    title NVARCHAR(500) NOT NULL,
    category NVARCHAR(100) NOT NULL,
    raw_department NVARCHAR(200) NULL,
    location_text NVARCHAR(300) NULL,
    location_country NCHAR(2) NULL,
    workplace_type NVARCHAR(20) NOT NULL,
    employment_type NVARCHAR(20) NOT NULL,
    description_excerpt NVARCHAR(500) NOT NULL,
    apply_url NVARCHAR(1000) NOT NULL,
    posted_at DATETIME2 NULL,
    first_seen_at DATETIME2 NOT NULL,
    last_seen_at DATETIME2 NOT NULL,
    status NVARCHAR(10) NOT NULL,
    tags NVARCHAR(500) NOT NULL DEFAULT '[]'
);

CREATE INDEX IX_jobs_status_last_seen ON jobs(status, last_seen_at DESC);
CREATE INDEX IX_jobs_source ON jobs(source);

CREATE TABLE collector_runs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    source NVARCHAR(100) NOT NULL REFERENCES sources(id),
    started_at DATETIME2 NOT NULL,
    finished_at DATETIME2 NOT NULL,
    postings_found INT NOT NULL,
    postings_new INT NOT NULL,
    postings_closed INT NOT NULL,
    error NVARCHAR(MAX) NULL
);

CREATE INDEX IX_collector_runs_source_finished ON collector_runs(source, finished_at DESC);
