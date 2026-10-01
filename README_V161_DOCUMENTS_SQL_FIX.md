# Star Com'Unity V1.6.1 — Correctif migration Documents intelligents

Correctif de la migration V1.6.0 : `is_content_moderator()` est désormais créée/actualisée directement par la migration Documents à partir de `public.profiles.role` (`ADMIN` / `MODERATEUR`).

La migration reste additive et idempotente. Si la tentative V1.6.0 a déjà ajouté les colonnes avant d'échouer, elle peut être relancée intégralement sans supprimer les données.

À exécuter avant déploiement :
`supabase/20261001170000_v160_document_intelligence.sql`
