# Star Com’Unity V1.6.26 — Mobile data + responsive fix

Correctif de régression V1.6.25.

- repart de la V1.6.24 validée pour conserver le chargement mobile/PWA des données ;
- conserve les adaptations ciblées du lecteur PDF Ressources ;
- conserve l'adaptation mobile ciblée de la liste Documents ;
- retire les règles CSS globales V1.6.25 (`overflow-x:hidden`, `max-width:100%` appliqués globalement aux médias et contrôles), susceptibles d'interférer avec le rendu/hydratation mobile ;
- aucune modification Supabase, PWA, authentification ou logique de récupération des ressources/documents ;
- aucun SQL à exécuter.
