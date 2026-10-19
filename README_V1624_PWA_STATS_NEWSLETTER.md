# Star Com'Unity V1.6.24 — PWA PC + Dashboard utilité + lecture newsletters

- Ressources PWA PC : attente explicite de la restauration de session Supabase + retries + rechargement à INITIAL_SESSION/SIGNED_IN/TOKEN_REFRESHED.
- Dashboard Admin recentré sur l'utilité : taux d'engagement global, utilisateurs actifs, portée newsletters, interactions, contenus, usages.
- Suppression du bloc principal « utilisateurs par entité ».
- Newsletter : suivi des ouvertures uniques et répétées via `newsletter_reads`.
- Une newsletter est considérée comme « lue » lorsqu'elle est ouverte (pas de prétention sur lecture complète).
- Migration à exécuter : `supabase/migrations/20261019094500_newsletter_reads.sql`.
