# V1.6.10 — Correctif affichage lecteur Ressources

- La modale de lecture PDF des Ressources est rendue via un portal React directement dans `document.body`.
- Elle n'est donc plus décalée/recouverte par la sidebar ou un conteneur parent transformé.
- Z-index dédié au lecteur.
- Aucun autre module ou comportement modifié.
- Aucun SQL.
