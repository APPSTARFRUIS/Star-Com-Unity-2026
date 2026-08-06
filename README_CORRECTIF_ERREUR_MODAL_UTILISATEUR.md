# Correctif erreur persistante dans le formulaire utilisateur

L'erreur `Request body too large` restait stockée dans l'état du formulaire.
Elle s'affichait ensuite sur tous les utilisateurs, même sans nouvelle requête.

Corrections :
- effacement de l'erreur à chaque ouverture du formulaire ;
- effacement lors de l'annulation ;
- effacement dès qu'un champ est modifié ;
- réinitialisation de l'état d'enregistrement.

Aucune migration SQL n'est nécessaire.
