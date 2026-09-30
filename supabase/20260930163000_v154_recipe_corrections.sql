-- Star Com'Unity V1.5 - recette finale
-- À exécuter une seule fois dans Supabase SQL Editor.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date text;
UPDATE public.events SET end_date = date WHERE end_date IS NULL;

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.messages;
CREATE POLICY "Anyone can update messages" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS attachment jsonb;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS edited_at timestamptz;
DROP POLICY IF EXISTS "Anyone can update comments" ON public.comments;
CREATE POLICY "Anyone can update comments" ON public.comments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visibility jsonb DEFAULT '{"email":true,"phone":true}'::jsonb;
UPDATE public.profiles SET profile_visibility = '{"email":true,"phone":true}'::jsonb WHERE profile_visibility IS NULL;

-- V1.5.5 : plafond du bucket média à 600 Mo.
-- IMPORTANT : le plafond GLOBAL Storage du projet doit lui aussi être >= 600 Mo.
-- Ce réglage global se fait dans Supabase Dashboard > Storage > Settings.
UPDATE storage.buckets
SET file_size_limit = 629145600
WHERE id = 'star-community-media';
