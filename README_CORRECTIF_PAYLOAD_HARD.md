# Correctif définitif de taille de requête utilisateur

Le corps envoyé à `/api/admin-users` est maintenant strictement limité aux champs texte indispensables.

- aucun avatar n'est envoyé ;
- aucun objet `notification_settings` n'est envoyé ;
- chaque chaîne est tronquée à une longueur raisonnable ;
- un garde-fou bloque toute requête dépassant 50 Ko ;
- l'avatar et les préférences existants sont conservés côté serveur.

Aucune migration SQL supplémentaire n'est nécessaire.
