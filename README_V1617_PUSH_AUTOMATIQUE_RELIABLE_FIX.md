# V1.6.17 — Push automatique fiable en mode test

Correctif ciblé du pont notification interne -> Web Push.

- conserve le moteur de notifications V1.6.15 ;
- conserve le mode test et l'adresse autorisée configurée dans `app_config` ;
- ne modifie pas les destinataires des notifications internes ;
- ajoute un filet de sécurité côté compte de test : interrogation légère des nouvelles notifications toutes les 4 secondes ;
- chaque nouvelle notification du compte de test est transmise à `send-push-test` avec son `notification_id` ;
- le premier passage initialise le curseur sans renvoyer l'historique ;
- en cas d'échec du push, le curseur n'avance pas afin de permettre une nouvelle tentative ;
- le listener Realtime V1.6.16 est conservé pour l'envoi immédiat quand il est disponible.

Aucun SQL supplémentaire.
La fonction Supabase `send-push-test` de V1.6.16 doit rester déployée avec les secrets VAPID existants.
