-- Add preferred_theme to profiles for user-controlled dark/light mode
alter table profiles
  add column if not exists preferred_theme text default 'dark'
  check (preferred_theme in ('light', 'dark'));
