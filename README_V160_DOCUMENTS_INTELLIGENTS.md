# V1.6.0 — Documents intelligents, étape 1

Base : V1.5.9 validée.

## Ajouts
- Analyse à la demande d'un PDF texte ou d'un fichier texte.
- Résumé strictement fondé sur le contenu du document.
- Points clés.
- Actions / décisions / échéances uniquement lorsqu'elles sont explicitement présentes.
- Conservation du texte extrait pour la recherche.
- Recherche étendue au nom, résumé, points clés, actions et contenu extrait.
- Aucune modification de la bibliothèque documentaire existante, de ses catégories, audiences, aperçus ou téléchargements.

## Migration
Exécuter `supabase/20261001170000_v160_document_intelligence.sql` avant le déploiement.

## Limite volontaire de cette étape
Pas d'OCR : un PDF scanné sans couche texte n'est pas analysé. Les formats Office ne sont pas encore extraits automatiquement.
