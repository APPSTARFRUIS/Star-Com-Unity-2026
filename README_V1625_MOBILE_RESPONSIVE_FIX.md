# Star Com’Unity V1.6.25 — Responsive mobile

Correctifs ciblés sur les écrans mobiles constatés :

- lecteur PDF Ressources : canvas limité à la largeur disponible, commandes réorganisées sur petit écran, modal plein écran sur mobile ;
- Documents : suppression du débordement horizontal de la page, tableau adapté au mobile (colonnes secondaires masquées, noms de fichiers cassables, actions compactes) ;
- aperçu Documents : modal plein écran sur mobile et barre d’actions simplifiée ;
- garde-fous responsive globaux pour empêcher les médias et contrôles de dépasser la largeur de l’écran ;
- aucun changement de données, Supabase, PWA, notifications ou logique métier ;
- aucun SQL à exécuter.

Le build local a été tenté. TypeScript s’arrête sur l’erreur d’environnement déjà connue : TS2688, définition de types `node` indisponible.
