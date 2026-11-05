# Star Com'Unity V1.6.52 — Connexion & latence

Correctif ciblé sur les déconnexions, les chargements qui tournent dans le vide et la lenteur générale.
Base : V1.6.51 BETA FIXES. Un seul fichier modifié : `App.tsx`. Aucune migration SQL.

## Causes identifiées

1. **Rechargement complet à chaque retour sur l'appli.** Supabase envoie un événement d'authentification
   (`TOKEN_REFRESHED` / `SIGNED_IN`) à chaque retour sur l'onglet ou l'app mobile, et toutes les heures.
   L'appli remplaçait alors l'objet `session`, ce qui détruisait et recréait le canal temps réel et relançait
   un rechargement complet de l'accueil et de la rubrique ouverte, pour chaque salarié.
2. **Blocage du verrou d'authentification.** Le profil était rechargé directement dans le callback
   `onAuthStateChange`. Supabase déconseille d'y appeler d'autres requêtes : elles peuvent rester figées
   jusqu'au timeout (6 s), d'où les écrans qui « tournent ».
3. **Temps réel trop large.** Chaque appareil connecté écoutait les changements de `profiles`, `comments`,
   `moods`, `transactions` et `advent_openings`. Chaque gain de points, commentaire ou humeur provoquait un
   rechargement chez tous les utilisateurs connectés, et Supabase devait vérifier les droits de chaque abonné.
4. **Messages privés diffusés à tous les appareils.** L'écoute des messages n'était pas filtrée : chaque
   message de l'entreprise passait par le serveur temps réel vers tous les connectés (filtré ensuite par les
   règles RLS, mais coûteux).

## Changements

- Les événements d'authentification ne mettent à jour l'état que si l'utilisateur change réellement
  (connexion, déconnexion, changement de compte). Le jeton reste géré automatiquement par le client Supabase.
- Le chargement du profil est différé hors du callback d'authentification.
- Le canal temps réel est créé une seule fois par utilisateur connecté (références stables), et n'est plus
  recréé à chaque rafraîchissement de jeton.
- `profiles`, `comments`, `moods`, `transactions`, `advent_openings` restent en temps réel, mais la ligne
  reçue est appliquée directement à l'écran (nouveau commentaire, nouveaux points, nouvelle humeur…) au lieu
  de déclencher un rechargement complet de la rubrique chez chaque utilisateur connecté.
- Profils : seuls les champs publics (points, nom, avatar, service, société, fonction, anniversaire) sont
  appliqués depuis le temps réel.
- Messages : chaque utilisateur n'écoute plus que ses propres conversations (`receiver_id` / `sender_id`).
- Filet de sécurité : une rubrique est rechargée à l'ouverture si ses données ont plus de 2 minutes.

## Ce qui reste en temps réel

Tout ce qui l'était en V1.6.51 : notifications, messages, posts, commentaires, points, humeurs, commandes,
calendrier de l'Avent, événements, sondages, newsletters, célébrations, idées, documents, bien-être,
boutique, jeux, animations.

## Effet visible pour les utilisateurs

- Plus de rechargement complet en revenant sur l'appli.
- Les mises à jour restent instantanées, sans écran qui se recharge.

## Déploiement

Pousser le contenu du ZIP sur la branche `main` comme d'habitude. Aucune migration SQL.

## Pistes suivantes (non incluses)

- Points : remplacer la lecture puis réécriture côté navigateur par une fonction SQL d'incrément atomique.
- Notifications : les triggers créent une ligne par salarié à chaque publication ; à grande échelle,
  préférer une notification « globale » lue par tous.
- Vérifier la région du projet Supabase (Francfort ou Paris recommandés pour des utilisateurs en France).
