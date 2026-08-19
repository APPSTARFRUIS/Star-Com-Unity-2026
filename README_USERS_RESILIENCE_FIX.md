# V3.3.1 — Correctif résilience utilisateurs

Le ZIP V3.3 « Membres fondateurs » ne modifiait que `TeamView.tsx`.
Le chargement des utilisateurs restait cependant dépendant d'une requête Supabase
incluant les champs enrichis `job_description` et `personal_note`.

Ce correctif rend l'annuaire résilient :

1. tentative de chargement complet ;
2. en cas d'échec, requête de secours avec uniquement les champs essentiels ;
3. en dernier recours, conservation du cache local existant ;
4. une réponse vide ponctuelle ne remplace plus un cache utilisateur valide.

Aucune modification SQL n'est nécessaire.
La logique « Membres fondateurs » de la V3.3 est conservée.
