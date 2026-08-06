# Stabilisation du module Utilisateurs

Cette version n'utilise plus de déploiement manuel Supabase CLI.

## Fonctionnement

- Le frontend appelle `/api/admin-users`.
- Cette API Vercel est déployée automatiquement avec le projet GitHub.
- Elle synchronise Supabase Auth et la table `profiles`.
- Les mots de passe sont gérés uniquement par Supabase Auth.
- Laisser le mot de passe vide lors d'une modification conserve le mot de passe actuel.
- Entreprise, service, rôle, avatar, téléphone et fonction sont enregistrés dans `profiles`.

## Étapes à effectuer

### 1. GitHub / Vercel

Pousser le ZIP sur GitHub. Vercel déploiera automatiquement l'application et l'API.

### 2. Supabase SQL Editor

Exécuter :

`supabase/users_stabilization_migration.sql`

### 3. Variables Vercel

Dans **Vercel → Environment Variables**, vérifier ou ajouter :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Les deux premières peuvent reprendre les valeurs déjà utilisées par
`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

La clé `SUPABASE_SERVICE_ROLE_KEY` se trouve dans :
**Supabase → Project Settings → API Keys → service_role**.

Cette clé doit rester uniquement dans Vercel. Ne jamais la placer dans une variable commençant par `VITE_`.
