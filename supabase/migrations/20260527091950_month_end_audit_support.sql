-- Applied remotely as migration version 20260527091950.
drop policy if exists "month_end: manager update" on public.month_end_runs;
create policy "month_end: manager update"
  on public.month_end_runs for update to authenticated
  using (private.has_role(array['coo', 'super_admin']))
  with check (private.has_role(array['coo', 'super_admin']));

drop trigger if exists audit_manager_change on public.month_end_runs;
create trigger audit_manager_change
  after insert or update on public.month_end_runs
  for each row execute function private.audit_manager_change();
