# Optimisation Supabase / performances

Cette version réduit fortement les rafales de requêtes sans modifier les fonctionnalités.

## Modifications
- une seule vague de chargement à la fois ;
- délai minimal entre deux chargements complets automatiques ;
- regroupement des événements Realtime pendant 1,2 seconde ;
- le canal Realtime n'est plus recréé à chaque mise à jour du profil ;
- suppression du double chargement après connexion ;
- limites raisonnables sur les listes volumineuses ;
- conservation de l'ordre chronologique des messages ;
- cache local des profils pour afficher l'annuaire immédiatement ;
- les actions utilisateur forcent un rafraîchissement unique et protégé.

Aucune migration SQL n'est nécessaire.

Cette passe réduit la charge, mais une optimisation plus avancée pourra ensuite charger chaque rubrique uniquement à son ouverture.
