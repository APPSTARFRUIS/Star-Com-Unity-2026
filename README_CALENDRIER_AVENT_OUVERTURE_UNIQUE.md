# Calendrier de l'Avent – ouverture unique

Cette version ajoute :

- une ouverture unique par utilisateur, calendrier et numéro de case ;
- une table `advent_openings` indépendante des autres utilisateurs ;
- un calcul atomique des points et des résultats ;
- le tirage instant gagnant effectué côté Supabase, pas dans le navigateur ;
- le contenu de la surprise révélé uniquement après l'ouverture ;
- une case déjà ouverte toujours consultable, mais jamais ouvrable une seconde fois ;
- les autres utilisateurs peuvent ouvrir la même case normalement ;
- aucun double crédit de points possible.

## À exécuter dans Supabase

Ouvrir `supabase/advent_openings_migration.sql`, copier tout le contenu dans SQL Editor, puis cliquer sur Run.

Cette migration ne supprime aucune animation existante.
