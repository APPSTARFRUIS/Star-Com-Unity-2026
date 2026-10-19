# Star Com'Unity V1.6.27 — Safari/iOS Data Fix

Correctif ciblé Safari/iOS pour Documents et Ressources.

- validation réseau de la session Supabase avant les requêtes authentifiées ;
- refresh de session si le token restauré par Safari n'est pas encore exploitable ;
- Ressources : timeout explicite + jusqu'à 8 reprises progressives ;
- Documents : 3 tentatives, timeout porté à 12 s, requête de secours conservée ;
- ne transforme plus prématurément une latence Safari en bibliothèque vide ;
- aucun changement SQL ;
- aucun changement fonctionnel des autres modules.
