# V1.6.63
Menu : Mes outils et Notifications dans Mon espace ; cloche permanente desktop/mobile.
Email : file serveur, uniquement nouvelles newsletters, sondages et temps forts, compte de test et préférences respectés. Aucun historique envoyé. Push et Hermione inchangés.
1. Exécuter supabase/migrations/20261125180000_v1663_email_queue.sql.
2. Pour activer les emails : vérifier un domaine expéditeur Resend, créer une clé API et configurer les secrets Supabase RESEND_API_KEY, NOTIFICATION_FROM, NOTIFICATION_APP_URL, NOTIFICATION_WORKER_SECRET (secret aléatoire fort).
3. Déployer dispatch-notification-email via Supabase CLI (supabase functions deploy dispatch-notification-email --no-verify-jwt ; la fonction vérifie son propre secret). Configurer un appel POST planifié toutes les 2 minutes via Supabase Cron/HTTP, avec x-worker-secret stocké dans Vault, jamais dans le code client. Tester manuellement avant de planifier.
4. Activer Email dans les préférences du compte de test et publier un nouveau contenu éligible. Contrôler la file dans SQL Editor et la réception. Aucun envoi aux autres salariés ; aucune généralisation push.
