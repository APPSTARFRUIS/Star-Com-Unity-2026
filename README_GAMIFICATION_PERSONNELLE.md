# Gamification personnelle

Cette version transforme l'historique de points existant en véritable espace de progression personnel.

## Dans la Boutique

Nouveau bloc « Ma progression » :
- total de points gagnés ;
- total de points utilisés ;
- solde actuel ;
- nombre de badges débloqués ;
- progression vers le prochain badge.

## Badges automatiques

Les badges sont calculés à partir de l'historique existant, sans nouvelle table :
- Premier pas : premiers points gagnés ;
- Ça pousse : 100 points cumulés ;
- Contributeur : 250 points cumulés ;
- Top contributeur : 500 points cumulés ;
- Premier échange : premier achat en boutique ;
- Collectionneur : 5 échanges en boutique.

## Historique amélioré

- résumé Gagnés / Utilisés / Solde ;
- filtre Tout / Points gagnés / Points utilisés ;
- motif et date de chaque mouvement.

## Performance

La Boutique ne charge plus les transactions de tous les collaborateurs :
elle récupère uniquement celles de l'utilisateur connecté.

Aucune migration SQL n'est nécessaire.
