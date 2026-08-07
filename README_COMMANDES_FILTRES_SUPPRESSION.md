# Commandes Boutique — filtres et nettoyage

## Nouveautés
Dans Administration > Boutique > Commandes :

- filtre **En attente** (affiché par défaut) ;
- filtre **Distribuées** ;
- filtre **Toutes** ;
- compteur sur chaque filtre.

## Suppression
Une commande possède un bouton `Supprimer` uniquement lorsqu'elle est déjà `Distribuée`.

La suppression :
- demande une confirmation ;
- supprime uniquement la ligne d'historique ;
- ne restitue ni les points à l'utilisateur ni le stock du produit ;
- est protégée côté serveur et réservée aux `ADMIN`.

Une commande encore `En attente` ne peut pas être supprimée, même via l'API.

Aucune nouvelle migration SQL n'est nécessaire.
La migration `boutique_order_status_migration.sql` du ZIP précédent doit simplement avoir été exécutée.
