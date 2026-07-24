-- À exécuter une seule fois dans Supabase > SQL Editor.
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS sport_events jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS sport_name text DEFAULT 'Football';
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS exact_score_points integer DEFAULT 10;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS outcome_points integer DEFAULT 5;

-- Autorise la modification d'un pronostic avant sa clôture depuis l'application.
DROP POLICY IF EXISTS "Anyone can update predictions" ON public.game_predictions;
CREATE POLICY "Anyone can update predictions" ON public.game_predictions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
