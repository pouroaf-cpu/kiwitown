-- daily_checks.role was missing 'office_admin', so office-admin checklist
-- submissions failed the CHECK constraint. Widen it to match check_items roles.
alter table public.daily_checks drop constraint if exists daily_checks_role_check;
alter table public.daily_checks add constraint daily_checks_role_check
  check (role = any (array['super_admin'::text, 'coo'::text, 'office_admin'::text, 'foreman'::text, 'sparky'::text]));
