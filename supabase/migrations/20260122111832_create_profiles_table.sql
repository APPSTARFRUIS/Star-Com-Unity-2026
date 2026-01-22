/*
  # Création de la table profiles

  1. Nouvelle Table
    - `profiles`
      - `id` (uuid, primary key) - Lié à auth.users
      - `email` (text, unique) - Email de l'utilisateur
      - `full_name` (text) - Nom complet
      - `role` (text) - Rôle: ADMIN, MODERATEUR, ou USER
      - `department` (text) - Département de l'utilisateur
      - `avatar_url` (text) - URL de l'avatar
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de mise à jour

  2. Sécurité
    - Activation du RLS
    - Politique de lecture pour les utilisateurs authentifiés
    - Politique de mise à jour pour son propre profil
    - Politique d'insertion restreinte aux admins
    - Politique de suppression restreinte aux admins
*/

-- Création de la table profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'USER' NOT NULL CHECK (role IN ('ADMIN', 'MODERATEUR', 'USER')),
  department text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Activation de la sécurité RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique de lecture: tous les utilisateurs authentifiés peuvent voir tous les profils
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique de mise à jour: les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique d'insertion: seuls les admins peuvent créer des profils
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

-- Politique de suppression: seuls les admins peuvent supprimer des profils
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Attribution des permissions
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;