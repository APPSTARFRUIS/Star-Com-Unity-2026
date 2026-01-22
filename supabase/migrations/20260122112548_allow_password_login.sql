/*
  # Autoriser la connexion par mot de passe

  1. Modifications
    - Ajout d'une politique permettant aux utilisateurs anonymes de lire les profils avec mot de passe
    - Cela permet la connexion initiale via le champ password
*/

CREATE POLICY "Allow password authentication"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (password IS NOT NULL);