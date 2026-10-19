# V1.6.30 — Boutique / Points Hardening

## Migration à exécuter
`supabase/migrations/20261019134500_v1630_boutique_points_hardening.sql`

## Sécurité
- catalogue/stock : écriture ADMIN/MODÉRATEUR uniquement ;
- transactions : plus de création libre par un utilisateur ;
- solde de points : modification directe par l'utilisateur bloquée ;
- achat boutique via `claim_shop_reward()` atomique : contrôle du solde et du stock, verrouillage, débit, stock et commande dans une seule transaction ;
- dépenses utilisateur contrôlées via `spend_own_points()` ;
- historique personnel toujours lisible par son propriétaire ; administration/modération conserve la visibilité nécessaire.

Les données de test existantes ne sont pas effacées par cette migration. Le reset pré-production sera une étape distincte avant lancement.
