-- create_schema_and_policies.sql

-- Ensure extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  base_chronotype text,
  created_at timestamptz default now()
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  description text not null,
  duration text,
  type text,
  recurring boolean default false,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Plans table
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  html text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table plans enable row level security;

-- Policies for profiles
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Policies for tasks
create policy "tasks_select_own" on tasks
  for select using (auth.uid() = user_id);

create policy "tasks_insert_own" on tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks_update_own" on tasks
  for update using (auth.uid() = user_id);

create policy "tasks_delete_own" on tasks
  for delete using (auth.uid() = user_id);

-- Policies for plans
create policy "plans_select_own" on plans
  for select using (auth.uid() = user_id);

create policy "plans_insert_own" on plans
  for insert with check (auth.uid() = user_id);

-- Recommended indexes for policy columns
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_plans_user_id on plans(user_id);