# Module Animations administrable

## Ce qui change

La création des animations est désormais placée dans :

`Administration > Animations`

Chaque type possède son propre éditeur :

- Compte à rebours : date cible, couleur, bouton et affichage sur l'accueil.
- Tirage au sort : participation gratuite ou en points, nombre de gagnants, lots et conditions.
- Jeu concours : question, type de réponse, choix possibles, bonne réponse et récompense.
- Calendrier de l'Avent : éditeur indépendant pour chacune des 24 cases.
- Mission ponctuelle : liste d'objectifs et récompense.
- Saison : modules inclus, couleur et archivage automatique.

La rubrique `Classements` reste visible par les utilisateurs pour consulter les classements, les top contributeurs et participer aux animations publiées.

## Supabase

Exécuter une fois le fichier :

`supabase/engagement_module_migration.sql`

Il peut être relancé sans supprimer les animations existantes. Il ajoute simplement le type `season` à la contrainte existante si nécessaire.
