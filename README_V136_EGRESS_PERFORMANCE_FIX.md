# Star Com'Unity V1.3.6 — Egress & performance fix

Correctif ciblé avant passage Supabase Pro.

## Changements
- Les listes de documents ne téléchargent plus la colonne `data` (anciens fichiers base64 potentiellement très lourds).
- Les nouveaux documents enregistrent aussi leur URL Storage dans `storage_path`.
- Les anciens documents restent compatibles : leur `data` n'est récupérée qu'au moment où l'utilisateur ouvre/télécharge le document.
- Les requêtes profils utilisent uniquement les colonnes nécessaires au lieu de `select('*')`.
- Les requêtes organisation (structures/services/contacts) utilisent uniquement les colonnes nécessaires.
- Réduction des boucles de retry du module Équipe sur Safari/mobile pour éviter les rafales de requêtes lorsque Supabase répond lentement.
- Conservation du cache local profils/organisation et du chargement par rubrique déjà présent en V1.3.5.

## Objectif
Réduire fortement l'egress Supabase et la pression sur le compute Nano sans supprimer de fonctionnalité.

## Déploiement
Pousser le contenu du ZIP sur la branche `main` comme d'habitude. Aucune migration SQL supplémentaire n'est requise : `storage_path` existe déjà dans le schéma du projet.
