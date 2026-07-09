-- `jobs.source` and `collector_runs.source` both have a FOREIGN KEY into
-- `sources(id)`, so every collector's config.id needs a row here before its
-- first run — otherwise upsertJobs() fails on the FK constraint.
INSERT INTO sources (id, display_name, company, ats_platform, status) VALUES
    ('workday-red-bull-racing', 'Red Bull Racing (Workday)', 'Oracle Red Bull Racing', 'Workday', 'healthy'),
    ('workday-mercedes-amg-petronas', 'Mercedes-AMG Petronas (Workday)', 'Mercedes-AMG Petronas F1 Team', 'Workday', 'healthy'),
    ('workday-alpine', 'Alpine (Workday)', 'BWT Alpine F1 Team', 'Workday', 'healthy'),
    ('pinpoint-aston-martin', 'Aston Martin Aramco (Pinpoint)', 'Aston Martin Aramco Formula One Team', 'Pinpoint', 'healthy'),
    ('workable-cadillac', 'Cadillac F1 (Workable)', 'Cadillac Formula 1 Team', 'Workable', 'healthy');
