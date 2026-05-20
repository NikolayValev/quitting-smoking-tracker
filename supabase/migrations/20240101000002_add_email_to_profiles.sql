alter table public.profiles add column if not exists email text;

create index if not exists idx_profiles_email on public.profiles(email);

-- Backfill email for existing users from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
and p.email is null;
