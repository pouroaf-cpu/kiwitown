-- Kiwitown Electrical — initial schema
-- Run in Supabase SQL Editor (or via supabase db push)

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------
-- profiles
-- -------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  name        text not null default '',
  phone       text not null default '',
  role        text check (role in ('admin', 'foreman', 'sparky')),
  salary      numeric(10,2) not null default 0,
  bonus_pct   numeric(5,2) not null default 0,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, phone)
  values (new.id, coalesce(new.phone, ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS
alter table profiles enable row level security;

-- Users can read their own profile
create policy "profiles: own read"
  on profiles for select
  using (auth.uid() = user_id);

-- Users can update their own profile (name only, not role/salary)
create policy "profiles: own update"
  on profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can read all profiles
create policy "profiles: admin read all"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can update any profile (for role assignment)
create policy "profiles: admin update all"
  on profiles for update
  using (
    exists (
      select 1 from profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- -------------------------------------------------------
-- weekly_submissions
-- -------------------------------------------------------
create table if not exists weekly_submissions (
  id           uuid primary key default uuid_generate_v4(),
  foreman_id   uuid references profiles(id) on delete cascade not null,
  week_number  int not null,
  year         int not null,
  checklist    jsonb not null default '{}',
  notes        jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  unique(foreman_id, week_number, year)
);

alter table weekly_submissions enable row level security;

create policy "weekly: foreman own read"
  on weekly_submissions for select
  using (foreman_id in (select id from profiles where user_id = auth.uid()));

create policy "weekly: foreman insert"
  on weekly_submissions for insert
  with check (foreman_id in (select id from profiles where user_id = auth.uid() and role = 'foreman'));

create policy "weekly: admin read all"
  on weekly_submissions for select
  using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

-- -------------------------------------------------------
-- kpi_entries
-- -------------------------------------------------------
create table if not exists kpi_entries (
  id              uuid primary key default uuid_generate_v4(),
  sparky_id       uuid references profiles(id) on delete cascade not null,
  month           int not null check (month between 1 and 12),
  year            int not null,
  charge_out      numeric(5,2) not null default 0,  -- percentage 0-100
  job_cards       int not null default 0,
  callbacks       int not null default 0,
  timesheets_days int not null default 0,
  score           numeric(5,2) not null default 0,   -- calculated 0-100
  bonus_earned    numeric(10,2) not null default 0,
  created_at      timestamptz not null default now(),
  unique(sparky_id, month, year)
);

alter table kpi_entries enable row level security;

create policy "kpi: sparky own read"
  on kpi_entries for select
  using (sparky_id in (select id from profiles where user_id = auth.uid()));

create policy "kpi: admin read all"
  on kpi_entries for select
  using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

create policy "kpi: admin insert"
  on kpi_entries for insert
  with check (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );

create policy "kpi: admin update"
  on kpi_entries for update
  using (
    exists (select 1 from profiles where user_id = auth.uid() and role = 'admin')
  );
