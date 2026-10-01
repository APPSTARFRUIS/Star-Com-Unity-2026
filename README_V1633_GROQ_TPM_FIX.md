# V1.6.3.3 — Groq TPM fix

- Corrige le classement erroné des erreurs Groq 429 : elles ne sont plus affichées comme un problème de facturation.
- Limite la requête de synthèse à un volume compatible avec le plafond gratuit Groq de 8K TPM.
- Pour les documents longs, sélectionne des extraits répartis dans le début, le milieu et la fin au lieu d'envoyer jusqu'à 120 000 caractères en une seule requête.
- Limite la sortie à 900 tokens pour conserver une marge sous le plafond TPM.
- Ajoute les en-têtes de rate-limit Groq aux logs Vercel en cas d'erreur.
- Ne modifie pas l'extraction locale PDF/DOCX/PPTX/XLSX ni le fallback OCR Mistral.
- Aucun SQL supplémentaire.
