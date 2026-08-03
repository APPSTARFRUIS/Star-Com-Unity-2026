# Correctif mobile du module Jeux

Le défilement du quiz est désormais porté par la fenêtre de jeu elle-même, au lieu d'une zone imbriquée bloquée sur iOS.

Corrections dans `components/JeuxView.tsx` :
- fenêtre de jeu scrollable au toucher ;
- suppression du conteneur absolu qui bloquait le déplacement vertical ;
- question et réponses dans le flux normal de la page ;
- barre de progression fixe en haut ;
- bouton de validation fixe en bas pour les QCM ;
- prise en charge de la safe area iPhone.

Les quiz existants n'ont pas besoin d'être recréés.
