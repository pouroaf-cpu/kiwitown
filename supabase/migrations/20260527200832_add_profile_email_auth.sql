alter table public.profiles
  add column if not exists email text not null default '';

update public.profiles p
set email = coalesce(u.email, p.email, '')
from auth.users u
where p.user_id = u.id
  and p.email = '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, phone, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (user_id) do update
  set email = excluded.email,
      phone = excluded.phone,
      name = case
        when public.profiles.name = '' then excluded.name
        else public.profiles.name
      end;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create index if not exists profiles_email_idx on public.profiles(email) where archived = false;
