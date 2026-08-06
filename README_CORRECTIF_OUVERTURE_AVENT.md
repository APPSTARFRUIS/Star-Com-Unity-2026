# Correctif ouverture des cases du calendrier de l'Avent

Cette version corrige le bouton « Ouvrir la case ».

## Corrections
- signature Supabase compatible avec les identifiants texte de la table `profiles` ;
- fallback direct si la fonction RPC n'est pas disponible ;
- message d'erreur visible dans la fenêtre du calendrier ;
- protection contre les doubles clics ;
- contrainte unique conservée par utilisateur, calendrier et numéro de case.

## Supabase
Exécuter une fois :

`supabase/advent_openings_fix.sql`

Ce script est réexécutable et ne supprime pas les ouvertures déjà enregistrées.
