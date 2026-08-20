# Star Com'Unity V1.4.1 — Notifications V3

## Correctifs
- Ajout des préférences Documents, Idées et Jeux/e-learning.
- Documents et Idées respectent maintenant leur préférence dédiée et l'audience entreprise.
- Correction du toast Newsletter (il utilisait la préférence `posts`).
- Correction du toast Célébrations (il utilisait `posts` au lieu de `celebrations`).
- Activation des notifications navigateur lorsque l'application est ouverte et que l'utilisateur les autorise.
- Ajout d'un service worker minimal pour afficher les notifications via le navigateur, y compris les navigateurs mobiles compatibles.
- Interface Paramètres rendue honnête : l'email reste préparé mais n'est pas présenté comme déjà raccordé.

## À exécuter dans Supabase
Après le déploiement, ouvrir SQL Editor et exécuter :
`supabase/notifications_v3_channels_preferences_migration.sql`

## Important — iPhone
Safari iOS impose ses propres règles pour les notifications Web. Pour obtenir l'autorisation, Star Com'Unity peut devoir être ajoutée à l'écran d'accueil. Cette version n'ajoute pas de serveur Web Push/VAPID : les notifications navigateur sont émises par l'application lorsqu'elle est active. Les notifications internes Supabase continuent, elles, à être enregistrées côté serveur.

## Email
Le switch Email est conservé et enregistré. Aucun fournisseur d'envoi (Brevo/Resend/etc.) n'étant configuré dans le projet, aucun envoi email n'a été inventé dans cette version.
