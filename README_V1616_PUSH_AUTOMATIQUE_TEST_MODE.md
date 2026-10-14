# Star Com’Unity V1.6.16 — Push automatique / mode test

- Branche les notifications internes temps réel sur la fonction Web Push déjà validée.
- En mode test, seul le compte dont l’adresse correspond à `notifications_test_email` peut déclencher/recevoir le push externe.
- Le push reprend le titre et le message de la notification interne.
- Le bouton de test Admin reste compatible.
- Aucun SQL supplémentaire.
- Aucun envoi e-mail ajouté.

## Déploiement Supabase
Redéployer la fonction Edge `supabase/functions/send-push-test/index.ts` afin qu’elle accepte `notification_id`.
Les secrets VAPID existants restent inchangés.
