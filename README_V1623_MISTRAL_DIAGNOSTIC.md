# V1.6.2.3 – Diagnostic Mistral

- Distingue précisément les erreurs OCR et synthèse.
- Distingue 401, 402/quota-crédit, 403, 429 et erreurs de format.
- Affiche un détail Mistral limité et sans secret à l’utilisateur.
- Journalise côté Vercel le statut, l’étape, le request ID et la réponse fournisseur pour diagnostic.
- Aucun changement SQL.
- `MISTRAL_API_KEY` reste côté serveur.
