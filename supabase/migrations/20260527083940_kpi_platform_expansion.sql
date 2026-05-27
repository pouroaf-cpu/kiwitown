-- Kiwitown KPI platform expansion: additive migration preserving existing test rows.
-- Applied remotely as migration version 20260527083940.

create extension if not exists "uuid-ossp";

alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'coo' where role = 'admin';
alter table public.profiles
  add column if not exists active boolean not null default true,
  add column if not exists archived boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'coo', 'foreman', 'sparky'));

alter table public.weekly_submissions
  add column if not exists archived boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.kpi_entries
  add column if not exists archived boolean not null default false,
  add column if not exists source text not null default 'manual',
  add column if not exists external_reference text,
  add column if not exists entered_by uuid references public.profiles(id),
  add column if not exists month_closed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();
alter table public.kpi_entries drop constraint if exists kpi_entries_source_check;
alter table public.kpi_entries
  add constraint kpi_entries_source_check check (source in ('manual', 'servicem8'));

create table if not exists public.kpi_targets (
  id uuid primary key default uuid_generate_v4(),
  sparky_id uuid references public.profiles(id),
  target_type text not null check (target_type in ('charge_out', 'job_cards', 'callbacks', 'timesheets_days')),
  value numeric(10,2) not null check (value >= 0),
  effective_from date not null,
  effective_to date,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create table if not exists public.checklist_items (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  category text not null,
  colour text not null default '#00AEEF',
  order_index int not null default 0,
  active boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recycle_bin (
  id uuid primary key default uuid_generate_v4(),
  table_name text not null,
  record_id uuid not null,
  record_data jsonb not null,
  deleted_by uuid references auth.users(id),
  deleted_at timestamptz not null default now(),
  permanent_delete_at timestamptz not null default (now() + interval '30 days'),
  restored_at timestamptz
);

create table if not exists public.system_settings (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null default 'Kiwitown Electrical',
  logo_url text,
  brand_colour text not null default '#00AEEF',
  default_bonus_pct numeric(5,2) not null default 0,
  archived boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.month_end_runs (
  id uuid primary key default uuid_generate_v4(),
  month int not null check (month between 1 and 12),
  year int not null,
  closed_by uuid references auth.users(id) not null,
  closed_at timestamptz not null default now(),
  summary jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  unique (month, year)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  subscription jsonb not null,
  active boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.notification_jobs (
  id uuid primary key default uuid_generate_v4(),
  notification_type text not null check (notification_type in ('daily_kpi', 'weekly_summary', 'midmonth_alert')),
  scheduled_for timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.system_settings (business_name, brand_colour)
select 'Kiwitown Electrical', '#00AEEF'
where not exists (select 1 from public.system_settings where archived = false);

insert into public.checklist_items (label, category, colour, order_index)
select seed.label, seed.category, seed.colour, seed.order_index
from (values
  ('Pre-starts completed', 'Operations', '#00AEEF', 10),
  ('Weekly operations meeting completed', 'Operations', '#00AEEF', 20),
  ('Labour utilisation reviewed', 'Operations', '#00AEEF', 30),
  ('Rework logged', 'Quality', '#2ECC71', 40),
  ('Jobs over budget flagged', 'Finance', '#F5A623', 50),
  ('Variations approved before work', 'Finance', '#F5A623', 60),
  ('Back costing completed on time', 'Finance', '#F5A623', 70),
  ('H&S or QA issues reported', 'Safety', '#F5821F', 80),
  ('Staff coaching completed', 'People', '#A78BFA', 90),
  ('Key risks escalated', 'Safety', '#F5821F', 100)
) as seed(label, category, colour, order_index)
where not exists (select 1 from public.checklist_items);

insert into public.kpi_targets (target_type, value, effective_from)
select seed.target_type, seed.value, current_date
from (values
  ('charge_out', 85::numeric),
  ('job_cards', 20::numeric),
  ('callbacks', 2::numeric),
  ('timesheets_days', 10::numeric)
) as seed(target_type, value)
where not exists (select 1 from public.kpi_targets);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.has_role(allowed_roles text[])
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role = any(allowed_roles)
      and p.active = true
      and p.archived = false
  );
$$;
revoke all on function private.has_role(text[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_role(text[]) to authenticated;

create or replace function public.get_team_score(p_month int, p_year int)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.active = true and p.archived = false
  ) then
    raise exception 'Unauthorized';
  end if;
  return (
    select coalesce(round(avg(e.score), 2), 0)
    from public.kpi_entries e
    join public.profiles p on p.id = e.sparky_id
    where e.month = p_month and e.year = p_year and e.archived = false
      and p.role = 'sparky' and p.archived = false
  );
end;
$$;
revoke all on function public.get_team_score(int, int) from public, anon;
grant execute on function public.get_team_score(int, int) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, phone)
  values (new.id, coalesce(new.phone, ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function private.track_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.audit_manager_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  record_uuid uuid;
begin
  if actor is null then
    return coalesce(new, old);
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.user_id = actor and p.role in ('coo', 'super_admin')
      and p.active = true and p.archived = false
  ) then
    return coalesce(new, old);
  end if;
  record_uuid := case when tg_op = 'DELETE' then old.id else new.id end;
  insert into public.audit_log (user_id, action, table_name, record_id, old_value, new_value)
  values (
    actor,
    lower(tg_op),
    tg_table_name,
    record_uuid,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create or replace function private.capture_archive()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.archived = true and old.archived = false then
    insert into public.recycle_bin (table_name, record_id, record_data, deleted_by)
    values (tg_table_name, new.id, to_jsonb(new), (select auth.uid()));
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'weekly_submissions', 'kpi_entries', 'kpi_targets',
    'checklist_items', 'system_settings', 'push_subscriptions'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function private.track_updated_at()',
      table_name
    );
  end loop;
  foreach table_name in array array[
    'profiles', 'weekly_submissions', 'kpi_entries', 'kpi_targets',
    'checklist_items', 'system_settings'
  ] loop
    execute format('drop trigger if exists audit_manager_change on public.%I', table_name);
    execute format(
      'create trigger audit_manager_change after insert or update on public.%I for each row execute function private.audit_manager_change()',
      table_name
    );
    execute format('drop trigger if exists capture_archive on public.%I', table_name);
    execute format(
      'create trigger capture_archive after update on public.%I for each row execute function private.capture_archive()',
      table_name
    );
  end loop;
end $$;

alter table public.kpi_targets enable row level security;
alter table public.checklist_items enable row level security;
alter table public.audit_log enable row level security;
alter table public.recycle_bin enable row level security;
alter table public.system_settings enable row level security;
alter table public.month_end_runs enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_jobs enable row level security;

drop policy if exists "profiles: own read" on public.profiles;
drop policy if exists "profiles: own update" on public.profiles;
drop policy if exists "profiles: admin read all" on public.profiles;
drop policy if exists "profiles: admin update all" on public.profiles;
drop policy if exists "profiles: role read" on public.profiles;
drop policy if exists "profiles: manager update" on public.profiles;
drop function if exists public.admin_get_profiles();
drop function if exists public.is_admin();
create policy "profiles: role read" on public.profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or private.has_role(array['coo', 'super_admin'])
  or (role = 'sparky' and private.has_role(array['foreman']))
);
create policy "profiles: manager update" on public.profiles for update to authenticated
using (private.has_role(array['coo', 'super_admin']))
with check (private.has_role(array['coo', 'super_admin']));

drop policy if exists "weekly: foreman own read" on public.weekly_submissions;
drop policy if exists "weekly: foreman insert" on public.weekly_submissions;
drop policy if exists "weekly: foreman update" on public.weekly_submissions;
drop policy if exists "weekly: admin read all" on public.weekly_submissions;
drop policy if exists "weekly: admin insert" on public.weekly_submissions;
drop policy if exists "weekly: admin update" on public.weekly_submissions;
create policy "weekly: allowed read" on public.weekly_submissions for select to authenticated
using (
  foreman_id in (select id from public.profiles where user_id = (select auth.uid()))
  or private.has_role(array['coo', 'super_admin'])
);
create policy "weekly: foreman write" on public.weekly_submissions for insert to authenticated
with check (
  foreman_id in (
    select id from public.profiles
    where user_id = (select auth.uid()) and role = 'foreman' and archived = false
  )
);
create policy "weekly: foreman revise" on public.weekly_submissions for update to authenticated
using (
  foreman_id in (
    select id from public.profiles
    where user_id = (select auth.uid()) and role = 'foreman' and archived = false
  )
)
with check (
  foreman_id in (
    select id from public.profiles
    where user_id = (select auth.uid()) and role = 'foreman' and archived = false
  )
);

drop policy if exists "kpi: sparky own read" on public.kpi_entries;
drop policy if exists "kpi: admin read all" on public.kpi_entries;
drop policy if exists "kpi: admin insert" on public.kpi_entries;
drop policy if exists "kpi: admin update" on public.kpi_entries;
create policy "kpi: permitted read" on public.kpi_entries for select to authenticated
using (
  sparky_id in (select id from public.profiles where user_id = (select auth.uid()))
  or private.has_role(array['foreman', 'coo', 'super_admin'])
);
create policy "kpi: manager insert" on public.kpi_entries for insert to authenticated
with check (private.has_role(array['coo', 'super_admin']));
create policy "kpi: manager update" on public.kpi_entries for update to authenticated
using (private.has_role(array['coo', 'super_admin']))
with check (private.has_role(array['coo', 'super_admin']));

create policy "targets: authenticated read" on public.kpi_targets for select to authenticated
using (archived = false);
create policy "targets: manager insert" on public.kpi_targets for insert to authenticated
with check (private.has_role(array['coo', 'super_admin']));
create policy "targets: manager update" on public.kpi_targets for update to authenticated
using (private.has_role(array['coo', 'super_admin']))
with check (private.has_role(array['coo', 'super_admin']));

create policy "checklist: authenticated read" on public.checklist_items for select to authenticated
using (archived = false);
create policy "checklist: manager insert" on public.checklist_items for insert to authenticated
with check (private.has_role(array['coo', 'super_admin']));
create policy "checklist: manager update" on public.checklist_items for update to authenticated
using (private.has_role(array['coo', 'super_admin']))
with check (private.has_role(array['coo', 'super_admin']));

create policy "audit: manager read" on public.audit_log for select to authenticated
using (private.has_role(array['coo', 'super_admin']));
create policy "recycle: manager read" on public.recycle_bin for select to authenticated
using (private.has_role(array['coo', 'super_admin']));
create policy "settings: authenticated read" on public.system_settings for select to authenticated
using (archived = false);
create policy "settings: owner update" on public.system_settings for update to authenticated
using (private.has_role(array['super_admin']))
with check (private.has_role(array['super_admin']));
create policy "month_end: manager read" on public.month_end_runs for select to authenticated
using (private.has_role(array['coo', 'super_admin']));
create policy "month_end: manager insert" on public.month_end_runs for insert to authenticated
with check (private.has_role(array['coo', 'super_admin']));
create policy "push: own read" on public.push_subscriptions for select to authenticated
using (user_id = (select auth.uid()));
create policy "push: own insert" on public.push_subscriptions for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "push: own update" on public.push_subscriptions for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "notifications: manager read" on public.notification_jobs for select to authenticated
using (private.has_role(array['coo', 'super_admin']));

grant select, insert, update on public.profiles, public.weekly_submissions, public.kpi_entries,
  public.kpi_targets, public.checklist_items, public.system_settings, public.month_end_runs,
  public.push_subscriptions to authenticated;
grant select on public.audit_log, public.recycle_bin, public.notification_jobs to authenticated;
revoke delete on public.profiles, public.weekly_submissions, public.kpi_entries, public.kpi_targets,
  public.checklist_items, public.system_settings, public.month_end_runs, public.push_subscriptions,
  public.audit_log, public.recycle_bin, public.notification_jobs from authenticated;

create index if not exists profiles_role_active_idx on public.profiles(role) where archived = false and active = true;
create index if not exists kpi_entries_month_idx on public.kpi_entries(year, month) where archived = false;
create index if not exists kpi_targets_current_idx on public.kpi_targets(target_type, sparky_id, effective_from) where archived = false;
create index if not exists checklist_items_order_idx on public.checklist_items(order_index) where active = true and archived = false;
create index if not exists audit_log_recent_idx on public.audit_log(created_at desc);
