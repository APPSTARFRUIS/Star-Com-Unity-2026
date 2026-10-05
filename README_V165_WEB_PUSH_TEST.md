# V1.6.5 — Web Push test

Cette version ajoute un vrai test Web Push, verrouillé par le mode test V1.6.4.

## 1. SQL Supabase
Exécuter `supabase/migrations/20261005111500_push_subscriptions.sql`.

## 2. Variables Vercel
Ajouter :
`VITE_VAPID_PUBLIC_KEY=BDBjEAKo4CyE5_vn4eiZlfKSfUC4I28SP8znvBBwh5qbIE31VdaUbeFwOanAyP9YHXINAxerXID1L6JAfMfaEDg`
Puis redéployer.

## 3. Secrets Supabase Edge Functions
Ajouter :
`VAPID_PUBLIC_KEY=BDBjEAKo4CyE5_vn4eiZlfKSfUC4I28SP8znvBBwh5qbIE31VdaUbeFwOanAyP9YHXINAxerXID1L6JAfMfaEDg`
`VAPID_PRIVATE_KEY=Ch8R9lV5yzJXl2tn36uNQWAwIXOgIm77mLyHe7kCvRk`

## 4. Déployer la fonction
Déployer `supabase/functions/send-push-test` avec vérification JWT active.

## 5. Test
Administration > Notifications > `Activer et envoyer un push test`.
Le navigateur demande l'autorisation la première fois. Le push doit ensuite apparaître même si l'onglet n'est pas au premier plan.

Le mode test doit rester activé. La fonction refuse l'envoi si le compte connecté ne correspond pas à l'adresse de test.
