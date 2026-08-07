# Commandes Boutique — chargement admin sécurisé

Le compteur restait à zéro car l'Administration essayait de lire toutes les transactions directement depuis le navigateur.
Selon les règles d'accès Supabase/RLS, cette lecture peut être vide même lorsque les commandes existent.

## Correction
- ajout de l'action sécurisée `list_orders` dans `/api/admin-users`;
- cette action est accessible uniquement après validation du rôle `ADMIN`;
- elle utilise la clé `service_role` côté serveur pour lire toutes les commandes;
- seules les vraies commandes Boutique sont retournées :
  - `type = spend`
  - `reason` commence par `Achat :`
- Administration > Boutique > Commandes utilise désormais cette API;
- la Boutique utilisateur reste inchangée et privée.

Aucune migration SQL n'est nécessaire.
