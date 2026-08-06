# Stabilisation complète du module Utilisateurs

## Corrections
- `profiles` devient l'unique source des informations métier : entreprise, service, rôle, avatar, points, téléphone.
- Le mot de passe est géré uniquement par Supabase Auth ; il n'est plus stocké en clair dans `profiles`.
- Création, modification et suppression passent par une Edge Function sécurisée.
- Lorsqu'un ancien profil n'a pas encore de compte Auth, la prochaine modification avec un nouveau mot de passe crée automatiquement son compte de connexion.
- La connexion retrouve le bon profil par identifiant Auth, `profile_id` ou adresse e-mail.
- La requête de l'annuaire récupère désormais `company`, `phone` et `job_function` : les modifications ne reviennent plus artificiellement à Star Group.
- En modification, laisser le mot de passe vide conserve le mot de passe actuel.

## Étapes Supabase obligatoires

1. SQL Editor :
   `supabase/users_stabilization_migration.sql`

2. Déployer la fonction :
   `supabase functions deploy admin-users`

La fonction utilise automatiquement les secrets Supabase du projet :
`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`.

Aucune clé sensible n'est placée dans le navigateur.
