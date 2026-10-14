-- Star Com'Unity V1.6.15 — notifications automatiques
-- Complète le moteur existant : ressources/e-learning, activation d'un jeu,
-- et résultat individuel d'un pronostic.
-- Réexécutable, sans suppression de données métier.

begin;

create or replace function public.notification_enabled(
  p_settings jsonb,
  p_preference_key text
)
returns boolean
language sql
immutable
as $$
  select
    coalesce((p_settings->>'inApp')::boolean, true)
    and case
      when p_preference_key is null then true
      else coalesce((p_settings->>p_preference_key)::boolean, true)
    end;
$$;

create or replace function public.notify_audience_profiles_with_preferences(
  p_kind text,
  p_title text,
  p_message text,
  p_link_view text,
  p_entity_id text,
  p_excluded_user_id text,
  p_audience text[],
  p_preference_key text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications(user_id, kind, title, message, link_view, entity_id)
  select p.id::text, p_kind, p_title, p_message, p_link_view, p_entity_id
  from public.profiles p
  where (p_excluded_user_id is null or p.id::text <> p_excluded_user_id)
    and public.notification_enabled(p.notification_settings, p_preference_key)
    and (
      'ALL' = any(coalesce(p_audience, array[]::text[]))
      or 'TOUS' = any(array(select upper(trim(x)) from unnest(coalesce(p_audience, array[]::text[])) x))
      or exists (
        select 1 from unnest(coalesce(p_audience, array[]::text[])) company_name
        where lower(trim(company_name)) = lower(trim(coalesce(p.company, '')))
      )
    );
$$;

-- Nouvelle ressource publiée : respecte l'audience société et la préférence jeux/e-learning.
create or replace function public.notify_learning_resource_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.published = true and (tg_op = 'INSERT' or coalesce(old.published, false) = false) then
    perform public.notify_audience_profiles_with_preferences(
      'game',
      'Nouvelle ressource e-learning',
      new.title,
      'ressources',
      new.id::text,
      new.created_by::text,
      coalesce(new.audience_companies, array['ALL']::text[]),
      'games'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_learning_resource_published on public.learning_resources;
create trigger trg_notify_learning_resource_published
after insert or update of published on public.learning_resources
for each row execute function public.notify_learning_resource_published();

-- Un jeu créé inactif puis publié doit lui aussi générer la notification.
create or replace function public.notify_game_activated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.status, '')) in ('actif','active','published','publié','publie')
     and lower(coalesce(old.status, '')) not in ('actif','active','published','publié','publie') then
    perform public.notify_audience_profiles_with_preferences(
      'game',
      'Nouveau jeu / e-learning',
      new.title,
      'jeux',
      new.id::text,
      new.created_by::text,
      array['ALL']::text[],
      'games'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_game_activated on public.games;
create trigger trg_notify_game_activated
after update of status on public.games
for each row execute function public.notify_game_activated();

-- Quand l'admin valide un résultat de pronostic, chaque participant reçoit son résultat personnel.
create or replace function public.notify_prediction_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_settings jsonb;
  v_game_title text;
  v_points integer;
begin
  begin v_old := coalesce(old.choice, '{}')::jsonb; exception when others then v_old := '{}'::jsonb; end;
  begin v_new := coalesce(new.choice, '{}')::jsonb; exception when others then v_new := '{}'::jsonb; end;

  if coalesce((v_new->>'awarded')::boolean, false) = true
     and coalesce((v_old->>'awarded')::boolean, false) = false then
    select notification_settings into v_settings from public.profiles where id::text = new.user_id::text limit 1;
    if public.notification_enabled(v_settings, 'games') then
      select title into v_game_title from public.games where id = new.game_id limit 1;
      v_points := coalesce(nullif(v_new->>'pointsAwarded','')::integer, 0);
      insert into public.notifications(user_id, kind, title, message, link_view, entity_id)
      values (
        new.user_id::text,
        'game',
        'Résultat de votre pronostic',
        coalesce(v_game_title, 'Pronostic') || ' : ' ||
          case when v_points > 0 then '+' || v_points::text || ' point' || case when v_points > 1 then 's' else '' end
               else 'aucun point cette fois' end || '.',
        'tempsforts',
        new.game_id::text
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_prediction_result on public.game_predictions;
create trigger trg_notify_prediction_result
after update of choice on public.game_predictions
for each row execute function public.notify_prediction_result();

commit;
