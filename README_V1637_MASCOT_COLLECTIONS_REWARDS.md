# V1.6.37 — Ma Poire : Collections & Récompenses

- Dressing utilisateur séparé en **Mon dressing / Mes collections / Mes souvenirs**.
- Collections avec progression d'objets obtenus.
- Distinction visible Acheté / Débloqué / Offert.
- Administration : nouvel onglet **Récompenses**.
- Règles automatiques disponibles : quiz/jeu réussi, parcours e-learning terminé, seuil de points gagnés, nombre de pronostics joués.
- Attribution automatique sécurisée via RPC `evaluate_mascot_rewards()` ; un objet ne peut être attribué qu'une fois par utilisateur.
- Origine technique de la mascotte rendue neutre : `ONBOARDING` remplace `STAR_T` pour ne pas dépendre du futur nom commercial STAR'T / Star'Together.
- Attribution manuelle conservée.

Migration à exécuter : `supabase/migrations/20261021162000_v1637_mascot_collections_rewards.sql`.
