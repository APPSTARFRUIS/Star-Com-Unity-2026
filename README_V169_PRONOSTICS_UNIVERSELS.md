# Star Com'Unity V1.6.9 — Pronostics universels

Base : V1.6.8.

## Ajouts
- Pronostics multi-univers : football, rugby, tennis, basket, handball, F1, cyclisme, JO, question mystère, autre.
- 4 formats : score exact, vainqueur/résultat, question à choix, réponse numérique.
- Statut utilisateur visible : pronostic joué et possibilité de revoir/modifier avant clôture.
- Après clôture, le pronostic reste consultable.
- Après saisie du résultat par l'admin : résultat officiel, points gagnés et classement.
- Classement par compétition conservé et alimenté par les résultats.
- Compatibilité avec les anciens pronostics de score : absence de `predictionFormat` = `score`.

## SQL À EXÉCUTER
Exécuter une seule fois dans Supabase SQL Editor :
`supabase/migrations/20261013170000_universal_predictions.sql`

La migration est idempotente (`create or replace function`) et ne modifie aucune table existante.
