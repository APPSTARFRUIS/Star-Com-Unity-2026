# Calendrier de l’Avent interactif

Cette version ajoute des cases configurables par type : cadeau, mini quiz, vidéo, document, mission, coupon, instant gagnant, jeu, photo mystère, anecdote et jackpot.

Le suivi des cases ouvertes, des bonnes réponses et des gagnants instantanés est stocké dans le champ JSON `config` de la table `engagement_animations`. Aucune nouvelle migration SQL n’est nécessaire si `engagement_module_migration.sql` a déjà été exécutée.

## Fonctionnement
- Une case se déverrouille chaque jour à partir de la date de début du calendrier.
- Les points ne peuvent être attribués qu’une seule fois par utilisateur et par case.
- Les quiz et photos mystère attribuent les points uniquement si la réponse est correcte.
- L’instant gagnant utilise la probabilité configurée dans l’administration.
- Une jauge indique la progression sur 24 cases.
