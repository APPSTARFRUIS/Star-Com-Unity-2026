# V1.3.5 — Team / Safari stability

- Relance autonome des profils et de l'organisation dans la vue Équipe.
- Aucun passage par Administration nécessaire pour initialiser les profils.
- Conservation des caches locaux existants pour affichage immédiat.
- Retry unique avec contournement du cache pour les logos qui échouent sous Safari/iOS.
- Toutes les structures venant de org_entities restent indépendantes de la présence d'utilisateurs.
- Aucune migration SQL requise.
