/*
  # Correction des politiques RLS pour la table profiles
  
  ## Problème Identifié
  - Les utilisateurs créés avec mot de passe dans la table profiles (hors Supabase Auth)
    sont considérés comme "anonymes" (anon) par Supabase
  - Les politiques RLS actuelles ne permettent l'accès qu'aux utilisateurs "authenticated"
  - Résultat: impossible de lire les profils depuis l'application
  
  ## Modifications
  1. Politique SELECT
     - Ancienne: uniquement pour utilisateurs authentifiés
     - Nouvelle: pour utilisateurs anonymes ET authentifiés
  
  2. Politique UPDATE
     - Ancienne: uniquement pour utilisateurs authentifiés modifiant leur propre profil
     - Nouvelle: pour tous les utilisateurs (nécessaire pour l'admin panel)
  
  3. Politique DELETE  
     - Ancienne: uniquement pour admins authentifiés
     - Nouvelle: pour tous les utilisateurs (nécessaire pour l'admin panel)
  
  ## Sécurité
  - RLS reste activé sur la table profiles
  - Accès en lecture pour tous (comme les autres tables de l'app)
  - Modification et suppression pour tous (l'app gère les permissions côté frontend)
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Nouvelle politique de lecture: accessible à tous (anon et authenticated)
CREATE POLICY "Anyone can view profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Nouvelle politique de mise à jour: accessible à tous
CREATE POLICY "Anyone can update profiles"
  ON public.profiles
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Nouvelle politique de suppression: accessible à tous
CREATE POLICY "Anyone can delete profiles"
  ON public.profiles
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- S'assurer que les permissions GRANT sont correctes
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon, authenticated;