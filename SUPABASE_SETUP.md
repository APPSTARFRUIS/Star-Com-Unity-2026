# PlanEat – Connexion Supabase

Le projet Supabase PLANEAT est maintenant préparé et l'application contient sa connexion navigateur.

## Déjà fait

- schéma SQL installé dans Supabase ;
- RLS actif sur les données privées ;
- Project URL et Publishable key intégrées côté client ;
- client Supabase configuré avec session persistante ;
- migration progressive des réglages, du planning courant et de la liste de courses depuis le localStorage vers Supabase ;
- repli automatique sur le stockage local si Supabase est momentanément indisponible.

## À activer dans Supabase avant le premier test cloud

Dans **Authentication > Sign In / Providers > Anonymous**, activer les connexions anonymes.

PlanEat crée alors automatiquement une session utilisateur anonyme persistante. Le trigger SQL crée le profil et les réglages correspondants, puis l'application synchronise les données privées sous RLS.

Cette authentification anonyme est une étape technique de migration : elle permet de tester la persistance Supabase sans imposer encore un écran de création de compte. Une étape ultérieure ajoutera les vrais comptes et la synchronisation multi-appareils.

## Important

La clé intégrée est uniquement la **Publishable key**. Ne jamais ajouter une Secret key ou une `service_role` dans le front ou dans GitHub.

## Authentification utilisateur (étape suivante)

PlanEat démarre en mode invité avec un utilisateur Supabase anonyme afin de rester utilisable immédiatement.
L'utilisateur peut ensuite convertir ce même identifiant en compte permanent : ses données restent donc rattachées au même `user_id`.

Dans Supabase > Authentication > Sign In / Providers :

- `Allow anonymous sign-ins` : ON
- `Allow manual linking` : ON (nécessaire pour convertir un utilisateur anonyme en compte permanent)
- `Email` : Enabled
- `Confirm email` : ON pour la production

Dans Supabase > Authentication > URL Configuration :

- `Site URL` : URL de production Vercel de PlanEat (ex. `https://planeat-flax.vercel.app`)
- Ajouter aussi cette URL dans les Redirect URLs si nécessaire.

Parcours intégré dans l'application :

1. usage invité immédiat ;
2. création du compte par ajout de l'adresse e-mail au compte anonyme ;
3. confirmation de l'e-mail ;
4. définition du mot de passe ;
5. connexion persistante multi-appareils ;
6. déconnexion avec nettoyage des données utilisateur conservées localement.
