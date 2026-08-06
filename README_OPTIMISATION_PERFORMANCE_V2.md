# Optimisation Performance V2

Cette version poursuit l'allègement Supabase sans supprimer de fonctionnalité.

## Ce qui change
- À la connexion, Star Com'Unity ne charge plus toutes les tables.
- L'accueil charge uniquement les données nécessaires : profil, configuration, activité récente, agenda, célébrations et temps forts.
- Chaque rubrique charge ses données lors de sa première ouverture.
- Une rubrique déjà consultée reste en mémoire et ne relance pas de requête inutile.
- L'administration conserve un chargement complet, uniquement lorsqu'elle est ouverte.
- Les événements Realtime actualisent seulement la rubrique active au lieu de recharger toute l'application.
- Les appels simultanés sur une même rubrique sont regroupés.
- Les limites sur les listes lourdes sont conservées.

## Résultat attendu
- connexion plus rapide ;
- forte baisse du nombre de lectures au démarrage ;
- réduction de la pression Disk IO ;
- navigation plus fluide après la première ouverture de chaque rubrique.

Aucune migration SQL n'est nécessaire.
