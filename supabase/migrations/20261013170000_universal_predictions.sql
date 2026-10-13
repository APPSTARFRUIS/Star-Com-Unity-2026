-- Star Com'Unity V1.6.9 — pronostics universels
-- Permet score, vainqueur, choix et réponse numérique sans modifier le schéma des tables.
create or replace function public.submit_game_prediction_v2(
  p_game_id uuid,
  p_event_id text,
  p_home_score integer default null,
  p_away_score integer default null,
  p_answer text default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_user uuid := auth.uid(); v_fixture jsonb; v_existing uuid; v_id uuid; v_choice text; v_format text;
begin
  if v_user is null then raise exception 'Authentification requise'; end if;
  select fixture into v_fixture from public.games g,
    lateral jsonb_array_elements(coalesce(g.sport_events,'[]'::jsonb)) fixture
    where g.id=p_game_id and g.type='Pari' and g.status='Actif' and fixture->>'id'=p_event_id limit 1;
  if v_fixture is null then raise exception 'Pronostic introuvable ou indisponible'; end if;
  if coalesce((v_fixture->>'isFinished')::boolean,false) then raise exception 'Ce pronostic est terminé'; end if;
  if nullif(v_fixture->>'closingDate','') is null or (v_fixture->>'closingDate')::timestamptz <= now() then raise exception 'Les pronostics sont clôturés'; end if;
  v_format := coalesce(nullif(v_fixture->>'predictionFormat',''),'score');
  if v_format='score' then
    if p_home_score is null or p_away_score is null or p_home_score<0 or p_away_score<0 then raise exception 'Score invalide'; end if;
    v_choice := jsonb_build_object('eventId',p_event_id,'homeScore',p_home_score,'awayScore',p_away_score,'awarded',false,'pointsAwarded',0)::text;
  else
    if nullif(trim(coalesce(p_answer,'')),'') is null then raise exception 'Réponse obligatoire'; end if;
    v_choice := jsonb_build_object('eventId',p_event_id,'answer',p_answer,'choice',p_answer,'awarded',false,'pointsAwarded',0)::text;
  end if;
  perform pg_advisory_xact_lock(hashtext(v_user::text||':'||p_game_id::text||':'||p_event_id));
  select id into v_existing from public.game_predictions where user_id=v_user and game_id=p_game_id and choice::jsonb->>'eventId'=p_event_id order by submitted_at desc limit 1;
  if v_existing is null then insert into public.game_predictions(user_id,game_id,choice,submitted_at) values(v_user,p_game_id,v_choice,now()) returning id into v_id;
  else update public.game_predictions set choice=v_choice,submitted_at=now() where id=v_existing returning id into v_id; end if;
  return v_id;
end; $$;
revoke all on function public.submit_game_prediction_v2(uuid,text,integer,integer,text) from public;
grant execute on function public.submit_game_prediction_v2(uuid,text,integer,integer,text) to authenticated;
