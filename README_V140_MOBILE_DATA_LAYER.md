# Star ComUnity V1.4.0 — Mobile Data Layer

Objectif : arrêter les corrections module par module et fiabiliser les données critiques sur Safari/iPhone.

## Changements
- Cache local générique par rubrique légère.
- Documents, Événements et Newsletter affichent immédiatement le dernier cache disponible.
- Les requêtes réseau actualisent ensuite le cache.
- Si Safari a un timeout, le contenu déjà connu reste visible au lieu d'un écran vide.
- Préchargement progressif après connexion :
  1. Documents
  2. Événements
  3. Newsletter
- Préchargement séquentiel, jamais en rafale.
- Navigation vers une rubrique critique vide => refetch forcé.
- Une vue en échec n'est jamais figée comme "déjà chargée".
- Requêtes limitées aux colonnes utiles.
- Aucun chargement du champ lourd `documents.data` dans la liste.
- Pas de SQL.

## Pourquoi
Le comportement observé était cohérent avec un mélange de :
- latence Supabase actuelle,
- Safari plus sensible aux requêtes pendantes,
- vues mémorisées comme chargées,
- absence de cache par rubrique.

Cette version rend l'interface utilisable même si Supabase répond lentement.
