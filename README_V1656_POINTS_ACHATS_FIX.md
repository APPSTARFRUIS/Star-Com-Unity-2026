# Star Com'Unity V1.6.56 — Achats boutique / dressing

## SQL (déjà exécuté le 05/11)
`supabase/migrations/20261105110000_v1656_points_rpc_fix.sql`
Le trigger de protection des points autorise les fonctions sécurisées du serveur
(achats boutique, dressing, jeux…) et bloque toujours les modifications directes depuis l'appli.

## Code
- Dressing (Mon espace → Ma Poire) : après un achat, le solde affiché est mis à jour
  immédiatement (avant : les points étaient bien déduits en base, mais l'affichage
  restait sur l'ancien solde jusqu'au rechargement).
