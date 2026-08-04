# Pronostics déplacés dans Temps forts

Cette version déplace le module Pronostics hors de la rubrique Jeux.

## Côté utilisateur
- Les quiz, Memory, Chronologie, Trivial Pursuit et Objets cachés restent dans **Jeux**.
- Les compétitions de pronostics apparaissent désormais dans **Temps forts**.
- Les pronostics, dates de clôture, résultats et classements existants sont conservés.

## Côté administration
- L’option Pronostics a été retirée de **Administration > Jeux**.
- La création et la gestion se font dans **Administration > Animations > Pronostics**.
- L’administrateur peut créer une compétition, ajouter les rencontres, régler le barème, saisir les résultats, activer/désactiver ou supprimer la compétition.

## Base de données
Aucune nouvelle migration Supabase n’est nécessaire. Les données continuent d’utiliser les tables `games` et `game_predictions` existantes afin de préserver les pronostics déjà créés.
