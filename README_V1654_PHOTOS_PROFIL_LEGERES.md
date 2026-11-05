# Star Com'Unity V1.6.54 — Annuaire léger (photos de profil)

Inclut V1.6.52 (connexion/temps réel) et V1.6.53 (SQL performance RLS).

## Cause
4 photos de profil sur 25 étaient enregistrées en base64 directement dans `profiles.avatar`,
soit ~10 Mo. L'annuaire (Équipe, Messages, Célébrations…) téléchargeait ces 10 Mo à chaque
ouverture, et c'était trop lourd pour le cache du navigateur : rechargement complet à chaque fois.
Les mêmes images étaient aussi recopiées dans `posts`, `comments`, `ideas`, `celebrations`.

## Correctif
- Nouvelle action serveur `migrate_avatars` (`api/admin-users.js`, réservée aux ADMIN) :
  convertit chaque avatar base64 en fichier dans le bucket `star-community-media/avatars/`,
  remplace la valeur par le lien public, et met à jour les copies dans posts/commentaires/idées/célébrations.
- Lancée automatiquement une seule fois quand un administrateur ouvre l'appli (message de confirmation).
- Idempotente : relancée, elle ne traite que les avatars encore en base64.
- Les nouvelles photos passent déjà par le Storage (inchangé).

## Déploiement
Pousser sur `main`. Aucun SQL. Ouvrir ensuite l'appli avec un compte ADMIN.

## Vérification (SQL Editor)
select count(*) filter (where avatar like 'data:%') as photos_dans_la_base,
       pg_size_pretty(sum(length(coalesce(avatar,'')))::bigint) as poids_des_photos
from public.profiles;
-- attendu : 0 et quelques Ko
