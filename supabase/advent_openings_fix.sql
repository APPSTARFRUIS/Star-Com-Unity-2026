
-- Correctif réexécutable : calendrier de l'Avent
-- À exécuter après advent_openings_migration.sql ou seul sur une nouvelle base.

create table if not exists public.advent_openings (
  id uuid primary key default gen_random_uuid(),
  animation_id uuid not null references public.engagement_animations(id) on delete cascade,
  user_id text not null,
  day_number integer not null check (day_number between 1 and 24),
  outcome jsonb not null default '{}'::jsonb,
  points_awarded integer not null default 0,
  opened_at timestamptz not null default now()
);

-- Les profils Star Com'Unity utilisent des identifiants texte.
alter table public.advent_openings
  alter column user_id type text using user_id::text;

alter table public.advent_openings
  drop constraint if exists advent_openings_unique_user_day;

alter table public.advent_openings
  add constraint advent_openings_unique_user_day
  unique (animation_id, user_id, day_number);

create index if not exists idx_advent_openings_user
  on public.advent_openings(user_id, opened_at desc);

create index if not exists idx_advent_openings_animation
  on public.advent_openings(animation_id, day_number);

alter table public.advent_openings enable row level security;

drop policy if exists "advent openings read" on public.advent_openings;
create policy "advent openings read"
  on public.advent_openings for select using (true);

drop policy if exists "advent openings insert" on public.advent_openings;
create policy "advent openings insert"
  on public.advent_openings for insert with check (true);

drop function if exists public.open_advent_day(uuid, uuid, integer, text);
drop function if exists public.open_advent_day(uuid, text, integer, text);

create or replace function public.open_advent_day(
  p_animation_id uuid,
  p_user_id text,
  p_day_number integer,
  p_answer text default null
)
returns table (
  opening_id uuid,
  outcome jsonb,
  points_awarded integer,
  opened_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_animation public.engagement_animations%rowtype;
  v_day jsonb;
  v_opening_id uuid;
  v_opened_at timestamptz;
  v_type text;
  v_expected text;
  v_received text;
  v_is_correct boolean := true;
  v_instant_win boolean := false;
  v_reward integer := 0;
  v_probability numeric := 0;
  v_outcome jsonb := '{}'::jsonb;
begin
  if p_day_number < 1 or p_day_number > 24 then
    raise exception 'Numéro de case invalide.';
  end if;

  select * into v_animation
  from public.engagement_animations
  where id = p_animation_id and type = 'advent'
  limit 1;

  if not found then
    raise exception 'Calendrier introuvable.';
  end if;

  select day_value into v_day
  from jsonb_array_elements(coalesce(v_animation.config->'days', '[]'::jsonb)) as day_value
  where (day_value->>'day')::integer = p_day_number
  limit 1;

  if v_day is null then
    raise exception 'Case introuvable.';
  end if;

  insert into public.advent_openings(animation_id, user_id, day_number)
  values (p_animation_id, p_user_id, p_day_number)
  on conflict (animation_id, user_id, day_number) do nothing
  returning id, advent_openings.opened_at
  into v_opening_id, v_opened_at;

  if v_opening_id is null then
    raise exception 'Cette case a déjà été ouverte.' using errcode = '23505';
  end if;

  v_type := coalesce(v_day->>'type', 'gift');
  v_expected := lower(trim(coalesce(v_day->>'correctAnswer', '')));
  v_received := lower(trim(coalesce(p_answer, '')));

  if v_type in ('quiz', 'mystery') then
    v_is_correct := v_expected <> '' and v_expected = v_received;
    if v_is_correct then
      v_reward := greatest(coalesce((v_day->>'rewardPoints')::integer, 0), 0);
    end if;
    v_outcome := jsonb_build_object(
      'isCorrect', v_is_correct,
      'answer', coalesce(p_answer, '')
    );
  elsif v_type = 'instant' then
    v_probability := least(
      greatest(coalesce((v_day->>'winProbability')::numeric, 0), 0),
      100
    );
    v_instant_win := random() * 100 < v_probability;
    if v_instant_win then
      v_reward := greatest(coalesce((v_day->>'rewardPoints')::integer, 0), 0);
    end if;
    v_outcome := jsonb_build_object('instantWin', v_instant_win);
  else
    v_reward := greatest(coalesce((v_day->>'rewardPoints')::integer, 0), 0);
    v_outcome := jsonb_build_object('opened', true);
  end if;

  update public.advent_openings
  set outcome = v_outcome,
      points_awarded = v_reward
  where id = v_opening_id;

  if v_reward > 0 then
    update public.profiles
    set points = coalesce(points, 0) + v_reward
    where id::text = p_user_id;

    insert into public.transactions(user_id, amount, reason, type, date)
    values (
      p_user_id,
      v_reward,
      format('Calendrier de l’Avent · jour %s : %s', p_day_number, v_animation.title),
      'earn',
      now()::text
    );
  end if;

  return query
  select v_opening_id, v_outcome, v_reward, v_opened_at;
end;
$$;

grant execute on function public.open_advent_day(uuid, text, integer, text)
to anon, authenticated;
