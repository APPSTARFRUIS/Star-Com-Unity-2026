# Star Com'Unity V1.6.51 — Correctifs bêta-test

- E-learning : attribution sécurisée des points via `complete_game`, sans réautoriser les modifications directes du solde.
- Célébrations : synchronisation realtime des likes (UPDATE).
- Messages : rafraîchissement immédiat de la vue/conversation lors d'un nouveau message, en complément de l'insertion optimiste.
- E-learning : libellé `Quiz & parcours` plus explicite à la place de `Jeux` dans le sélecteur Ressources / Quiz.
- Routage V1.6.50 conservé : rappels quiz/parcours vers E-learning ; pronostics/animations vers Jeux.

## SQL à exécuter
`supabase/migrations/20261104190000_v1651_elearning_points_security_fix.sql`
