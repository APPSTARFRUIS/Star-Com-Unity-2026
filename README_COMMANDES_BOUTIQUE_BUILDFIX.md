# Correctif build — Commandes Boutique

Le build échouait parce que `admin` avait été ajouté au switch de `fetchViewData`, alors que ce switch n'accepte que les valeurs de `ViewType` prévues pour le chargement des rubriques.

Correction :
- suppression du `case 'admin'` invalide dans `fetchViewData` ;
- ajout d'un chargement dédié lorsque `view === 'admin'` ;
- l'Administration charge toujours toutes les transactions `spend` ;
- la Boutique utilisateur continue de ne charger que l'historique du compte connecté.

Aucune migration SQL n'est nécessaire.
