# Star ComUnity V1.3.9 — Documents / Événements mobile

Correctifs :
- Événements ne dépend plus du chargement de l'organisation.
- Documents reste indépendant de l'organisation.
- 2 tentatives maximum sur les listes Documents et Événements.
- Timeouts courts, sans rafale de requêtes.
- Les listes ne chargent que les colonnes utiles.
- Un échec réseau n'est plus mémorisé comme une vue « déjà chargée ».
- Sur Safari/iPhone, revenir dans Documents ou Événements relance donc réellement la récupération après un échec.
- Le champ lourd `documents.data` n'est toujours jamais récupéré dans la liste.
- Aucune migration SQL.
