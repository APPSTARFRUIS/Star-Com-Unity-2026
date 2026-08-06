-- Centre de notifications Star Com'Unity
-- Script réexécutable.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  kind text not null default 'system',
  title text not null,
  message text not null,
  link_view text,
  entity_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications select" on public.notifications;
create policy "notifications select"
  on public.notifications for select
  using (true);

drop policy if exists "notifications insert" on public.notifications;
create policy "notifications insert"
  on public.notifications for insert
  with check (true);

drop policy if exists "notifications update" on public.notifications;
create policy "notifications update"
  on public.notifications for update
  using (true)
  with check (true);

drop policy if exists "notifications delete" on public.notifications;
create policy "notifications delete"
  on public.notifications for delete
  using (true);

alter publication supabase_realtime add table public.notifications;
