# Star ComUnity V1.3.8 — Documents loading fix

Diagnostic :
la rubrique Documents attendait `fetchOrganization()` avant d'interroger la table `documents`.
Quand les structures étaient lentes à remonter, la liste des documents restait donc vide sur PC et iPhone.

Correctifs :
- chargement Documents indépendant des tables organisationnelles ;
- organisation chargée en arrière-plan seulement pour le sélecteur d'audience ;
- timeout explicite de 7 s sur la liste ;
- requête de secours sans `storage_path` si nécessaire ;
- aucun téléchargement du champ lourd `data` lors de la liste ;
- erreurs d'ajout document maintenant affichées au lieu d'être silencieuses ;
- rafraîchissement Documents uniquement après un insert réussi.

Aucune migration SQL.
