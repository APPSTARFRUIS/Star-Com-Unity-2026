-- Star ComUnity - fiabilisation du module Jeux
-- 1 récompense maximum par utilisateur et par jeu + attribution atomique des points.

create table if not exists public.game_point_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  game_id uuid not null,
  amount integer not null check (amount >= 0),
  reason text not null,
  awarded_at timestamptz not null default now(),
  unique (user_id, game_id)
);

alter table public.game_point_awards enable row level security;
drop policy if exists "Users view own game awards" on public.game_point_awards;
create policy "Users view own game awards" on public.game_point_awards
  for select to authenticated using (user_id = auth.uid());

create or replace function public.award_game_points(p_game_id uuid, p_amount integer, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reward integer;
begin
  if v_user is null then raise exception 'Authentification requise'; end if;
  if p_amount <= 0 then return false; end if;

  select reward_points into v_reward from public.games where id = p_game_id and status in ('Actif','Terminé');
  if not found then raise exception 'Jeu introuvable ou indisponible'; end if;
  if p_amount > greatest(coalesce(v_reward,0), 0) then raise exception 'Montant de récompense invalide'; end if;

  insert into public.game_point_awards(user_id, game_id, amount, reason)
  values (v_user, p_game_id, p_amount, left(coalesce(p_reason,'Jeu terminé'), 500))
  on conflict (user_id, game_id) do nothing;

  if not found then return false; end if;

  update public.profiles set points = coalesce(points,0) + p_amount where id = v_user;
  insert into public.transactions(user_id, amount, reason, type, date)
  values (v_user, p_amount, left(coalesce(p_reason,'Jeu terminé'), 500), 'earn', now()::text);
  return true;
end;
$$;

revoke all on function public.award_game_points(uuid, integer, text) from public;
grant execute on function public.award_game_points(uuid, integer, text) to authenticated;

-- Pronostics : écriture via RPC uniquement pour les utilisateurs ; contrôle de clôture côté serveur.
create or replace function public.submit_game_prediction(p_game_id uuid, p_event_id text, p_home_score integer, p_away_score integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_fixture jsonb;
  v_existing uuid;
  v_choice text;
  v_id uuid;
begin
  if v_user is null then raise exception 'Authentification requise'; end if;
  if p_home_score < 0 or p_away_score < 0 then raise exception 'Score invalide'; end if;

  select fixture into v_fixture
  from public.games g,
       lateral jsonb_array_elements(coalesce(g.sport_events, '[]'::jsonb)) fixture
  where g.id = p_game_id and g.type = 'Pari' and g.status = 'Actif' and fixture->>'id' = p_event_id
  limit 1;

  if v_fixture is null then raise exception 'Rencontre introuvable ou indisponible'; end if;
  if coalesce((v_fixture->>'isFinished')::boolean, false) then raise exception 'Cette rencontre est terminée'; end if;
  if nullif(v_fixture->>'closingDate','') is null or (v_fixture->>'closingDate')::timestamptz <= now() then
    raise exception 'Les pronostics sont clôturés';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user::text || ':' || p_game_id::text || ':' || p_event_id));
  v_choice := jsonb_build_object('eventId', p_event_id, 'homeScore', p_home_score, 'awayScore', p_away_score, 'awarded', false, 'pointsAwarded', 0)::text;

  select id into v_existing from public.game_predictions
   where user_id = v_user and game_id = p_game_id and choice::jsonb->>'eventId' = p_event_id
   order by submitted_at desc limit 1;

  if v_existing is null then
    insert into public.game_predictions(user_id, game_id, choice, submitted_at)
    values (v_user, p_game_id, v_choice, now()) returning id into v_id;
  else
    update public.game_predictions set choice = v_choice, submitted_at = now() where id = v_existing returning id into v_id;
  end if;
  return v_id;
end;
$$;

revoke all on function public.submit_game_prediction(uuid, text, integer, integer) from public;
grant execute on function public.submit_game_prediction(uuid, text, integer, integer) to authenticated;

-- Jeux : lecture pour les utilisateurs, administration réservée aux ADMIN.
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='games' loop
    execute format('drop policy if exists %I on public.games', r.policyname);
  end loop;
end $$;
create policy "Authenticated view games" on public.games for select to authenticated using (true);
create policy "Admins create games" on public.games for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
create policy "Admins update games" on public.games for update to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'))
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
create policy "Admins delete games" on public.games for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));

-- Les utilisateurs lisent les pronostics (classement), mais n'écrivent qu'au travers de submit_game_prediction.
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='game_predictions' loop
    execute format('drop policy if exists %I on public.game_predictions', r.policyname);
  end loop;
end $$;
create policy "Authenticated view predictions" on public.game_predictions for select to authenticated using (true);
create policy "Admins update predictions" on public.game_predictions for update to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'))
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='ADMIN'));
