# Fiabilisation Jeux V2

Correctifs inclus :
- suppression du type Escape Game ;
- Trivial avec catégories libres : les catégories sont définies directement sur les questions (ex. Star Fruits, Variétés, Métiers, Histoire de l'entreprise) ;
- validation d'un Trivial seulement s'il contient au moins 2 catégories et une catégorie sur chaque question ;
- plateau Trivial dynamique selon les catégories réellement créées ;
- récompense de jeu attribuable une seule fois par utilisateur et par jeu, même si le jeu est rejoué ;
- attribution des points atomique côté Supabase et transaction datée ;
- pronostics enregistrés côté serveur avec contrôle réel de la date de clôture ;
- droits d'écriture des jeux réservés aux administrateurs ;
- écriture directe des pronostics bloquée pour les utilisateurs ;
- Objets cachés : coordonnées calculées sur l'image réelle et non sur le conteneur 16:9 ;
- Chronologie : boutons monter/descendre sur mobile + suppression du tri mutant dans l'éditeur ;
- vue Jeux : suppression du chargement inutile de 500 pronostics.

## Migration Supabase obligatoire
Exécuter une seule fois `supabase/game_module_hardening_migration.sql` dans le SQL Editor Supabase après le déploiement du code. Sans cette migration, les deux RPC `award_game_points` et `submit_game_prediction` n'existent pas.
