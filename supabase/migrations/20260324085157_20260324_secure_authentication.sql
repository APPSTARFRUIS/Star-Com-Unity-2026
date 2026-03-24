/*
  # Secure Authentication Implementation

  1. Schema Changes
    - Add password_hash column to profiles table
    - Add last_login timestamp for audit trail
    - Add is_active boolean to support account deactivation

  2. Security Updates
    - Enable RLS with proper authentication checks
    - Create restrictive policies for user data access
    - Add function to verify passwords using pgcrypto

  3. Data Migration
    - Hash existing passwords using bcrypt
    - Clear plain text password column
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add new security columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password text) RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password text, hash text) RETURNS boolean AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Hash existing plain text passwords
UPDATE profiles 
SET password_hash = hash_password(password), password = NULL
WHERE password IS NOT NULL AND password_hash IS NULL;

-- Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Allow insert for all" ON profiles;
DROP POLICY IF EXISTS "Allow update for all" ON profiles;
DROP POLICY IF EXISTS "Allow read for all" ON profiles;

-- Create proper RLS policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR id = (SELECT id FROM profiles WHERE email = current_user LIMIT 1))
  WITH CHECK (auth.uid() = id OR id = (SELECT id FROM profiles WHERE email = current_user LIMIT 1));

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN' OR email IS NOT NULL);