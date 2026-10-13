# V1.6.7 — Ressources : lecture des documents

Correctif ciblé uniquement sur `components/ResourcesView.tsx`.

- Le bouton « Ouvrir le document » ne navigue plus directement vers l'URL Storage (ce qui pouvait déclencher un téléchargement).
- Le document est récupéré puis affiché dans un lecteur intégré à Star Com'Unity via une URL Blob PDF.
- Fermeture par le bouton × ou clic sur l'arrière-plan.
- Aucun changement de schéma SQL.
- Aucun changement des jeux, quiz, ressources, notifications ou autres modules.

Build local : non certifié dans l'environnement de génération car les dépendances npm ne sont pas présentes dans le ZIP source et leur installation a expiré. Aucune nouvelle dépendance n'a été ajoutée.
