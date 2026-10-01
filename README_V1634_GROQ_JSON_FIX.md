# V1.6.3.4 — Groq sans JSON forcé

- Suppression de `response_format: json_object`, responsable du HTTP 400 `Failed to generate JSON`.
- Groq répond désormais en texte structuré avec trois marqueurs simples : `SUMMARY:`, `KEY_POINTS:`, `ACTIONS:`.
- Parsing robuste côté serveur ; une réponse imparfaite ne fait plus échouer toute l'analyse.
- Compatibilité conservée si Groq renvoie spontanément du JSON.
- Aucun changement SQL.
- Aucun changement sur l'extraction locale PDF/DOCX/PPTX/XLSX ni sur l'OCR de secours.
