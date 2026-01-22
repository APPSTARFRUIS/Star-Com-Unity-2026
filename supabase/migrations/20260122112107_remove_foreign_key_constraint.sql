/*
  # Suppression temporaire de la contrainte de clé étrangère

  1. Modifications
    - Suppression de la contrainte de clé étrangère entre profiles et auth.users
    - Cela permet de créer des profils sans avoir d'utilisateur correspondant dans auth.users
    
  Note: Cette modification permet une authentification flexible pour les utilisateurs.
*/

-- Suppression de la contrainte de clé étrangère si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;