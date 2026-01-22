/*
  # Autoriser la création d'utilisateurs

  1. Modifications
    - Suppression de la politique restrictive pour l'insertion
    - Ajout d'une nouvelle politique permettant l'insertion à tous les utilisateurs
*/

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Anyone can create profiles"
  ON public.profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);