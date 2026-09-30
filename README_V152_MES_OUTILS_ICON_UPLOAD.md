# V1.5.2 — Mes outils : upload des icônes

- Remplacement des champs « URL du logo » par un sélecteur de fichier.
- Upload dans le bucket Supabase Storage déjà utilisé par Star Com'Unity (`star-community-media`), dossier `external-tools/logos`.
- Formats image acceptés : PNG, JPG/JPEG, WebP, SVG et GIF.
- Aperçu immédiat, remplacement et suppression de l'icône.
- L'URL publique générée par Storage reste enregistrée automatiquement dans `external_tools.logoUrl` : aucune migration SQL supplémentaire.
- La persistance et le ciblage par entreprise de la V1.5.1 restent inchangés.
