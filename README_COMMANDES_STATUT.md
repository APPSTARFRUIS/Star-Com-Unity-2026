# Statut des commandes Boutique

## Nouveau fonctionnement
Chaque commande Boutique possède désormais un statut :
- **En attente**
- **Distribuée**

Dans Administration > Boutique > Commandes, l'admin dispose d'un bouton :
- `Marquer distribuée`
- puis, si besoin, `Repasser en attente`

La date de remise est enregistrée automatiquement lors du passage à `Distribuée`.

## Sécurité
Le changement de statut passe par `/api/admin-users` et est revérifié côté serveur.
Seul un utilisateur avec le rôle `ADMIN` peut modifier le statut d'une commande.

## Étape obligatoire
Après le déploiement Vercel, exécuter une fois :

`supabase/boutique_order_status_migration.sql`

dans Supabase > SQL Editor.

Les commandes Boutique déjà existantes seront mises en `En attente`.
