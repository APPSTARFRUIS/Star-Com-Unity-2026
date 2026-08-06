# Correctif taille de requête utilisateurs

Cette version corrige l'erreur Vercel :

`Request body too large (max 1048576 bytes)`

## Corrections
- l'API reçoit uniquement les champs utiles de l'utilisateur ;
- les objets complets de l'application ne sont plus sérialisés ;
- les avatars en base64 ne sont plus envoyés à l'API ;
- un message clair s'affiche si une photo locale est trop lourde ;
- les champs texte sont limités côté serveur.

Aucune migration SQL supplémentaire n'est nécessaire.
Les variables Vercel déjà configurées restent inchangées.
