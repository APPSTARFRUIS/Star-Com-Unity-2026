# Correctif définitif — Request body too large

La requête du navigateur était déjà légère.

Le dépassement se produisait ensuite entre l'API Vercel et Supabase Auth :
l'API renvoyait les anciennes métadonnées Auth avec `...(authUser.user_metadata || {})`.
Certains comptes contenaient encore un avatar en base64 dans ces métadonnées, ce qui dépassait 1 Mo.

Corrections :
- suppression complète du spread des anciennes métadonnées Auth ;
- aucun avatar n'est plus envoyé à Supabase Auth ;
- Auth conserve uniquement `profile_id` et `name` ;
- les photos restent uniquement dans la table `profiles`.

Aucune migration SQL supplémentaire n'est nécessaire.
