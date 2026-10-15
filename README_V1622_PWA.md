# V1.6.22 — PWA / installation Star Com'Unity

Base : V1.6.21 Dashboard statistiques Admin validée.

## Ajouts
- manifest PWA complet (`public/manifest.webmanifest`)
- icônes 192, 512, maskable et Apple Touch
- métadonnées PWA/iOS dans `index.html`
- service worker enrichi avec cache de l'enveloppe applicative et navigation network-first
- lancement en mode `standalone` après installation
- conservation du Web Push existant dans le même service worker

## Important
Le cache PWA ne remplace pas Supabase : les données métier restent en ligne. En cas de coupure réseau, l'enveloppe de l'application peut se charger, mais les données nécessitant Supabase peuvent rester indisponibles jusqu'au retour de la connexion.

## SQL
Aucun SQL à exécuter.

## Déploiement
Pousser normalement sur GitHub/Vercel. Une fois le déploiement chargé, le navigateur peut proposer l'installation de l'application. Sur iPhone/iPad, utiliser Safari > Partager > Sur l'écran d'accueil.
