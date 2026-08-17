-- Star ComUnity — Parcours pédagogiques & niveaux
-- À exécuter UNE FOIS dans Supabase > SQL Editor après le déploiement.

-- 1. Métadonnées de progression sur les jeux.
alter table public.games
  add column if not exists learning_path text null,
  add column if not exists level_number integer not null default 1,
  add column if not exists level_title text null,
  add column if not exists passing_score integer not null default 0;

alter table public.games drop constraint if exists games_level_number_check;
alter table public.games
  add constraint games_level_number_check check (level_number >= 1);

alter table public.games drop constraint if exists games_passing_score_check;
alter table public.games
  add constraint games_passing_score_check check (passing_score between 0 and 100);

create index if not exists idx_games_learning_path_level
  on public.games(learning_path, level_number);

-- 2. Historique de progression par utilisateur.
create table if not exists public.game_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  best_score integer not null default 0 check (best_score between 0 and 100),
  passed boolean not null default false,
  completed_at timestamptz null,
  last_played_at timestamptz not null default now(),
  unique(user_id, game_id)
);

alter table public.game_completions enable row level security;

drop policy if exists "Users view own game completions" on public.game_completions;
create policy "Users view own game completions"
  on public.game_completions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins view all game completions" on public.game_completions;
create policy "Admins view all game completions"
  on public.game_completions for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN'
    )
  );

-- Table d'attribution unique des points, créée également ici pour rendre
-- cette migration autonome si la migration de fiabilisation précédente n'a pas été jouée.
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
create policy "Users view own game awards"
  on public.game_point_awards for select to authenticated
  using (user_id = auth.uid());

-- 3. Fin de partie atomique :
-- - mémorise le meilleur score ;
-- - valide le jeu seulement si le seuil est atteint ;
-- - n'attribue les points qu'une seule fois par utilisateur et par jeu.
create or replace function public.complete_game(
  p_game_id uuid,
  p_score_percent integer,
  p_amount integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reward integer;
  v_passing integer;
  v_score integer := greatest(0, least(100, coalesce(p_score_percent, 0)));
  v_passed boolean;
  v_awarded boolean := false;
  v_existing_passed boolean := false;
  v_best integer := 0;
begin
  if v_user is null then
    raise exception 'Authentification requise';
  end if;

  select reward_points, coalesce(passing_score, 0)
    into v_reward, v_passing
  from public.games
  where id = p_game_id
    and status in ('Actif', 'Terminé');

  if not found then
    raise exception 'Jeu introuvable ou indisponible';
  end if;

  if p_amount < 0 or p_amount > greatest(coalesce(v_reward, 0), 0) then
    raise exception 'Montant de récompense invalide';
  end if;

  v_passed := v_score >= v_passing;

  select passed, best_score
    into v_existing_passed, v_best
  from public.game_completions
  where user_id = v_user and game_id = p_game_id;

  insert into public.game_completions(
    user_id, game_id, best_score, passed, completed_at, last_played_at
  )
  values (
    v_user,
    p_game_id,
    v_score,
    v_passed,
    case when v_passed then now() else null end,
    now()
  )
  on conflict (user_id, game_id) do update
  set
    best_score = greatest(public.game_completions.best_score, excluded.best_score),
    passed = public.game_completions.passed or excluded.passed,
    completed_at = case
      when public.game_completions.completed_at is not null then public.game_completions.completed_at
      when excluded.passed then now()
      else null
    end,
    last_played_at = now();

  if v_passed and p_amount > 0 then
    insert into public.game_point_awards(user_id, game_id, amount, reason)
    values (
      v_user,
      p_game_id,
      p_amount,
      left(coalesce(p_reason, 'Jeu terminé'), 500)
    )
    on conflict (user_id, game_id) do nothing;

    if found then
      v_awarded := true;

      update public.profiles
      set points = coalesce(points, 0) + p_amount
      where id = v_user;

      insert into public.transactions(user_id, amount, reason, type, date)
      values (
        v_user,
        p_amount,
        left(coalesce(p_reason, 'Jeu terminé'), 500),
        'earn',
        now()::text
      );
    end if;
  end if;

  select best_score into v_best
  from public.game_completions
  where user_id = v_user and game_id = p_game_id;

  return jsonb_build_object(
    'passed', v_passed,
    'awarded', v_awarded,
    'bestScore', v_best,
    'passingScore', v_passing
  );
end;
$$;

revoke all on function public.complete_game(uuid, integer, integer, text) from public;
grant execute on function public.complete_game(uuid, integer, integer, text) to authenticated;

-- 4. Les utilisateurs ne doivent pas écrire eux-mêmes dans game_completions.
-- L'écriture passe exclusivement par complete_game() (SECURITY DEFINER).
