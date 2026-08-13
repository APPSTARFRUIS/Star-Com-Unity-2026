# Correctif jeu Objets Cachés

Le jeu restait sur « Chargement de la partie… » parce que la logique existait
mais qu’aucune branche de rendu `Objets Cachés` n’était présente.

Le correctif ajoute :
- écran d’introduction ;
- contrôle de configuration image/zones ;
- image cliquable ;
- objet/indice à rechercher ;
- progression ;
- marquage visuel des objets trouvés ;
- chronomètre ;
- écran de victoire ;
- attribution des points via le moteur existant.

Aucune migration SQL n’est nécessaire.
