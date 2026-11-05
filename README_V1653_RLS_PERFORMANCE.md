# Star Com'Unity V1.6.53 — Performance base de données (RLS)

Inclut la V1.6.52 (connexion & temps réel). Code de l'appli inchangé par rapport à la V1.6.52.

## Cause de la latence
Les règles de sécurité (RLS) appellent `auth.uid()`, `is_content_moderator()`, `is_current_user_admin()`
et `can_view_company_audience(...)` sans les encapsuler dans un `select`. Postgres les recalcule
**pour chaque ligne lue**, et chaque fonction relit la table `profiles`. Plus il y a de contenu,
plus chaque écran est lent, et le serveur sature dès que plusieurs salariés sont connectés.

## Correctif
- Chaque appel est réécrit en `(select ...)` : calculé une seule fois par requête.
- Le filtre par société (événements, sondages, documents…) est réécrit en ligne avec la même logique.
- Ajout des index manquants (notifications, commentaires, messages, points…), seulement s'ils n'existent pas.
- Les droits d'accès sont strictement identiques (vérifié : mêmes résultats pour admin, modérateur,
  utilisateurs de sociétés différentes, avant et après).
- Test sur 20 000 lignes : 1,96 s → 0,04 s.

## SQL à exécuter
`supabase/migrations/20261105100000_v1653_rls_performance.sql`
(Supabase → SQL Editor → coller → Run). La dernière ligne doit afficher `regles_non_optimisees = 0`.

Sauvegarde automatique des règles d'origine dans `public._policy_backup_v1653`.
Retour arrière possible : bloc commenté en bas du fichier SQL.
