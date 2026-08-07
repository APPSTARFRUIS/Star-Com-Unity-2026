# Performance V3 — Star Com'Unity

Cette passe cible les lenteurs restantes sans modifier les fonctionnalités.

## Changements

- L'accueil n'attend plus le chargement complet des profils.
- Les profils en cache s'affichent immédiatement puis sont actualisés en arrière-plan.
- Messages et Célébrations utilisent également le cache profils sans bloquer l'écran.
- Realtime devient ciblé : un changement sur une table ne recharge plus systématiquement la rubrique ouverte si elle n'est pas concernée.
- Les vues impactées sont simplement invalidées et seront rafraîchies à leur prochaine ouverture.
- Le délai de regroupement Realtime passe de 1,2 s à 0,7 s pour les écrans réellement concernés.

## Effet attendu

- accueil plus rapide ;
- rubrique Équipe toujours instantanée avec le cache ;
- moins de requêtes Supabase inutiles ;
- baisse de la pression Disk IO ;
- navigation plus stable lorsque plusieurs événements Realtime arrivent ensemble.

Aucune migration SQL n'est nécessaire.
