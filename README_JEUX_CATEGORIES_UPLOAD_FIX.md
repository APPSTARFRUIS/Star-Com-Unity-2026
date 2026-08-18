# Jeux — upload vignette + catégories administrables

## Upload vignette
- les images de plus de 2 Mo sont optimisées automatiquement dans le navigateur (WebP, max 1920 px) ;
- l'upload Supabase Storage est retenté jusqu'à 3 fois sur les erreurs temporaires (timeout, réseau, 502/503/504) ;
- si un timeout survient après que Storage a déjà reçu le fichier, un conflit « already exists » est traité comme un succès ;
- aucun changement sur les autres fonctions Jeux/niveaux/points.

## Catégories Jeux
Dans Administration > Jeux, un bloc « Catégories de jeux » permet de :
- ajouter une catégorie (ex. Missions, Entreprises, Métiers, Marques) ;
- renommer une catégorie ; les jeux existants sont renommés aussi ;
- supprimer une catégorie ; les jeux concernés sont automatiquement reclassés dans une autre catégorie ;
- les filtres de la page Jeux utilisent immédiatement la liste configurée.

## SQL obligatoire
Après le déploiement, exécuter :
`supabase/game_categories_config_migration.sql`

Le patch de séquence stricte des niveaux reste inchangé s'il n'a pas encore été exécuté.
