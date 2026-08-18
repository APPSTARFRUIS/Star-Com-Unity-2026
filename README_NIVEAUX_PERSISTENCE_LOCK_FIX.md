# Correctif progression Jeux — persistance + verrouillage

Le problème observé (niveau 3 jouable immédiatement et absence du libellé parcours/niveau)
indique que certains jeux étaient chargés comme des jeux libres parce que leur métadonnée
`learning_path` n'était pas disponible/persistée correctement.

Corrections :
- vérification de l'enregistrement `learning_path`, `level_number`, `level_title`, `passing_score`
  immédiatement après création ;
- erreur visible si Supabase n'a pas sauvegardé les métadonnées ;
- fallback de lecture pour récupérer un parcours Star ComUnity sur les jeux possédant déjà
  un numéro/thème de niveau ;
- niveau > 1 sans parcours = verrouillé par défaut côté interface ;
- comparaison des noms de parcours normalisée (casse + espaces) ;
- séquence stricte N -> N-1 ;
- trigger Supabase empêchant à l'avenir un niveau > 1 sans parcours ;
- réparation SQL des jeux existants ayant un thème/niveau mais un parcours vide ;
- bouton `Progression` dans l'admin pour corriger parcours / niveau / thème / score d'un jeu existant.

SQL à exécuter après déploiement :
`supabase/game_learning_progression_persistence_fix.sql`
