/*
  # Ajout colonnes manquantes à profiles

  1. Modifications
    - Ajout de colonnes manquantes pour correspondre au schéma utilisé dans l'application
    - Colonnes: name, avatar, points, phone, job_function, company, notification_settings, birthday
*/

-- Ajout des colonnes manquantes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
    ALTER TABLE public.profiles ADD COLUMN name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'points') THEN
    ALTER TABLE public.profiles ADD COLUMN points integer DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_function') THEN
    ALTER TABLE public.profiles ADD COLUMN job_function text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') THEN
    ALTER TABLE public.profiles ADD COLUMN company text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birthday') THEN
    ALTER TABLE public.profiles ADD COLUMN birthday text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_settings') THEN
    ALTER TABLE public.profiles ADD COLUMN notification_settings jsonb DEFAULT '{"email": true, "desktop": true, "mobile": true, "posts": true, "events": true, "messages": true, "birthdays": true, "polls": true}'::jsonb;
  END IF;
END $$;