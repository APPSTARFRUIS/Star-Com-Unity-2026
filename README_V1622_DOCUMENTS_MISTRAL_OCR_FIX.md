# Star Com'Unity V1.6.2.2 — Correctif analyse Mistral

- Corrige l'analyse des documents stockés dans Supabase : le serveur Vercel récupère le fichier puis l'envoie à Mistral OCR en Base64, au lieu de demander à Mistral de relire directement une URL Supabase potentiellement privée/signée.
- Conserve `MISTRAL_API_KEY` côté serveur.
- Messages d'erreur Mistral rendus utiles (clé, quota/crédit, rate limit, format, fichier inaccessible), sans afficher de secret ni de payload brut.
- Aucun SQL supplémentaire.
- Excel reste extrait localement par l'application avant synthèse Mistral.
