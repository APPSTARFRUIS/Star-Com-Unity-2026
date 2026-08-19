# Star ComUnity — Audiences centralisées V1

## Modules cloisonnés
- Documents
- Sondages
- Événements
- Boîte à idées

## Règle
Chaque contenu possède une audience :
- `Commun à tous`
- ou une structure précise.

Un utilisateur voit :
- tous les contenus `Commun à tous` ;
- les contenus de son entreprise ;
- un administrateur voit tout.

## Boîte à idées
Un utilisateur standard peut choisir :
- Commun à tous ;
- Mon entreprise.

Un administrateur peut choisir n'importe quelle structure.

## Notifications
Les notifications des nouveaux :
- documents ;
- sondages ;
- événements ;
- idées

sont envoyées uniquement aux collaborateurs de l'audience concernée.
Les préférences notifications existantes sont respectées pour événements/sondages.

## Global, donc non modifié
- Newsletter
- Jeux / e-learning

## Sécurité
Le même cloisonnement est appliqué côté Supabase avec RLS, pas seulement masqué dans l'interface.

## Données historiques
Les anciens documents, sondages, événements et idées sont considérés `Star Fruits`
par défaut, puisque l'application était initialement Star Fruits.

## SQL obligatoire
Après le déploiement Vercel, exécuter une seule fois :

`supabase/audiences_centralisees_v1_migration.sql`
