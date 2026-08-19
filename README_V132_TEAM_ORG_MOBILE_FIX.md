# V1.3.2 — Équipe mobile / organisation

Le symptôme mobile montrait que l'organisation elle-même ne remontait pas : structure vide, services vides, organigramme réduit à Star Group, alors que Classements affichait les profils.

Correctifs : retry x4 sur org_entities/org_services/org_contacts, cache local organisation, fallback depuis user.company et user.department, et libellé Membres fondateurs.

Aucun SQL supplémentaire.
