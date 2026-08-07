# Notifications V2

Cette version rend les préférences de notifications réellement effectives.

## Paramètres utilisateur
Nouveau canal :
- **Dans Star Com'Unity** : active ou coupe le centre de notifications pour le compte.

Types configurables :
- nouveaux posts ;
- événements ;
- messages directs ;
- anniversaires ;
- sondages ;
- newsletters ;
- célébrations ;
- temps forts & animations ;
- points gagnés ou utilisés.

Les préférences Email / Bureau / Mobile restent enregistrées pour les futurs canaux externes.
Elles ne déclenchent pas encore d'envoi email ou push.

## Supabase
Les triggers lisent désormais `profiles.notification_settings` avant de créer une notification.
Les anciennes préférences sont conservées et les nouvelles clés sont ajoutées à `true`.

## Étape obligatoire
Exécuter une fois dans Supabase → SQL Editor :

`supabase/notifications_v2_migration.sql`

Le script est réexécutable et ne supprime aucune notification existante.
