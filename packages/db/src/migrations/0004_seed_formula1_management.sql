-- Phase 3 addition: Formula One Management (FOM) corporate roles, same
-- Workday ATS already used by three team sources — see 0002_seed_sources.sql.
INSERT INTO sources (id, display_name, company, ats_platform, status) VALUES
    ('workday-formula1-management', 'Formula One Management (Workday)', 'Formula One Management', 'Workday', 'healthy');
