-- Self-service profile fields: a display nickname and an avatar image URL
-- (stored in the existing check-photos bucket under an avatars/ prefix).
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists nickname text;
