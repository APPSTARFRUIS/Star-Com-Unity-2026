# Module Pronostics — installation

1. Pousser l’ensemble des fichiers sur GitHub.
2. Dans Supabase > SQL Editor, ouvrir `supabase/sport_predictions_migration.sql`.
3. Exécuter le script une seule fois.
4. Laisser Vercel déployer le nouveau commit.

Le module conserve le type technique `Pari` pour rester compatible avec les données existantes, mais il est affiché comme **Pronostics** dans l’application.

Fonctions ajoutées : discipline, phases/tours, lieu, barème configurable, clôture automatique, modification avant clôture, résultats administrateur et classement par compétition.
