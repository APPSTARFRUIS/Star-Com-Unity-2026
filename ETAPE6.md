# Étape 6 — Batch Cooking professionnel + Admin sécurisé

## Batch Cooking

- Le moteur part désormais du déroulé réel de chaque recette.
- Les longues étapes sont découpées en actions culinaires élémentaires quand c'est possible.
- Chaque action est classée : mise en place, préparation, cuisson, assemblage, refroidissement ou conservation.
- L'ordre des étapes d'une recette est une dépendance stricte : aucune action ne peut être placée avant son prérequis.
- Les temps passifs sont identifiés afin de signaler les moments où une autre tâche peut être enchaînée.
- Les températures explicites sont détectées et conservées.
- Les portions réellement nécessaires au planning (y compris les restes) sont affichées dans le batch.
- Le batch ignore les faux doublons créés par les repas "restes".
- Les tâches cochées utilisent maintenant un identifiant stable et non leur simple libellé.

## Recettes : une source de vérité

Une recette conserve son déroulé utilisateur (`steps`) et PlanEat génère une version structurée (`structuredSteps`) utilisée par le moteur Batch. Lorsqu'une recette est enregistrée depuis l'Admin, cette structure est recalculée à partir du déroulé édité.

## Admin sécurisé

- Suppression du déverrouillage par 5 clics comme mécanisme d'autorisation.
- Nouveau rôle serveur via `public.admin_users`.
- L'onglet Admin n'apparaît que si Supabase confirme le rôle.
- Les recettes et essentiels administrés sont désormais partagés dans Supabase.
- Les politiques RLS autorisent l'écriture du catalogue uniquement aux administrateurs.
- Au premier déploiement du schéma, le premier compte permanent du projet est promu admin automatiquement.

## SQL obligatoire

Avant de tester cette version, exécuter `supabase/002_admin_catalog.sql` dans le SQL Editor Supabase.
