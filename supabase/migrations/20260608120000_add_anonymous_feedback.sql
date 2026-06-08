-- Anonymous feedback: any signed-in user can submit a message with NO identity
-- stored (no profile_id / user_id / role); only super_admin can read. Backs the
-- wellbeing "anonymous function" linked from the daily checklist happiness widget.
create table if not exists public.anonymous_feedback (
  id uuid primary key default extensions.uuid_generate_v4(),
  message text not null check (char_length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);

alter table public.anonymous_feedback enable row level security;

-- Submit: any authenticated user. The row records only the message + time.
drop policy if exists "anon_feedback: authenticated insert" on public.anonymous_feedback;
create policy "anon_feedback: authenticated insert" on public.anonymous_feedback
  for insert to authenticated with check (true);

-- Read: super_admin only.
drop policy if exists "anon_feedback: super_admin read" on public.anonymous_feedback;
create policy "anon_feedback: super_admin read" on public.anonymous_feedback
  for select to authenticated using (private.has_role(array['super_admin']));
