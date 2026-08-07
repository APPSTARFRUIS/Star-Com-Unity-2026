# Correctif définitif — Enregistrement des commandes Boutique

## Cause réelle

Le problème n'était finalement pas l'affichage Administration.

Lors d'un achat, le code faisait bien :
- le retrait des points ;
- le retrait du stock ;

mais il insérait la ligne dans `transactions` **sans renseigner la colonne `date`**.

Cette colonne est obligatoire dans la base. L'insertion échouait donc silencieusement car l'erreur Supabase n'était jamais vérifiée.

Résultat :
- l'utilisateur avait bien moins de points ;
- le stock baissait ;
- mais aucune commande n'existait réellement dans `transactions`;
- l'Administration affichait donc logiquement `Commandes (0)`.

## Correction

Lors d'une commande :
1. la commande est créée dans `transactions` avec :
   - utilisateur ;
   - coût ;
   - `Achat : nom de la récompense` ;
   - type `spend` ;
   - date ISO obligatoire ;
2. si cette création échoue, **aucun point ni stock n'est retiré** ;
3. seulement après, les points sont débités ;
4. puis le stock est décrémenté ;
5. si une étape échoue, un rollback est tenté pour éviter une commande incohérente ;
6. les erreurs Supabase sont maintenant affichées au lieu d'être ignorées.

## Important pour le test

Les commandes passées AVANT ce correctif n'ont probablement jamais été enregistrées dans `transactions`.
Il faut donc faire une NOUVELLE commande après ce déploiement pour tester l'onglet Administration > Boutique > Commandes.

Aucune migration SQL n'est nécessaire.
