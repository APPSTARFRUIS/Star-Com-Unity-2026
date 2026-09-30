-- Star Com'Unity V1.5.5 — vidéos du mur social
-- Limite du bucket à 600 Mo.
-- Le plafond GLOBAL Storage doit aussi être réglé à >= 600 Mo dans Supabase Dashboard > Storage > Settings.
UPDATE storage.buckets
SET file_size_limit = 629145600
WHERE id = 'star-community-media';
