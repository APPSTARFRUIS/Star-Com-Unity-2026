# V1.6.3.2 — DOCX / PPTX local extraction

- DOCX: extraction locale du texte Open XML (document, en-têtes, pieds de page, notes) via JSZip.
- PPTX: extraction locale du texte des diapositives via JSZip.
- Aucun appel Mistral OCR pour les fichiers .docx et .pptx.
- Groq reste utilisé pour la synthèse.
- Mistral OCR reste uniquement en secours pour images, PDF réellement scannés et anciens formats binaires .doc/.ppt.
- Aucun SQL supplémentaire.
