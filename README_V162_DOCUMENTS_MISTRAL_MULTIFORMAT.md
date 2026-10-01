# V1.6.2 — Documents intelligents Mistral + multiformat

Base : V1.6.1.

## Corrections
- L'analyse Documents n'utilise plus Gemini : elle passe par Mistral côté serveur via `/api/document-ai`.
- La clé Mistral reste côté Vercel (`MISTRAL_API_KEY`) et n'est jamais envoyée au navigateur.
- PDF texte et PDF scannés : OCR Mistral.
- Word DOC/DOCX : Document AI / OCR Mistral.
- PowerPoint PPT/PPTX : Document AI / OCR Mistral.
- Images PNG/JPG/WEBP/AVIF/GIF : OCR Mistral.
- Excel XLS/XLSX : extraction des feuilles/cellules puis synthèse Mistral.
- TXT/CSV/MD : lecture directe puis synthèse Mistral.
- Les erreurs API brutes ne sont plus affichées aux utilisateurs.
- Résultat inchangé : résumé, points clés, actions/échéances, texte indexable pour la recherche.

## Configuration
Dans Vercel > Project Settings > Environment Variables, la clé existante doit être disponible sous :
`MISTRAL_API_KEY`

Si votre clé Mistral existante porte un autre nom, ajoutez simplement `MISTRAL_API_KEY` avec la même valeur. Ne pas utiliser de préfixe `VITE_` pour cette clé secrète.

## SQL
Aucune nouvelle migration SQL après V1.6.1.
