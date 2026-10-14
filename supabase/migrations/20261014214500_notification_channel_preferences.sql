-- Star Com'Unity V1.6.18 — préférences de notifications par utilisateur
-- Rend les canaux indépendants : une notification peut exister pour le push
-- même si l'utilisateur désactive son centre de notifications interne.
-- Réexécutable, sans suppression de données métier.

begin;

-- Garantit les clés sans écraser les choix déjà enregistrés.
update public.profiles
set notification_settings =
  jsonb_build_object(
    'inApp', true,
    'email', false,
    'desktop', false,
    'mobile', false,
    'posts', true,
    'events', true,
    'messages', true,
    'birthdays', true,
    'polls', true,
    'newsletters', true,
    'celebrations', true,
    'highlights', true,
    'points', true,
    'documents', true,
    'ideas', true,
    'games', true
  ) || coalesce(notification_settings, '{}'::jsonb);

-- Une ligne de notification est créée si le TYPE est autorisé et si au moins
-- un canal de diffusion est actif. L'affichage in-app et le push sont ensuite
-- filtrés séparément côté application.
create or replace function public.notification_enabled(
  p_settings jsonb,
  p_preference_key text
)
returns boolean
language sql
immutable
as $$
  select
    case
      when p_preference_key is null then true
      else coalesce((p_settings->>p_preference_key)::boolean, true)
    end
    and (
      coalesce((p_settings->>'inApp')::boolean, true)
      or coalesce((p_settings->>'desktop')::boolean, false)
      or coalesce((p_settings->>'mobile')::boolean, false)
      or coalesce((p_settings->>'email')::boolean, false)
    );
$$;

commit;
