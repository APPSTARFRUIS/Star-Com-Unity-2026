# Star Com'Unity V1.6.32 — Correctif RLS fonctionnel

Correctif de la V1.6.29 : les anciennes policies mixtes `anon, authenticated` avaient été supprimées pour fermer l'accès anonyme, ce qui avait aussi retiré les autorisations authentifiées de plusieurs modules.

Cette version restaure les droits nécessaires pour :
- Événements
- Boîte à idées
- Documents
- Sondages
- Célébrations

L'accès `anon` reste révoqué. Aucun contenu métier n'est supprimé.

## À exécuter dans Supabase
`supabase/migrations/20261021095500_v1632_rls_functional_permissions_fix.sql`

Cette migration est idempotente.
