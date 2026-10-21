# V1.6.38 — Boutique Ma Poire

- La Boutique comporte désormais deux univers : **Boutique STAR** et **Boutique Ma Poire**.
- Les accessoires `purchase` actifs de la mascotte sont proposés automatiquement dans Boutique Ma Poire.
- Les objets `unlock` et `gift` ne sont jamais proposés à l'achat.
- Les collections inactives, pas encore ouvertes ou terminées masquent leurs objets de la boutique.
- Un objet déjà possédé affiche **Déjà possédé** et ne peut pas être racheté.
- Achat atomique via `claim_mascot_item` : vérification disponibilité + points, débit des points, ajout immédiat au dressing et transaction.
- Le back-office reste unique : les accessoires/prix/type d'acquisition continuent d'être administrés dans **Administration > Mascotte**.

## SQL à exécuter
`supabase/migrations/20261021170500_v1638_mascot_shop.sql`
