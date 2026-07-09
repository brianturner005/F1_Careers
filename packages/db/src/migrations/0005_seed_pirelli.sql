-- Phase 3 addition: Pirelli (motorsport tyre supplier), a new ATS type
-- (Trakstar Hire, via its public RSS job feed) — see docs/sources.md.
INSERT INTO sources (id, display_name, company, ats_platform, status) VALUES
    ('trakstar-pirelli', 'Pirelli (Trakstar)', 'Pirelli', 'Trakstar', 'healthy');
