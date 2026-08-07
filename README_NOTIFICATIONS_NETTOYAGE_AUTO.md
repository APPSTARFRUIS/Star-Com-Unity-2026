# Nettoyage automatique des notifications lues

## Fonctionnement

- une notification non lue est conservée sans limite ;
- lorsqu'elle est lue, `read_at` enregistre la date de lecture ;
- 7 jours après cette date, elle est supprimée de la table `notifications` ;
- le nettoyage est lancé automatiquement lors du chargement de l'application
  et lors de l'ouverture du Centre de notifications ;
- la suppression est donc réelle dans Supabase, pas seulement visuelle.

Le bouton manuel `×` de suppression a été retiré : il n'est plus nécessaire.

## Anciennes notifications

La migration attribue `created_at` comme date de lecture aux anciennes notifications
déjà marquées comme lues et dépourvues de `read_at`. Elles pourront ainsi être purgées.

## Étape obligatoire

Après le déploiement, exécuter une fois dans Supabase > SQL Editor :

`supabase/notifications_read_cleanup_migration.sql`

Aucune notification non lue n'est supprimée.
