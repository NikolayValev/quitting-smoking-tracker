-- Create profiles table that references auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create quit_attempts table to track smoking cessation attempts
create table if not exists public.quit_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quit_date timestamp with time zone not null,
  reason text,
  cigarettes_per_day integer,
  cost_per_pack decimal(10,2),
  cigarettes_per_pack integer default 20,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create milestones table to track achievements
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  quit_attempt_id uuid not null references public.quit_attempts(id) on delete cascade,
  milestone_type text not null, -- '1_hour', '1_day', '1_week', '1_month', '1_year'
  achieved_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.quit_attempts enable row level security;
alter table public.milestones enable row level security;

-- RLS Policies for profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- RLS Policies for quit_attempts
create policy "quit_attempts_select_own"
  on public.quit_attempts for select
  using (auth.uid() = user_id);

create policy "quit_attempts_insert_own"
  on public.quit_attempts for insert
  with check (auth.uid() = user_id);

create policy "quit_attempts_update_own"
  on public.quit_attempts for update
  using (auth.uid() = user_id);

create policy "quit_attempts_delete_own"
  on public.quit_attempts for delete
  using (auth.uid() = user_id);

-- RLS Policies for milestones
create policy "milestones_select_own"
  on public.milestones for select
  using (
    exists (
      select 1 from public.quit_attempts
      where quit_attempts.id = milestones.quit_attempt_id
      and quit_attempts.user_id = auth.uid()
    )
  );

create policy "milestones_insert_own"
  on public.milestones for insert
  with check (
    exists (
      select 1 from public.quit_attempts
      where quit_attempts.id = milestones.quit_attempt_id
      and quit_attempts.user_id = auth.uid()
    )
  );

create policy "milestones_delete_own"
  on public.milestones for delete
  using (
    exists (
      select 1 from public.quit_attempts
      where quit_attempts.id = milestones.quit_attempt_id
      and quit_attempts.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
create index if not exists idx_quit_attempts_user_id on public.quit_attempts(user_id);
create index if not exists idx_quit_attempts_is_active on public.quit_attempts(is_active);
create index if not exists idx_milestones_quit_attempt_id on public.milestones(quit_attempt_id);
