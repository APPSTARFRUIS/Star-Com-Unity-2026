# V1.6.46 - Nom personnel dans les notifications de Ma Poire

- La mini-notification utilise désormais le nom de la mascotte de l'utilisateur connecté.
- Fallback si aucune mascotte n'est nommée : `Madame Poire`.
- Le nom est résolu par `get_my_mascot_name()` afin de ne pas dépendre des politiques RLS de lecture du composant.

Migration à exécuter :
`supabase/migrations/20261022161500_v1646_mascot_nudge_name.sql`
