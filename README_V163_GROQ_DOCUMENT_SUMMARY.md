# V1.6.3 — Synthèse Documents via Groq

- La synthèse des documents utilise désormais `GROQ_API_KEY` côté serveur.
- Modèle par défaut : `llama-3.1-8b-instant` (modifiable avec `GROQ_DOCUMENT_MODEL`).
- Les PDF contenant du texte continuent d’être extraits localement avec PDF.js.
- Excel/TXT/CSV/Markdown restent extraits localement.
- Mistral n’est conservé que pour l’action OCR de secours des images/PDF scannés et autres formats nécessitant cette extraction.
- Aucun SQL supplémentaire.
- Les clés restent côté fonction Vercel et ne sont pas envoyées au navigateur.
