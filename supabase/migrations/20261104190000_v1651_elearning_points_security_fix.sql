-- Star Com'Unity V1.6.51 — E-learning points security fix
-- Keeps direct profile point edits blocked while allowing trusted SECURITY DEFINER RPCs
-- to perform their own atomic balance updates.

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_content_moderator() then
    if new.role is distinct from old.role then
      raise exception 'Role modification is not allowed';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Profile identity modification is not allowed';
    end if;
    if new.points is distinct from old.points
       and coalesce(current_setting('starcommunity.trusted_points_rpc', true), '') <> '1' then
      raise exception 'Direct point balance modification is not allowed';
    end if;
  end if;
  return new;
end;
$$;

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
  if v_user is null then raise exception 'Authentification requise'; end if;

  select reward_points, coalesce(passing_score, 0), nullif(trim(learning_path), ''), coalesce(level_number, 1)
    into v_reward, v_passing, v_path, v_level
  from public.games
  where id = p_game_id and status in ('Actif', 'Terminé');
  if not found then raise exception 'Jeu introuvable ou indisponible'; end if;

  if v_level > 1 and v_path is null then raise exception 'Niveau verrouillé : parcours manquant'; end if;
  if v_path is not null and v_level > 1 then
    v_previous_level := v_level - 1;
    if not exists (
      select 1 from public.games g
      where lower(trim(g.learning_path)) = lower(trim(v_path))
        and g.level_number = v_previous_level and g.type <> 'Pari' and g.status in ('Actif','Terminé')
    ) then raise exception 'Niveau verrouillé : le niveau précédent n''est pas configuré'; end if;

    select count(*) into v_missing_required
    from public.games g
    where lower(trim(g.learning_path)) = lower(trim(v_path))
      and g.level_number = v_previous_level and g.type <> 'Pari' and g.status in ('Actif','Terminé')
      and not exists (
        select 1 from public.game_completions c
        where c.user_id = v_user and c.game_id = g.id and c.passed = true
      );
    if v_missing_required > 0 then raise exception 'Niveau verrouillé : terminez d''abord le niveau précédent'; end if;
  end if;

  if p_amount < 0 or p_amount > greatest(coalesce(v_reward, 0), 0) then
    raise exception 'Montant de récompense invalide';
  end if;

  v_passed := v_score >= v_passing;
  insert into public.game_completions(user_id, game_id, best_score, passed, completed_at, last_played_at)
  values (v_user, p_game_id, v_score, v_passed, case when v_passed then now() else null end, now())
  on conflict (user_id, game_id) do update set
    best_score = greatest(public.game_completions.best_score, excluded.best_score),
    passed = public.game_completions.passed or excluded.passed,
    completed_at = case when public.game_completions.completed_at is not null then public.game_completions.completed_at when excluded.passed then now() else null end,
    last_played_at = now();

  if v_passed and p_amount > 0 then
    insert into public.game_point_awards(user_id, game_id, amount, reason)
    values (v_user, p_game_id, p_amount, left(coalesce(p_reason, 'Jeu terminé'), 500))
    on conflict (user_id, game_id) do nothing;

    if found then
      v_awarded := true;
      perform set_config('starcommunity.trusted_points_rpc', '1', true);
      update public.profiles set points = coalesce(points, 0) + p_amount where id = v_user;
      perform set_config('starcommunity.trusted_points_rpc', '0', true);
      insert into public.transactions(user_id, amount, reason, type, date)
      values (v_user, p_amount, left(coalesce(p_reason, 'Jeu terminé'), 500), 'earn', now()::text);
    end if;
  end if;

  select best_score into v_best from public.game_completions where user_id = v_user and game_id = p_game_id;
  return jsonb_build_object('passed', v_passed, 'awarded', v_awarded, 'bestScore', v_best, 'passingScore', v_passing);
exception when others then
  perform set_config('starcommunity.trusted_points_rpc', '0', true);
  raise;
end;
$$;

revoke all on function public.complete_game(uuid, integer, integer, text) from public;
grant execute on function public.complete_game(uuid, integer, integer, text) to authenticated;
