# Star ComUnity V1.3.4 — Profiles stability fix

- suppression du double chargement `safeFields` + `richFields` introduit en V1.3.3 ;
- retour à une requête canonique `profiles.select('*')` ;
- maximum 2 tentatives, avec timeout 10 s et pause 750 ms ;
- conservation et réutilisation du dernier cache valide ;
- aucun tableau utilisateurs valide n'est remplacé par une réponse vide ;
- réduction de la pression Supabase, notamment sous Safari/iOS ;
- le même flux profils alimente Équipe, Classements, Messages et Administration.

Aucune migration SQL nécessaire.
