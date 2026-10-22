# V1.6.41 — Hermione assistante

## Ajouts
- Rappels contextuels dans Ma Poire : parcours/quiz, sondages, pronostics, événements et notifications.
- Priorisation pour ne montrer qu’une action utile à la fois.
- Bouton d’action direct vers le module concerné.
- Anti-répétition : un rappel fermé est silencieux pendant 24 h sur le navigateur.
- Les rappels respectent l’audience entreprise des sondages et événements.
- Les phrases de personnalité V1.6.40 restent indépendantes des rappels utiles.

## Base de données
Aucune migration SQL supplémentaire.

## Validation locale
Le contrôle TypeScript ne peut pas être certifié dans l’environnement de préparation car les dépendances Node / @types/node ne sont pas installées. Le build Vercel reste le contrôle final.
