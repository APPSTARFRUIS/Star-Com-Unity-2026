-- Star Com'Unity V1.6.56 — Achats boutique / Ma Poire / jeux bloqués
--
-- PROBLÈME : la protection du solde de points (trigger sur profiles) bloquait aussi
-- les fonctions sécurisées du serveur (claim_shop_reward, claim_mascot_item, jeux,
-- calendrier de l'Avent…), d'où « Direct point balance modification is not allowed ».
--
-- CORRECTIF : on distingue qui fait la modification.
--  - Requête directe depuis l'appli (rôle "authenticated")  -> toujours BLOQUÉE.
--  - Fonction sécurisée du serveur (SECURITY DEFINER)      -> AUTORISÉE.
-- Le trigger passe en SECURITY INVOKER pour voir le vrai rôle appelant.
-- Aucune fonction d'achat n'est modifiée. Sûr à relancer.

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Seules les requêtes envoyées directement par l'appli (rôles API) sont contrôlées.
  -- Une fonction SECURITY DEFINER s'exécute avec le rôle de son propriétaire : elle passe.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

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

-- Vérification : doit afficher "invoker".
select case when prosecdef then 'definer' else 'invoker' end as mode_trigger
from pg_proc where proname = 'protect_profile_privileged_fields';
