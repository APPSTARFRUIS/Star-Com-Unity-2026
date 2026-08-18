# Organisation Groupe V2

Cette version remplace la logique “services globaux” par une vraie structure multi-entités.

- Star Group, Star Fruits, Star Export, Star PMP, AC Fruit, Eurostème sont des structures distinctes.
- Les actionnaires pépiniéristes se créent depuis Administration > Organisation exactement comme une nouvelle structure.
- Chaque structure possède ses propres services. Les filiales autres que Star Fruits démarrent volontairement sans service.
- Chaque utilisateur est rattaché à une structure puis à un service de cette structure.
- Logos administrables par structure.
- Membres / contacts externes administrables pour les actionnaires pépiniéristes.
- Organigramme interactif : Star Group -> structure -> salarié/membre -> fiche.
- Export PDF interactif via la boîte d’impression du navigateur : la première page est le Groupe, puis une page par structure avec liens internes.
- Documents / Sondages / Événements : audience Commun à tous OU structure précise.
- Les anciens contenus restent Star Fruits par défaut.
- Newsletter et Jeux/e-learning restent communs à tous.
- La migration remplace les policies SELECT permissives connues et adapte les notifications événements/sondages à l’audience.

Après le déploiement, exécuter une seule fois : `supabase/organization_group_v2_migration.sql`.
