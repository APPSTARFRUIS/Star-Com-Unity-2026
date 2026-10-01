# Star Com'Unity V1.6.2.4 — PDF texte sans OCR systématique

Correctif ciblé Documents intelligents :

- les PDF sont d'abord lus localement avec PDF.js ;
- si le PDF contient suffisamment de texte natif, aucun appel Mistral OCR n'est effectué ;
- seul le texte extrait est envoyé à Mistral pour produire la synthèse ;
- l'OCR Mistral reste le fallback pour les PDF réellement scannés / sans texte exploitable ;
- Excel/TXT/CSV conservent leur extraction locale existante ;
- Word, PowerPoint et images conservent l'extraction documentaire Mistral de la V1.6.2.x.

Aucun nouveau SQL. La variable serveur MISTRAL_API_KEY reste inchangée.
