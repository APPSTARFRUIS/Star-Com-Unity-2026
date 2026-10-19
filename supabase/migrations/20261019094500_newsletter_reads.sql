-- V1.6.24 — suivi agrégé des ouvertures de newsletters
create table if not exists public.newsletter_reads (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references public.newsletters(id) on delete cascade,
  user_id uuid not null,
  first_opened_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  open_count integer not null default 1 check (open_count >= 1),
  unique (newsletter_id, user_id)
);

create index if not exists newsletter_reads_newsletter_idx on public.newsletter_reads(newsletter_id);
create index if not exists newsletter_reads_user_idx on public.newsletter_reads(user_id);
create index if not exists newsletter_reads_last_opened_idx on public.newsletter_reads(last_opened_at desc);

alter table public.newsletter_reads enable row level security;

drop policy if exists newsletter_reads_insert_own on public.newsletter_reads;
create policy newsletter_reads_insert_own on public.newsletter_reads
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists newsletter_reads_update_own on public.newsletter_reads;
create policy newsletter_reads_update_own on public.newsletter_reads
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists newsletter_reads_select_authenticated on public.newsletter_reads;
create policy newsletter_reads_select_authenticated on public.newsletter_reads
for select to authenticated using (true);

grant select, insert, update on public.newsletter_reads to authenticated;
