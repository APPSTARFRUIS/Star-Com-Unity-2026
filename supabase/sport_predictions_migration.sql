-- À exécuter une seule fois dans Supabase > SQL Editor avant d'utiliser les paris sportifs.
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS sport_events jsonb DEFAULT '[]'::jsonb;
