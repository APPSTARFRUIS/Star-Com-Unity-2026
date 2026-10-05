# V1.6.4 — Mode test notifications

- Ajout d'un onglet Administration > Notifications.
- Mode test activé par défaut.
- En mode test, les notifications navigateur/mobile sont bloquées pour tous les comptes sauf l'adresse de test configurée.
- Adresse de test initiale : ludivine.tramier@star-fruits.com.
- Les notifications internes restent inchangées.
- Aucun envoi e-mail automatique n'existe encore dans l'application : le réglage e-mail utilisateur reste une préférence préparatoire.

## SQL à exécuter une fois dans Supabase
`supabase/migrations/20261005103000_notifications_test_mode.sql`
