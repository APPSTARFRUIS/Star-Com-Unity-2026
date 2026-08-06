# Correctif avatar existant

Cette version corrige le blocage lors de la modification d'un utilisateur possédant déjà une photo lourde.

- Une photo existante en base64 n'est plus renvoyée à l'API.
- Elle est conservée côté serveur lors de la mise à jour.
- L'utilisateur peut modifier entreprise, service, rôle ou mot de passe sans toucher à la photo.
- Le message "photo trop volumineuse" apparaît uniquement si une nouvelle photo lourde est réellement choisie.

Aucune migration SQL supplémentaire n'est nécessaire.
