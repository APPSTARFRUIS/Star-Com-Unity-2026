# Moteur de notifications

Cette version rend le centre de notifications réellement opérationnel.

## Notifications automatiques
- nouveau message : destinataire uniquement ;
- nouveau post : tous les profils sauf l'auteur ;
- nouvel événement : tous les profils sauf le créateur ;
- nouveau sondage : tous les profils sauf le créateur ;
- nouvelle newsletter : tous les profils ;
- nouvelle célébration : tous les profils sauf le créateur ;
- nouveau temps fort : tous les profils sauf le créateur ;
- points gagnés ou utilisés : utilisateur concerné uniquement.

Les notifications sont créées côté Supabase par des triggers. Elles fonctionnent donc même si
l'utilisateur n'a pas l'application ouverte au moment de l'événement.

## Étape Supabase obligatoire
Exécuter une fois :

`supabase/notifications_engine_migration.sql`

Le script est réexécutable et ne supprime aucune donnée existante.
