# Star ComUnity V1.3 — création USER + centre de notifications

## Création ouverte aux utilisateurs
Tous les utilisateurs authentifiés peuvent désormais :
- créer un événement ;
- ajouter un document ;
- créer un sondage / formulaire ;
- publier une célébration.

Pour Documents / Événements / Sondages, un USER peut choisir :
- Commun à tous ;
- son entreprise.

Il ne peut pas cibler arbitrairement une autre entreprise.
ADMIN / MODERATEUR conservent toutes les audiences.

## Modération
La suppression reste réservée à ADMIN / MODERATEUR.
Le SQL renforce cette règle côté Supabase, pas seulement dans l'interface.

## Notifications
Le centre de notifications propose désormais les filtres :
- Toutes
- Non lues
- Messages
- Social
- Événements
- Documents
- Sondages
- Idées
- Newsletter
- Célébrations
- Jeux
- Temps forts
- Points

Les filtres sont scrollables horizontalement sur mobile.

## SQL obligatoire
Après un build Vercel réussi, exécuter :
`supabase/user_content_creation_v13_migration.sql`
