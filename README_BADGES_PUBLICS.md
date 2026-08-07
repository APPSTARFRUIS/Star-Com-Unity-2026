# Badges publics dans l'annuaire

Cette version répond à la question : les autres collaborateurs peuvent-ils voir les badges ?

Oui.

## Ce qui change
- Les badges débloqués apparaissent désormais sur les cartes utilisateurs dans l'Annuaire & Équipe.
- Ils sont visibles en Liste, Services et Organigramme.
- Jusqu'à 3 badges sont affichés directement ; un compteur `+N` indique les suivants.
- Le nom du badge apparaît au survol.

## Respect de la confidentialité
- Les autres utilisateurs voient uniquement les badges débloqués.
- Ils ne voient pas l'historique des points, les motifs des gains, les achats ni le détail des transactions.
- L'annuaire ne charge que `user_id`, `amount` et `type` pour calculer les badges.

## Badges publics
- Premier pas
- Ça pousse
- Contributeur
- Top contributeur
- Premier échange
- Collectionneur

Aucune migration SQL n'est nécessaire.
