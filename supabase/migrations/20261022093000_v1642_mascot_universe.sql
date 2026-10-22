-- V1.6.42 — Univers de Ma Poire : humeurs, saisons et surprises administrables
create table if not exists public.mascot_experiences (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 mood text not null default 'happy' check (mood in ('idle','happy','celebrate','outfit','tap','sleepy','proud','curious')),
 message text,
 item_id uuid references public.mascot_items(id) on delete set null,
 starts_at timestamptz,
 ends_at timestamptz,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.mascot_experiences enable row level security;
revoke all on table public.mascot_experiences from anon;
grant select,insert,update,delete on table public.mascot_experiences to authenticated;
drop policy if exists mascot_experiences_read on public.mascot_experiences;
create policy mascot_experiences_read on public.mascot_experiences for select to authenticated using(active=true or public.is_content_moderator());
drop policy if exists mascot_experiences_admin on public.mascot_experiences;
create policy mascot_experiences_admin on public.mascot_experiences for all to authenticated using(public.is_content_moderator()) with check(public.is_content_moderator());
