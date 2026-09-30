# Star Com'Unity V1.5.3 — lot recette V1.5

Base : V1.5.2 validée.

## Corrections / améliorations intégrées
- Équipe : ouverture par défaut sur Organigramme, ordre Organigramme → Services → Liste.
- Messagerie : modification et suppression logique de ses propres messages, indicateur « modifié ».
- Événements : date de début + date de fin, contrôle de cohérence, affichage sur chaque jour couvert.
- Célébrations : anniversaires du mois courant, fil des célébrations limité aux 6 plus récentes.
- Administration utilisateurs : champ date d’anniversaire.
- Social : commentaires avec emoji, image/GIF, modification/suppression ; médias de posts toujours servis via Storage (limite applicative 100 Mo).
- Temps forts : espacement et grille Pronostics/animations compactés.
- Paramètres : mot de passe via Supabase Auth conservé et vérifié ; téléphone/poste persistés ; confidentialité email/téléphone persistée ; option anniversaire retirée ; onglet Thème retiré (donc plus de faux dark mode / taille de texte non appliquée).

## Supabase
Exécuter `supabase/v15_final_recipe_migration.sql` une fois avant les tests.
