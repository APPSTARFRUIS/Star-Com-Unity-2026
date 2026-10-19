# Star Com'Unity V1.6.29 — Security / RLS hardening

## Objectif
Durcir la base Supabase avant ouverture générale, sans modifier l'interface ni supprimer de données métier.

## Migration à exécuter
`supabase/migrations/20261019123000_v1629_security_rls_hardening.sql`

Le script est conçu pour être réexécutable.

## Ce qui est renforcé
- suppression définitive de l'ancien champ `profiles.password` s'il existe encore ;
- suppression des accès `anon` hérités sur les tables applicatives principales ;
- annuaire `profiles` réservé aux utilisateurs authentifiés ;
- modification d'un profil limitée à son propriétaire ou ADMIN/MODERATEUR ;
- blocage de l'auto-promotion de rôle via modification directe de `profiles` ;
- messages privés lisibles uniquement par expéditeur/destinataire ;
- notifications lisibles/modifiables/supprimables uniquement par leur destinataire ;
- configuration générale modifiable uniquement par ADMIN/MODERATEUR ;
- posts/commentaires : écriture liée à l'auteur, avec override modération ;
- humeur : création uniquement au nom de l'utilisateur connecté ;
- suppression des privilèges SQL directs du rôle `anon` sur les tables listées.

## Compatibilité volontaire
La boutique actuelle modifie encore les points/stock depuis le client. V1.6.29 retire l'accès anonyme mais conserve le comportement authentifié afin de ne pas casser la boutique. Le passage de l'achat/attribution de points dans une fonction SQL atomique côté serveur est recommandé dans une étape séparée.

## Test après migration
Tester avec un ADMIN puis avec un USER : connexion, accueil, équipe, messages, création/édition d'un post, documents, ressources, jeux, pronostics, notifications, paramètres et boutique.
