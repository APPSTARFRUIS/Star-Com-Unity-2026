# Star Com'Unity V1.6.18 — Préférences de notifications

- Les préférences déjà présentes dans Paramètres > Notifications deviennent réellement indépendantes par canal.
- Dans Star Com'Unity : masque le centre/compteur si `inApp` est désactivé.
- Push bureau/mobile : respecte désormais strictement le canal correspondant, y compris en mode test.
- Les préférences par type (messages, événements, sondages, newsletters, documents, idées, jeux/e-learning, etc.) restent appliquées par le moteur SQL.
- Email : préférence conservée mais aucun envoi n'est effectué tant qu'aucun fournisseur email n'est raccordé.
- Mode test inchangé : les push externes restent limités à ludivine.tramier@star-fruits.com.

## Migration à exécuter
`supabase/migrations/20261014214500_notification_channel_preferences.sql`
