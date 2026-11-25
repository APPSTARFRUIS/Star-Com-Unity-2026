# V1.6.64 — Activation pilote email
La migration V1.6.63 doit déjà être exécutée. Aucun nouveau SQL obligatoire. Aucun changement client.
1. Resend : vérifier un domaine expéditeur autorisé par votre entreprise, créer une clé d'envoi.
2. Supabase > Edge Functions > Secrets : RESEND_API_KEY, NOTIFICATION_FROM (adresse vérifiée), NOTIFICATION_APP_URL (URL HTTPS stable), NOTIFICATION_WORKER_SECRET (32 caractères aléatoires minimum). Ne jamais placer ces secrets dans GitHub.
3. Déployer le dossier supabase/functions/dispatch-notification-email via CLI : `supabase functions deploy dispatch-notification-email --no-verify-jwt`. La fonction exige le secret dédié. Un push GitHub seul ne déploie pas cette fonction.
4. Vérifier app_config : notifications_test_mode=true et notifications_test_email = votre compte. Activer Email dans les préférences du compte.
5. Appeler POST sur https://<project-ref>.supabase.co/functions/v1/dispatch-notification-email avec Content-Type: application/json et x-worker-secret: votre secret. Corps {"action":"check"} pour contrôler la configuration, puis {"action":"test"} pour envoyer un seul email au compte test. accepted=true signifie accepté par Resend, pas forcément livré. Vérifier la boîte de réception et les logs Resend.
6. Publier une nouvelle newsletter, un sondage ou un temps fort destiné au compte test. Appeler avec {"action":"dispatch"}. Vérifier les compteurs et la réception.
7. Après validation, programmer un POST toutes les deux minutes via Supabase Cron/HTTP avec le corps {"action":"dispatch"} et le secret conservé dans Vault. Ne pas programmer avant le test.
Diagnostic SQL (lecture seule) : SELECT status, count(*) FROM public.notification_email_queue GROUP BY status;
Les notifications existantes ne sont pas renvoyées. Les envois restent strictement limités au compte de test. Les autres canaux ne changent pas.
