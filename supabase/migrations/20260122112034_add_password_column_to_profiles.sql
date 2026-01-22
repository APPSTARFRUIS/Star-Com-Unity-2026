/*
  # Ajout colonne password à profiles

  1. Modifications
    - Ajout d'une colonne `password` (text, nullable) à la table `profiles`
    - Cette colonne permet une authentification fallback pour les utilisateurs qui ne passent pas par Supabase Auth
    
  Note: Cette colonne est temporaire et sera utilisée pour permettre la connexion initiale des administrateurs.
*/

-- Ajout de la colonne password si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'password'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN password text;
  END IF;
END $$;