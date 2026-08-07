# Correctif final des points administrateur

Cause identifiée :
la table `transactions` historique impose une colonne `date` non nulle.
L'ajustement administrateur créait bien la transaction, mais sans renseigner `date`.
Supabase refusait donc l'insertion et l'API renvoyait « Erreur interne du service utilisateurs ».

Correction :
- chaque ajustement administrateur renseigne maintenant `date: new Date().toISOString()`;
- le rollback du solde reste actif si l'historique ne peut pas être créé ;
- les erreurs Supabase sont désormais remontées avec leur vrai message au lieu du message générique.

La sécurité ADMIN du correctif précédent est conservée.
Aucune migration SQL n'est nécessaire.
