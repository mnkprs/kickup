-- Rename TBD (Home) and TBD (Away) to just TBD (all matches at organizer's field)
UPDATE teams SET name = 'TBD', short_name = 'TBD', area = 'System'
WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE teams SET name = 'TBD', short_name = 'TBD', area = 'System2'
WHERE id = 'a0000000-0000-0000-0000-000000000002';
