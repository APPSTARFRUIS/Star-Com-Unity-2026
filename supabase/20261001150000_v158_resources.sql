-- Star Com'Unity V1.5.8 — Ressources & Jeux
create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  content text not null default '',
  category text not null default 'Général',
  media_type text not null default 'text' check (media_type in ('text','document','video','image','link')),
  resource_url text,
  thumbnail_url text,
  audience_companies text[] not null default array['ALL']::text[],
  published boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  related_game_ids uuid[] not null default '{}'::uuid[]
);

alter table public.learning_resources enable row level security;

drop policy if exists "learning_resources_read_authenticated" on public.learning_resources;
create policy "learning_resources_read_authenticated" on public.learning_resources
for select to authenticated using (true);

drop policy if exists "learning_resources_admin_insert" on public.learning_resources;
create policy "learning_resources_admin_insert" on public.learning_resources
for insert to authenticated with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN','MODERATEUR'))
);

drop policy if exists "learning_resources_admin_update" on public.learning_resources;
create policy "learning_resources_admin_update" on public.learning_resources
for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN','MODERATEUR'))
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN','MODERATEUR'))
);

drop policy if exists "learning_resources_admin_delete" on public.learning_resources;
create policy "learning_resources_admin_delete" on public.learning_resources
for delete to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ADMIN','MODERATEUR'))
);

create index if not exists learning_resources_published_sort_idx on public.learning_resources (published, sort_order, created_at desc);
