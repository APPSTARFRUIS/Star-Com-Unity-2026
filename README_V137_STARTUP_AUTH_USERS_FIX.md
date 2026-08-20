# Star ComUnity V1.3.7 — Startup / Auth / Users

- Safari affiche l’écran de connexion au plus tard après 3 s, même si Supabase tarde.
- Suppression du auth.getUser() réseau au démarrage.
- Déduplication du chargement du profil courant.
- Déduplication globale de l’annuaire.
- Préchargement léger de l’annuaire + organisation après connexion.
- Équipe limite ses retries pour éviter les rafales Supabase.
- Connexion réutilise le même chargeur de profil.
- Aucun SQL.

Important : les URL de preview Vercel changent à chaque déploiement, donc Safari/Chrome repartent avec un localStorage/cache vide. Le domaine de production stable conservera ces caches.
