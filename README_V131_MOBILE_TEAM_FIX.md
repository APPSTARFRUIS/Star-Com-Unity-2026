# V1.3.1 — Correctif Équipe mobile

Cause identifiée : la rubrique Équipe pouvait être considérée comme déjà chargée alors qu'aucun profil n'avait réellement été récupéré sur un téléphone sans cache. La rubrique Classement rechargeait, elle, les profils, ce qui expliquait pourquoi les utilisateurs y apparaissaient.

Correctifs :
- 4 tentatives de récupération des profils dans Équipe ;
- cache utilisé immédiatement s'il existe ;
- une vue Équipe sans profil est considérée comme un échec et pourra être retentée ;
- une rubrique ayant échoué est retirée du cache `loadedViewsRef`.

Aucune migration SQL nécessaire.
