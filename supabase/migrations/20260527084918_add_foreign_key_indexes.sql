-- Applied remotely as migration version 20260527084918.
create index if not exists audit_log_user_idx on public.audit_log(user_id);
create index if not exists kpi_entries_entered_by_idx on public.kpi_entries(entered_by);
create index if not exists kpi_targets_sparky_idx on public.kpi_targets(sparky_id);
create index if not exists month_end_closed_by_idx on public.month_end_runs(closed_by);
create index if not exists recycle_bin_deleted_by_idx on public.recycle_bin(deleted_by);
