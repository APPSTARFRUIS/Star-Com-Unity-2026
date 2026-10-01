# V1.6.3.6 — Image de couverture des Ressources

Correctif ciblé sur Administration > Ressources.

- Le champ « Image de couverture (URL) » est remplacé par un chargement d'image.
- L'image est envoyée dans le bucket Storage existant `star-community-media`, dossier `resources/covers`.
- L'URL publique générée est enregistrée automatiquement dans `thumbnail_url` : aucun changement de schéma SQL.
- Aperçu immédiat de la couverture.
- Possibilité de remplacer ou supprimer l'image avant publication.
- Le bouton Publier reste désactivé pendant le téléversement.
- Aucun autre comportement de Ressources & Jeux n'est modifié.
