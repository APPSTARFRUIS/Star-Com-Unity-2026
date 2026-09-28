-- PlanEat - Supabase foundation
-- Run once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

-- User-facing profile. Authentication remains in auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  guests integer not null default 2 check (guests > 0),
  weekly_budget numeric(10,2) not null default 60 check (weekly_budget >= 0),
  budget_level text not null default 'eco',
  preferences jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text,
  quantity numeric(12,3) not null default 0,
  unit text,
  category text,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  plan jsonb not null default '[]'::jsonb,
  estimated_cost numeric(10,2),
  budget_target numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  items jsonb not null default '{}'::jsonb,
  estimated_total numeric(10,2),
  actual_total numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date,
  store_name text,
  total_amount numeric(10,2),
  extracted_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- The recipe catalogue can later move from the current bundled constants into Supabase.
create table if not exists public.recipes (
  id text primary key,
  data jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security: every private row belongs to the authenticated user.
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.pantry_items enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.receipts enable row level security;
alter table public.recipes enable row level security;

do $$ begin
  create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "settings_own" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "pantry_own" on public.pantry_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "weekly_plans_own" on public.weekly_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "shopping_lists_own" on public.shopping_lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "receipts_own" on public.receipts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Recipe catalogue is readable by authenticated users; writes remain server/admin only.
do $$ begin
  create policy "recipes_read_authenticated" on public.recipes for select to authenticated using (is_active = true);
exception when duplicate_object then null; end $$;

-- Automatically create a lightweight profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
