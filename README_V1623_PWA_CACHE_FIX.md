# V1.6.23 — Correctif cache PWA / données dynamiques

Base : V1.6.22 PWA.

## Correctif
- Le service worker ne sert plus les fichiers applicatifs en cache-first.
- Navigation et fichiers runtime passent en network-first avec `cache: no-store`.
- Les appels Supabase, Storage, API et tout domaine externe ne sont jamais interceptés par le service worker.
- Le cache V1.6.22 est supprimé automatiquement à l'activation du nouveau service worker.
- Le cache reste uniquement un secours hors-ligne pour l'enveloppe/fichiers déjà récupérés.
- Web Push conservé.

## SQL
Aucun SQL à exécuter.

## Après déploiement
Fermer complètement la PWA puis la rouvrir. Le nouveau service worker s'active et purge l'ancien cache. Si une fenêtre PWA était restée ouverte pendant le déploiement, la fermer puis la relancer.
