-- V1.6.37 — Ma Poire : collections, récompenses et origine onboarding neutre
alter table public.mascots drop constraint if exists mascots_origin_check;
update public.mascots set origin='ONBOARDING' where origin='STAR_T';
alter table public.mascots add constraint mascots_origin_check check (origin in ('STAR_COMMUNITY','ONBOARDING'));

alter table public.mascot_reward_rules add column if not exists trigger_value integer;
alter table public.mascot_reward_rules add column if not exists description text;

-- Évalue uniquement des règles vérifiables côté serveur et attribue chaque objet une seule fois.
create or replace function public.evaluate_mascot_rewards()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  r record;
  v_ok boolean;
  v_count integer;
  v_awarded integer := 0;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  for r in
    select rr.* from public.mascot_reward_rules rr
    join public.mascot_items mi on mi.id=rr.item_id
    where rr.active=true and mi.active=true
      and not exists(select 1 from public.mascot_user_items mui where mui.user_id=v_user and mui.item_id=rr.item_id)
  loop
    v_ok := false;

    if r.trigger_type='points_earned' then
      select coalesce(sum(greatest(amount,0)),0)::int into v_count
      from public.transactions where user_id=v_user and type='earn';
      v_ok := v_count >= coalesce(r.trigger_value,0);

    elsif r.trigger_type='game_completed' then
      select count(*)::int into v_count from public.game_completions
      where user_id=v_user and passed=true and game_id::text=r.trigger_ref;
      v_ok := v_count > 0;

    elsif r.trigger_type='learning_path_completed' then
      select count(*)::int into v_count
      from public.games g
      where g.learning_path=r.trigger_ref and g.status in ('Actif','Terminé')
        and not exists(select 1 from public.game_completions gc where gc.user_id=v_user and gc.game_id=g.id and gc.passed=true);
      v_ok := v_count=0 and exists(select 1 from public.games g2 where g2.learning_path=r.trigger_ref);

    elsif r.trigger_type='predictions_count' then
      select count(*)::int into v_count from public.game_predictions where user_id=v_user;
      v_ok := v_count >= coalesce(r.trigger_value,1);
    end if;

    if v_ok then
      insert into public.mascot_user_items(user_id,item_id,acquisition_method,equipped)
      values(v_user,r.item_id,'unlock',false)
      on conflict(user_id,item_id) do nothing;
      if found then v_awarded := v_awarded + 1; end if;
    end if;
  end loop;

  return jsonb_build_object('awarded',v_awarded);
end$$;
revoke all on function public.evaluate_mascot_rewards() from public,anon;
grant execute on function public.evaluate_mascot_rewards() to authenticated;
