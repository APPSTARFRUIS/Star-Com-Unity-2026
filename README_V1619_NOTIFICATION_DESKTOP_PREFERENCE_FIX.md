# Star Com'Unity V1.6.19 — Correctif préférence Notifications bureau

Base : V1.6.18.

## Correctif
- Le poller de rattrapage Web Push respecte maintenant la préférence utilisateur du canal courant.
- Sur ordinateur, `notification_settings.desktop = false` bloque tout appel automatique à `send-push-test`.
- Sur mobile, le même mécanisme respecte `notification_settings.mobile`.
- Le chemin Realtime conservait déjà ce contrôle ; les deux chemins sont désormais cohérents.
- Le mode test reste verrouillé sur l'adresse de test configurée.
- Les notifications internes restent indépendantes du canal bureau.

## Déploiement
Aucune migration SQL supplémentaire.
Aucun redéploiement d'Edge Function requis pour ce correctif.
