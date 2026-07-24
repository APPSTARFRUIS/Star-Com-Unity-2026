# Module Pari Sportif

## Installation Supabase obligatoire
Avant de créer le premier tournoi, exécuter dans **Supabase > SQL Editor** le fichier :

`supabase/sport_predictions_migration.sql`

Cette migration ajoute le champ JSON `sport_events` à la table `games`.

## Fonctionnement
- L'administrateur crée un jeu de type **Pari Sportif**.
- Il ajoute autant de rencontres que nécessaire, avec date du match et date de clôture.
- Les utilisateurs pronostiquent les scores exacts.
- L'administrateur saisit ensuite le résultat de chaque rencontre depuis **Administration > Jeux**.
- Attribution automatique : 5 points pour le score exact, 2 points pour le bon résultat (victoire/nul/défaite).
