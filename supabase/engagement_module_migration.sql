create table if not exists public.engagement_animations (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  description text not null default '',
  start_date timestamptz,
  end_date timestamptz,
  image_url text,
  points_cost integer not null default 0,
  reward_label text,
  reward_points integer not null default 0,
  status text not null default 'active' check (status in ('active','closed','draft')),
  created_by uuid,
  config jsonb not null default '{}'::jsonb,
  participants uuid[] not null default '{}',
  winner_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Permet d'exécuter cette migration même si l'ancienne version du module existe déjà.
alter table public.engagement_animations
  drop constraint if exists engagement_animations_type_check;

alter table public.engagement_animations
  add constraint engagement_animations_type_check
  check (type in ('countdown','raffle','contest','advent','mission','season'));

alter table public.engagement_animations enable row level security;

drop policy if exists "engagement read" on public.engagement_animations;
create policy "engagement read" on public.engagement_animations for select using (true);

drop policy if exists "engagement insert" on public.engagement_animations;
create policy "engagement insert" on public.engagement_animations for insert with check (true);

drop policy if exists "engagement update" on public.engagement_animations;
create policy "engagement update" on public.engagement_animations for update using (true) with check (true);

drop policy if exists "engagement delete" on public.engagement_animations;
create policy "engagement delete" on public.engagement_animations for delete using (true);
