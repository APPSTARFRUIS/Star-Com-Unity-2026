# Correctif catégories Trivial

## Problème
Le champ catégorie utilisait un `datalist` qui mélangeait :
- les catégories par défaut ;
- les catégories déjà utilisées dans les questions.

Cela pouvait afficher deux fois la même catégorie (ex. `Géographie`) et rendait la création de catégories personnalisées peu claire.

## Correction
- suppression du datalist dupliqué ;
- ajout d'un vrai gestionnaire `Catégories du Trivial` ;
- possibilité de créer une catégorie personnalisée (ex. Star Fruits, Variétés, Métiers, Marques...) ;
- liste unique sans doublon ;
- chaque question utilise désormais un select propre ;
- suppression possible d'une catégorie personnalisée tant qu'elle n'est utilisée par aucune question ;
- les catégories classiques restent disponibles.

Aucune migration SQL n'est nécessaire.
