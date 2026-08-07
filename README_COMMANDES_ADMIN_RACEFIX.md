# Commandes Boutique — correctif d'écrasement asynchrone

Cause réelle du compteur à zéro :

1. l'API sécurisée `list_orders` chargeait correctement les commandes ;
2. juste après, `fetchAllData()` terminait une requête navigateur sur `transactions` ;
3. cette requête, filtrée par les règles RLS, revenait vide pour l'admin ;
4. `setTransactions([])` écrasait alors les commandes déjà chargées.

## Correction

- en vue Administration, `fetchAllData()` ne touche plus à l'état `transactions` ;
- les commandes admin restent alimentées uniquement par l'API sécurisée `list_orders` ;
- après le chargement global de l'Administration, `list_orders` est rappelé une dernière fois afin que l'état final soit déterministe ;
- la Boutique utilisateur conserve son historique privé normal.

Aucune migration SQL n'est nécessaire.
