-- Star ComUnity — réparation et verrouillage de la progression Jeux
-- À exécuter UNE FOIS dans Supabase > SQL Editor après déploiement.

-- Répare les jeux de progression créés avec un thème/niveau mais dont le parcours
-- aurait été perdu lors de l'enregistrement.
update public.games
set learning_path = 'Parcours Star ComUnity'
where type <> 'Pari'
  and nullif(trim(coalesce(learning_path, '')), '') is null
  and (
    coalesce(level_number, 1) > 1
    or nullif(trim(coalesce(level_title, '')), '') is not null
  );

-- Normalise les champs texte.
update public.games
set
  learning_path = nullif(trim(learning_path), ''),
  level_title = nullif(trim(level_title), '')
where type <> 'Pari';

-- Empêche désormais un niveau > 1 d'être enregistré sans parcours.
create or replace function public.validate_game_learning_progression()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.level_number := greatest(1, coalesce(new.level_number, 1));
  new.passing_score := greatest(0, least(100, coalesce(new.passing_score, 0)));
  new.learning_path := nullif(trim(new.learning_path), '');
  new.level_title := nullif(trim(new.level_title), '');

  if new.type <> 'Pari' and new.level_number > 1 and new.learning_path is null then
    raise exception 'Un niveau supérieur à 1 doit appartenir à un parcours';
  end if;

  if new.type <> 'Pari' and new.learning_path is not null and new.level_title is null then
    raise exception 'Un jeu de parcours doit avoir un thème / nom de niveau';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_game_learning_progression on public.games;
create trigger trg_validate_game_learning_progression
before insert or update on public.games
for each row execute function public.validate_game_learning_progression();

-- Remplace complete_game par une validation strictement séquentielle.
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
  v_path text;
  v_level integer;
  v_previous_level integer;
  v_missing_required integer := 0;
  v_score integer := greatest(0, least(100, coalesce(p_score_percent, 0)));
  v_passed boolean;
  v_awarded boolean := false;
  v_best integer := 0;
begin
  if v_user is null then
    raise exception 'Authentification requise';
  end if;

  select reward_points, coalesce(passing_score, 0), nullif(trim(learning_path), ''), coalesce(level_number, 1)
    into v_reward, v_passing, v_path, v_level
  from public.games
  where id = p_game_id
    and status in ('Actif', 'Terminé');

  if not found then
    raise exception 'Jeu introuvable ou indisponible';
  end if;

  if v_level > 1 and v_path is null then
    raise exception 'Niveau verrouillé : parcours manquant';
  end if;

  if v_path is not null and v_level > 1 then
    v_previous_level := v_level - 1;

    if not exists (
      select 1
      from public.games g
      where lower(trim(g.learning_path)) = lower(trim(v_path))
        and g.level_number = v_previous_level
        and g.type <> 'Pari'
        and g.status in ('Actif', 'Terminé')
    ) then
      raise exception 'Niveau verrouillé : le niveau précédent n''est pas configuré';
    end if;

    select count(*)
      into v_missing_required
    from public.games g
    where lower(trim(g.learning_path)) = lower(trim(v_path))
      and g.level_number = v_previous_level
      and g.type <> 'Pari'
      and g.status in ('Actif', 'Terminé')
      and not exists (
        select 1
        from public.game_completions c
        where c.user_id = v_user
          and c.game_id = g.id
          and c.passed = true
      );

    if v_missing_required > 0 then
      raise exception 'Niveau verrouillé : terminez d''abord le niveau précédent';
    end if;
  end if;

  if p_amount < 0 or p_amount > greatest(coalesce(v_reward, 0), 0) then
    raise exception 'Montant de récompense invalide';
  end if;

  v_passed := v_score >= v_passing;

  insert into public.game_completions(
    user_id, game_id, best_score, passed, completed_at, last_played_at
  )
  values (
    v_user, p_game_id, v_score, v_passed,
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
    values (v_user, p_game_id, p_amount, left(coalesce(p_reason, 'Jeu terminé'), 500))
    on conflict (user_id, game_id) do nothing;

    if found then
      v_awarded := true;

      update public.profiles
      set points = coalesce(points, 0) + p_amount
      where id = v_user;

      insert into public.transactions(user_id, amount, reason, type, date)
      values (v_user, p_amount, left(coalesce(p_reason, 'Jeu terminé'), 500), 'earn', now()::text);
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
