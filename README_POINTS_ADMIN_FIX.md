# Points administrateur — correctif

Cette version corrige la modification manuelle des points.

## Sécurité
- Les boutons +/- ne sont visibles que pour un utilisateur ayant le rôle `ADMIN`.
- L'API `/api/admin-users` revérifie le rôle `ADMIN` côté serveur avant l'ajustement.
- Un USER ou un MODERATOR ne peut donc pas modifier les points en contournant simplement l'interface.

## Fonctionnement
- `+` ajoute 50 points.
- `−` retire 50 points, sans jamais passer sous zéro.
- La fiche utilisateur n'est plus envoyée au service Auth pour une simple modification de points.
- Le solde est mis à jour immédiatement dans l'interface.
- Si l'admin modifie ses propres points, son solde courant est également rafraîchi.

## Historique
Chaque ajustement crée une transaction :
- `Ajustement administrateur : points ajoutés`
- `Ajustement administrateur : points retirés`

Cela permet de conserver une trace.

Un retrait administratif n'est pas comptabilisé comme un achat Boutique pour les badges
« Premier échange » et « Collectionneur ».

Aucune migration SQL n'est nécessaire.
