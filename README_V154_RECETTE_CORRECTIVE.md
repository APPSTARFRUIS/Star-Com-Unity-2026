# Star Com'Unity V1.5.4 — recette corrective

Base : V1.5.2 validée.

Corrections / améliorations intégrées :
- Équipe : arrivée sur Organigramme par défaut.
- Messages : modification de ses messages, suppression logique, mention « modifié ».
- Événements : date de début + date de fin, contrôle de cohérence, affichage multi-jours.
- Célébrations : anniversaires du mois courant uniquement ; messages anniversaire du mois courant ; fil limité aux 6 célébrations non-anniversaire les plus récentes ; date anniversaire éditable dans l'admin.
- Social : commentaires avec emoji, image/GIF, modification/suppression ; pièces jointes média stockées dans Supabase ; vidéos non bloquées à 100 Mo côté application ; bucket média porté à 500 Mo par migration.
- Temps forts : Pronostics et temps forts regroupés dans une grille compacte ; carte Pronostics densifiée.
- Paramètres : mot de passe via Supabase Auth ; profil (téléphone/poste) persisté ; confidentialité email/téléphone persistée ; suppression de la confidentialité anniversaire ; suppression du thème sombre / onglet thème.

## SQL à exécuter
Dans Supabase SQL Editor, exécuter :
`supabase/20260930163000_v154_recipe_corrections.sql`

Le script est idempotent et peut être exécuté même si le précédent script V1.5.3 a déjà été lancé.

## Build
La tentative d'installation npm dans l'environnement de génération a dépassé le délai disponible. Un contrôle TypeScript de parsing des composants corrigés n'a remonté aucune erreur syntaxique ; les seules erreurs étaient les modules React absents faute d'installation des dépendances.
