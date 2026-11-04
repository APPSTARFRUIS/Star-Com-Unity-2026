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
- Retrait de l'écoute temps réel sur `profiles`, `comments`, `moods`, `transactions`, `advent_openings`.
- Messages : chaque utilisateur n'écoute plus que ses propres conversations (`receiver_id` / `sender_id`).
- Pour compenser, une rubrique est rechargée à l'ouverture si ses données ont plus de 2 minutes.

## Ce qui reste en temps réel

Notifications personnelles, messages reçus et envoyés, nouveaux posts, événements, sondages, newsletters,
célébrations (et leurs likes), idées, documents, bien-être, boutique, jeux, animations.

## Effet visible pour les utilisateurs

- Plus de rechargement complet en revenant sur l'appli.
- Un nouveau commentaire ou un changement de points d'un collègue apparaît à la prochaine ouverture de la
  rubrique (au plus 2 minutes de décalage) au lieu d'instantanément.

## Déploiement

Pousser le contenu du ZIP sur la branche `main` comme d'habitude. Aucune migration SQL.

## Pistes suivantes (non incluses)

- Points : remplacer la lecture puis réécriture côté navigateur par une fonction SQL d'incrément atomique.
- Notifications : les triggers créent une ligne par salarié à chaque publication ; à grande échelle,
  préférer une notification « globale » lue par tous.
- Vérifier la région du projet Supabase (Francfort ou Paris recommandés pour des utilisateurs en France).
