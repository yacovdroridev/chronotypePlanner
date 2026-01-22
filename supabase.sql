create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  base_chronotype text,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  desc text not null,
  duration text,
  type text,
  recurring boolean default false,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  html text not null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table tasks enable row level security;
alter table plans enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "tasks_select_own" on tasks
  for select using (auth.uid() = user_id);

create policy "tasks_insert_own" on tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks_update_own" on tasks
  for update using (auth.uid() = user_id);

create policy "tasks_delete_own" on tasks
  for delete using (auth.uid() = user_id);

create policy "plans_select_own" on plans
  for select using (auth.uid() = user_id);

create policy "plans_insert_own" on plans
  for insert with check (auth.uid() = user_id);
