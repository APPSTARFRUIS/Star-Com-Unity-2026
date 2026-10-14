# Star Com'Unity V1.6.20 — Onboarding première connexion

- Présentation courte en 4 étapes uniquement tant que l'utilisateur ne l'a pas validée.
- Présente : fonctions essentielles, participation, Ressources & Jeux, notifications.
- Bouton pour passer la présentation.
- Fin de parcours : accès à l'accueil ou directement aux réglages de notifications.
- Validation persistée dans `profiles.onboarding_completed_at`, donc l'onboarding ne réapparaît pas sur un autre appareil.
- Aucun changement des autres modules.

Migration à exécuter :
`supabase/migrations/20261014223000_first_login_onboarding.sql`
