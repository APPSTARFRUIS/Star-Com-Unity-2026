/*
  # Création de toutes les tables de l'application

  1. Nouvelles Tables
    - `posts` - Publications sur le mur social
    - `comments` - Commentaires sur posts et idées
    - `ideas` - Boîte à idées avec votes
    - `events` - Événements d'entreprise
    - `messages` - Messagerie privée
    - `documents` - Gestion documentaire
    - `polls` - Sondages et enquêtes
    - `moods` - Suivi de l'humeur des employés
    - `celebrations` - Célébrations et anniversaires
    - `newsletters` - Newsletters d'entreprise
    - `wellness_contents` - Contenus bien-être
    - `wellness_challenges` - Défis bien-être
    - `games` - Jeux d'entreprise
    - `game_predictions` - Prédictions pour les jeux
    - `rewards` - Récompenses de la boutique
    - `transactions` - Historique des transactions de points
    - `app_config` - Configuration globale de l'application

  2. Sécurité
    - Activation du RLS sur toutes les tables
    - Politiques permettant l'accès pour les utilisateurs anonymes et authentifiés
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_avatar text,
  role text,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update posts" ON public.posts FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Users can delete posts" ON public.posts FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.posts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.posts TO anon, authenticated;

-- 2. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid,
  idea_id uuid,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_avatar text,
  text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can delete comments" ON public.comments FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.comments TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comments TO anon, authenticated;

-- 3. IDEAS TABLE
CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_avatar text,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  status text DEFAULT 'Suggestion' NOT NULL,
  votes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ideas" ON public.ideas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create ideas" ON public.ideas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update ideas" ON public.ideas FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Users can delete ideas" ON public.ideas FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.ideas TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ideas TO anon, authenticated;

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  participants jsonb DEFAULT '[]'::jsonb,
  attendees jsonb DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create events" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update events" ON public.events FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Users can delete events" ON public.events FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.events TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO anon, authenticated;

-- 5. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  text text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create messages" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT ALL ON TABLE public.messages TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO anon, authenticated;

-- 6. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL,
  size integer NOT NULL,
  category text NOT NULL,
  uploaded_by uuid NOT NULL,
  uploaded_by_name text NOT NULL,
  data text NOT NULL,
  uploaded_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view documents" ON public.documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can upload documents" ON public.documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can delete documents" ON public.documents FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.documents TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.documents TO anon, authenticated;

-- 7. POLLS TABLE (drop existing if any)
DROP TABLE IF EXISTS public.polls CASCADE;
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  questions jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{"collectEmail": false, "limitOneResponse": true, "showResults": true}'::jsonb,
  responses jsonb DEFAULT '[]'::jsonb,
  end_date timestamptz,
  created_by text,
  created_by_name text,
  target_departments jsonb DEFAULT '["Tous"]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view polls" ON public.polls FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create polls" ON public.polls FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update polls" ON public.polls FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Users can delete polls" ON public.polls FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.polls TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.polls TO anon, authenticated;

-- 8. MOODS TABLE
CREATE TABLE IF NOT EXISTS public.moods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  value integer NOT NULL CHECK (value >= 1 AND value <= 5),
  comment text,
  department text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view moods" ON public.moods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create moods" ON public.moods FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT ALL ON TABLE public.moods TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moods TO anon, authenticated;

-- 9. CELEBRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.celebrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  title text NOT NULL,
  description text,
  date text NOT NULL,
  user_ids jsonb DEFAULT '[]'::jsonb,
  user_name text,
  user_avatar text,
  created_by uuid NOT NULL,
  likes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.celebrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view celebrations" ON public.celebrations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create celebrations" ON public.celebrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update celebrations" ON public.celebrations FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Users can delete celebrations" ON public.celebrations FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.celebrations TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.celebrations TO anon, authenticated;

-- 10. NEWSLETTERS TABLE
CREATE TABLE IF NOT EXISTS public.newsletters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  summary text NOT NULL,
  cover_image text,
  articles jsonb DEFAULT '[]'::jsonb,
  published_at timestamptz DEFAULT now() NOT NULL,
  author_name text NOT NULL,
  read_count integer DEFAULT 0
);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view newsletters" ON public.newsletters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create newsletters" ON public.newsletters FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can delete newsletters" ON public.newsletters FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.newsletters TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.newsletters TO anon, authenticated;

-- 11. WELLNESS CONTENTS TABLE
CREATE TABLE IF NOT EXISTS public.wellness_contents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  content text,
  media_url text,
  category text NOT NULL,
  author text NOT NULL,
  duration text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wellness_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view wellness contents" ON public.wellness_contents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create wellness contents" ON public.wellness_contents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can delete wellness contents" ON public.wellness_contents FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.wellness_contents TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wellness_contents TO anon, authenticated;

-- 12. WELLNESS CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS public.wellness_challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.wellness_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view wellness challenges" ON public.wellness_challenges FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create wellness challenges" ON public.wellness_challenges FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update wellness challenges" ON public.wellness_challenges FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Users can delete wellness challenges" ON public.wellness_challenges FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.wellness_challenges TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wellness_challenges TO anon, authenticated;

-- 13. GAMES TABLE
CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  duration text NOT NULL,
  status text DEFAULT 'Actif' NOT NULL,
  created_by uuid NOT NULL,
  thumbnail text,
  team_a text,
  team_b text,
  match_date text,
  bet_closing_date text,
  result text,
  is_processed boolean DEFAULT false,
  questions jsonb DEFAULT '[]'::jsonb,
  memory_items jsonb DEFAULT '[]'::jsonb,
  timeline_items jsonb DEFAULT '[]'::jsonb,
  hidden_objects jsonb DEFAULT '[]'::jsonb,
  hidden_objects_image text,
  reward_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view games" ON public.games FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create games" ON public.games FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update games" ON public.games FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Users can delete games" ON public.games FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.games TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.games TO anon, authenticated;

-- 14. GAME PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS public.game_predictions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  game_id uuid NOT NULL,
  choice text NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.game_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view predictions" ON public.game_predictions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create predictions" ON public.game_predictions FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT ALL ON TABLE public.game_predictions TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.game_predictions TO anon, authenticated;

-- 15. REWARDS TABLE
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  cost integer NOT NULL,
  image text,
  stock integer DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rewards" ON public.rewards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create rewards" ON public.rewards FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can update rewards" ON public.rewards FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Users can delete rewards" ON public.rewards FOR DELETE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.rewards TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rewards TO anon, authenticated;

-- 16. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  type text NOT NULL CHECK (type IN ('earn', 'spend')),
  date text NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view transactions" ON public.transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT ALL ON TABLE public.transactions TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO anon, authenticated;

-- 17. APP CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.app_config (
  id integer PRIMARY KEY DEFAULT 1,
  app_name text DEFAULT 'Star ComUnity' NOT NULL,
  app_slogan text DEFAULT 'Ensemble, cultivons notre réussite' NOT NULL,
  logo_url text,
  welcome_title text DEFAULT 'Bienvenue {name}' NOT NULL,
  welcome_subtitle text DEFAULT 'Ravi de vous revoir !' NOT NULL,
  document_categories jsonb DEFAULT '["RH", "Commercial", "Technique", "Administratif"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row_constraint CHECK (id = 1)
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view app config" ON public.app_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can update app config" ON public.app_config FOR UPDATE TO anon, authenticated USING (true);
GRANT ALL ON TABLE public.app_config TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_config TO anon, authenticated;

-- Insert default config
INSERT INTO public.app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;