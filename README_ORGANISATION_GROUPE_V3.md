# Organisation Groupe V3 — fiches collaborateurs & PDF interactif

Cette version améliore l'onglet Équipe / Organigramme sans modifier les règles
de visibilité des Jeux et Newsletter.

## Organigrammes web
Les salariés sont désormais affichés avec :
- photo miniature ;
- nom ;
- poste / fonction ;
- email ;
- téléphone.

Le clic ouvre une fiche collaborateur enrichie inspirée du modèle fourni :
- grand visuel et identité ;
- entreprise + service ;
- poste ;
- téléphone ;
- email ;
- bloc « Métier » ;
- bloc « À propos / anecdote ».

## Administration utilisateur
La fiche utilisateur ajoute les champs :
- Poste / fonction ;
- Téléphone ;
- Métier / missions ;
- À propos / anecdote.

## PDF
Le bouton devient « Télécharger le PDF interactif ».

Le PDF est généré directement par l'application avec jsPDF :
- A4 paysage ;
- téléchargement d'un vrai fichier `.pdf` ;
- page 1 : organigramme général Star Group ;
- clic sur une structure : page de son organigramme ;
- clic sur un collaborateur : fiche collaborateur ;
- liens Retour entreprise / Retour Star Group ;
- logos et photos intégrés quand leur URL est récupérable depuis le navigateur.

## SQL à exécuter
Après déploiement :
`supabase/organization_group_v3_profiles_migration.sql`

La migration V2 reste nécessaire si elle n'a pas encore été exécutée.
