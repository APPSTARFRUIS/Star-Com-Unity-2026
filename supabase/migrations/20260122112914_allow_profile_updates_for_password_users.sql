/*
  # Autoriser les mises à jour de profil pour les utilisateurs avec mot de passe

  1. Modifications
    - Ajout d'une politique permettant les mises à jour de profil pour les utilisateurs utilisant l'authentification par mot de passe
    - Permet aux utilisateurs non authentifiés via Supabase Auth de mettre à jour leur profil
*/

DROP POLICY IF EXISTS "Allow profile updates for password users" ON public.profiles;

CREATE POLICY "Allow profile updates for password users"
  ON public.profiles
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);