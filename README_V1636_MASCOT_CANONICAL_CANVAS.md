# V1.6.36 — Ma Poire : rendu identique Admin / utilisateur

Correctif du décalage visuel des accessoires entre l'aperçu Administration et la mascotte de l'utilisateur.

## Correction
- ajout d'un canevas carré canonique partagé par l'Admin et `Mon espace` ;
- les coordonnées X/Y, la taille, la rotation et l'écartement d'une paire sont désormais calculés dans exactement le même repère ;
- l'aperçu Admin n'utilise plus une zone panoramique alors que la carte utilisateur utilisait une zone presque carrée ;
- le glisser-déposer continue de fonctionner sur le nouveau canevas ;
- les réglages déjà enregistrés en V1.6.34/V1.6.35 sont conservés.

## Base de données
Aucune migration SQL supplémentaire.
