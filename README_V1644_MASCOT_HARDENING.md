# V1.6.44 — Ma Poire bétonnée

## Séparation définitive des décors
- **Décor personnel** : objet `background` possédé par l'utilisateur (achat, gain, cadeau). Il est équipé dans le dressing.
- **Décor admin** : `mascot_experiences.decor_image_url`. Il n'appartient à personne et est imposé automatiquement selon dates/audience.
- Priorité de rendu : fond neutre → décor personnel → décor admin → poire → accessoires.
- À la fin d'un univers admin, le décor personnel réapparaît sans intervention utilisateur.

## Équipement multi-accessoires
Ajout de `equip_slot`, `stackable` et `layer_z` sur `mascot_items`.
- Tête, visage, corps, pieds et décor personnel sont des slots exclusifs par défaut.
- Les accessoires libres sont empilables par défaut.
- L'admin peut rendre un objet empilable et régler son ordre visuel.
- Équiper des lunettes ne retire plus un chapeau, des chaussures, un vêtement ou un accessoire libre.

## Univers admin
- Le client privilégie l'univers actif le plus récent déjà chargé, avec fallback RPC.
- Le décor admin est rendu comme une couche explicite au-dessus du décor personnel.
- L'humeur de l'univers reste appliquée tant que l'univers est actif.

## PWA
Le cache du service worker est versionné `v1.6.44-mascot` pour forcer la prise en compte du nouveau bundle après déploiement.

## Migration à exécuter
`supabase/migrations/20261022121500_v1644_mascot_system_hardening.sql`
