# Commandes Boutique — correctif administration

Le problème venait de l'optimisation de la Boutique :
la vue utilisateur ne chargeait plus que ses propres transactions, et l'Administration réutilisait ce même état.

## Correction

- Boutique utilisateur :
  - continue de charger uniquement les transactions de l'utilisateur connecté.

- Administration > Boutique > Commandes :
  - charge toutes les transactions de type `spend` ;
  - le compteur Commandes reflète donc toutes les demandes ;
  - affiche la date ;
  - affiche le nom et l'email de l'utilisateur ;
  - affiche clairement la récompense demandée ;
  - affiche le nombre de points dépensés.

Les changements de transactions en Realtime invalident déjà la vue Administration :
une nouvelle commande sera donc récupérée au rafraîchissement automatique de la vue.

Aucune migration SQL n'est nécessaire.
