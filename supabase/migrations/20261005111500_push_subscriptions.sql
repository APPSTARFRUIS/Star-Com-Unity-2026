-- Star Com'Unity — abonnements Web Push
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push subscriptions own select" on public.push_subscriptions;
create policy "push subscriptions own select" on public.push_subscriptions for select using (auth.uid()::text = user_id);
drop policy if exists "push subscriptions own insert" on public.push_subscriptions;
create policy "push subscriptions own insert" on public.push_subscriptions for insert with check (auth.uid()::text = user_id);
drop policy if exists "push subscriptions own update" on public.push_subscriptions;
create policy "push subscriptions own update" on public.push_subscriptions for update using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
drop policy if exists "push subscriptions own delete" on public.push_subscriptions;
create policy "push subscriptions own delete" on public.push_subscriptions for delete using (auth.uid()::text = user_id);
