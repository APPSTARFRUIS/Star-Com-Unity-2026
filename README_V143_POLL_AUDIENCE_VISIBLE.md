# Star ComUnity V1.4.3 — Audience visible dans les sondages

Le ciblage existait déjà techniquement (`polls.audience_companies`) et était bien utilisé par les règles de visibilité / notifications, mais le sélecteur était caché dans l'onglet Paramètres.

Cette version :
- affiche le choix d'audience directement dans l'onglet Questions, sous le titre du sondage ;
- conserve aussi le sélecteur dans Paramètres ;
- permet : Commun à tous / une structure précise selon les droits de l'utilisateur ;
- affiche l'audience sur chaque carte de sondage ;
- remet l'audience à "Commun à tous" lors de la création d'un nouveau sondage ;
- remet également ce choix à zéro après publication ;
- ne modifie ni la base ni les triggers de notifications.

Aucune migration SQL nécessaire.
