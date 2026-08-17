# Star ComUnity — Parcours pédagogiques & niveaux V1

Cette version transforme la partie Jeux en moteur de progression de type e-learning,
sans en faire un LMS lourd.

## Côté administration
Pour chaque jeu, l'admin peut désormais définir :
- un **Parcours** (champ libre et réutilisable) ;
- un **numéro de niveau** ;
- un **nom de niveau** ;
- un **score minimum de validation** entre 0 et 100 %.

Un jeu dont le champ Parcours reste vide demeure un jeu libre classique.

Plusieurs jeux peuvent appartenir au même niveau.
Le niveau suivant ne se déverrouille que lorsque **tous les jeux actifs du niveau précédent**
ont été validés.

## Côté utilisateur
La page Jeux affiche :
- les parcours disponibles ;
- leur pourcentage de progression ;
- le nombre de jeux validés ;
- les niveaux accessibles, terminés ou verrouillés ;
- un badge de niveau sur chaque jeu ;
- le bouton `Niveau verrouillé` tant que le niveau précédent n'est pas terminé.

Un jeu déjà validé reste rejouable, mais ses points ne sont attribués qu'une seule fois.

## Validation et score
- Quiz : le score réel en % est envoyé au serveur.
- Memory / Trivial / Chronologie / Objets cachés : réussite = 100 %.
- `passing_score = 0` signifie que terminer le jeu suffit.
- Pour un Quiz de validation, l'admin peut par exemple choisir 70 ou 80 %.

## Sécurité / persistance
La progression est enregistrée dans `public.game_completions`.
La fonction SQL `complete_game()` :
- mémorise le meilleur score ;
- valide le jeu selon son seuil ;
- attribue les points une seule fois ;
- met à jour les points et l'historique de manière centralisée.

## Étape obligatoire
Après le déploiement Vercel, exécuter UNE FOIS dans Supabase > SQL Editor :

`supabase/learning_paths_levels_migration.sql`

Les jeux existants restent des jeux libres : rien n'est verrouillé tant que l'admin
ne leur attribue pas un Parcours.
