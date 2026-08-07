# Correctif photos de profil

Cette version corrige les trois cas signalés :

1. **Admin : modification d'un utilisateur**
   - une nouvelle photo est uploadée dans Supabase Storage ;
   - seule son URL est envoyée à l'API Vercel ;
   - l'URL est enregistrée dans `profiles.avatar`.

2. **Admin : création d'un utilisateur**
   - la photo choisie est conservée dans le profil créé ;
   - aucun avatar n'est envoyé dans les métadonnées Supabase Auth.

3. **Utilisateur : Paramètres**
   - l'utilisateur peut modifier sa propre photo sans passer par l'API admin ;
   - le mot de passe personnel utilise `supabase.auth.updateUser`;
   - le reste du profil est mis à jour directement dans `profiles`;
   - le message « réservé à l'administrateur » ne doit plus apparaître.

Aucune migration SQL supplémentaire n'est nécessaire.
