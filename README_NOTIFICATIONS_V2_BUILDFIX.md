# Correctif build Notifications V2

Le build échouait car un ancien objet `NotificationSettings` était encore présent dans `Settings.tsx`.

Correction :
- tous les fallbacks utilisent maintenant les 13 clés de `NotificationSettings`, y compris :
  `inApp`, `newsletters`, `celebrations`, `highlights`, `points`.

Aucune nouvelle migration SQL n'est nécessaire.
Après un build Vercel réussi, exécuter `supabase/notifications_v2_migration.sql` si ce n'est pas déjà fait.
