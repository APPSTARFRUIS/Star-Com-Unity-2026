/*
  ============================================
  SCRIPT COMPLET - STAR COMUNITY DATABASE
  ============================================

  Ce script recrée toutes les tables de l'application avec exactement
  les mêmes colonnes utilisées par l'application TypeScript.

  ATTENTION: Ce script supprime toutes les données existantes.

  Tables créées:
  - profiles (utilisateurs avec toutes leurs infos)
  - posts (publications mur social)
  - comments (commentaires sur posts et idées)
  - ideas (boîte à idées avec votes)
  - events (événements d'entreprise)
  - messages (messagerie privée)
  - documents (gestion documentaire)
  - polls (sondages et enquêtes)
  - moods (suivi humeur employés)
  - celebrations (célébrations et anniversaires)
  - newsletters (newsletters avec articles)
  - wellness_contents (contenus bien-être)
  - wellness_challenges (défis bien-être)
  - games (tous types de jeux)
  - game_predictions (prédictions paris)
  - rewards (boutique récompenses)
  - transactions (historique points)
  - app_config (configuration globale)
*/

-- ============================================
-- NETTOYAGE: Suppression tables existantes
-- ============================================

DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.game_predictions CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.wellness_challenges CASCADE;
DROP TABLE IF EXISTS public.wellness_contents CASCADE;
DROP TABLE IF EXISTS public.newsletters CASCADE;
DROP TABLE IF EXISTS public.celebrations CASCADE;
DROP TABLE IF EXISTS public.moods CASCADE;
DROP TABLE IF EXISTS public.polls CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.ideas CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.app_config CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLE PROFILES (Utilisateurs)
-- ============================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password text,
  role text DEFAULT 'USER' NOT NULL CHECK (role IN ('ADMIN', 'MODERATEUR', 'USER')),
  department text,
  company text,
  avatar text DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  points integer DEFAULT 0 NOT NULL,
  phone text,
  job_function text,
  birthday text,
  notification_settings jsonb DEFAULT '{"email": true, "desktop": true, "mobile": true, "posts": true, "events": true, "messages": true, "birthdays": true, "polls": true}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS et Politiques pour profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create profiles"
  ON public.profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON public.profiles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete profiles"
  ON public.profiles FOR DELETE
  TO anon, authenticated
  USING (true);

-- Index pour performances
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_department ON public.profiles(department);

-- Fonction pour auto-update du champ updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Permissions
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO anon, authenticated;

-- ============================================
-- 2. TABLE POSTS (Mur Social)
-- ============================================

CREATE TABLE public.posts (
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
CREATE POLICY "Anyone can create posts" ON public.posts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update posts" ON public.posts FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete posts" ON public.posts FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

GRANT ALL ON TABLE public.posts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.posts TO anon, authenticated;

-- ============================================
-- 3. TABLE COMMENTS
-- ============================================

CREATE TABLE public.comments (
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
CREATE POLICY "Anyone can create comments" ON public.comments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete comments" ON public.comments FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_idea_id ON public.comments(idea_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

GRANT ALL ON TABLE public.comments TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comments TO anon, authenticated;

-- ============================================
-- 4. TABLE IDEAS (Boîte à Idées)
-- ============================================

CREATE TABLE public.ideas (
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
CREATE POLICY "Anyone can create ideas" ON public.ideas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update ideas" ON public.ideas FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete ideas" ON public.ideas FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX idx_ideas_status ON public.ideas(status);
CREATE INDEX idx_ideas_created_at ON public.ideas(created_at DESC);

GRANT ALL ON TABLE public.ideas TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ideas TO anon, authenticated;

-- ============================================
-- 5. TABLE EVENTS
-- ============================================

CREATE TABLE public.events (
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
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create events" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update events" ON public.events FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete events" ON public.events FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_created_by ON public.events(created_by);

GRANT ALL ON TABLE public.events TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO anon, authenticated;

-- ============================================
-- 6. TABLE MESSAGES
-- ============================================

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  text text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create messages" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at ASC);

GRANT ALL ON TABLE public.messages TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO anon, authenticated;

-- ============================================
-- 7. TABLE DOCUMENTS
-- ============================================

CREATE TABLE public.documents (
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
CREATE POLICY "Anyone can upload documents" ON public.documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete documents" ON public.documents FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);

GRANT ALL ON TABLE public.documents TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.documents TO anon, authenticated;

-- ============================================
-- 8. TABLE POLLS (Sondages)
-- ============================================

CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  questions jsonb DEFAULT '[]'::jsonb NOT NULL,
  settings jsonb DEFAULT '{"collectEmail": false, "limitOneResponse": true, "shuffleQuestions": false, "showResults": true, "showProgressBar": true, "confirmationMessage": "Merci pour votre participation !"}'::jsonb NOT NULL,
  responses jsonb DEFAULT '[]'::jsonb NOT NULL,
  end_date timestamptz,
  created_by text,
  created_by_name text,
  target_departments jsonb DEFAULT '["Tous"]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view polls" ON public.polls FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create polls" ON public.polls FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update polls" ON public.polls FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete polls" ON public.polls FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_polls_created_at ON public.polls(created_at DESC);
CREATE INDEX idx_polls_end_date ON public.polls(end_date);

GRANT ALL ON TABLE public.polls TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.polls TO anon, authenticated;

-- ============================================
-- 9. TABLE MOODS
-- ============================================

CREATE TABLE public.moods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  value integer NOT NULL CHECK (value >= 1 AND value <= 5),
  comment text,
  department text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view moods" ON public.moods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create moods" ON public.moods FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_moods_user_id ON public.moods(user_id);
CREATE INDEX idx_moods_department ON public.moods(department);
CREATE INDEX idx_moods_created_at ON public.moods(created_at DESC);

GRANT ALL ON TABLE public.moods TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moods TO anon, authenticated;

-- ============================================
-- 10. TABLE CELEBRATIONS
-- ============================================

CREATE TABLE public.celebrations (
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
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.celebrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view celebrations" ON public.celebrations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create celebrations" ON public.celebrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update celebrations" ON public.celebrations FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete celebrations" ON public.celebrations FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_celebrations_date ON public.celebrations(date DESC);
CREATE INDEX idx_celebrations_type ON public.celebrations(type);

GRANT ALL ON TABLE public.celebrations TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.celebrations TO anon, authenticated;

-- ============================================
-- 11. TABLE NEWSLETTERS
-- ============================================

CREATE TABLE public.newsletters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  summary text NOT NULL,
  cover_image text,
  articles jsonb DEFAULT '[]'::jsonb NOT NULL,
  published_at timestamptz DEFAULT now() NOT NULL,
  author_name text NOT NULL,
  read_count integer DEFAULT 0
);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view newsletters" ON public.newsletters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create newsletters" ON public.newsletters FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update newsletters" ON public.newsletters FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete newsletters" ON public.newsletters FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_newsletters_published_at ON public.newsletters(published_at DESC);

GRANT ALL ON TABLE public.newsletters TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.newsletters TO anon, authenticated;

-- ============================================
-- 12. TABLE WELLNESS_CONTENTS
-- ============================================

CREATE TABLE public.wellness_contents (
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
CREATE POLICY "Anyone can create wellness contents" ON public.wellness_contents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete wellness contents" ON public.wellness_contents FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_wellness_contents_category ON public.wellness_contents(category);
CREATE INDEX idx_wellness_contents_created_at ON public.wellness_contents(created_at DESC);

GRANT ALL ON TABLE public.wellness_contents TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wellness_contents TO anon, authenticated;

-- ============================================
-- 13. TABLE WELLNESS_CHALLENGES
-- ============================================

CREATE TABLE public.wellness_challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.wellness_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wellness challenges" ON public.wellness_challenges FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create wellness challenges" ON public.wellness_challenges FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update wellness challenges" ON public.wellness_challenges FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete wellness challenges" ON public.wellness_challenges FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_wellness_challenges_is_active ON public.wellness_challenges(is_active);

GRANT ALL ON TABLE public.wellness_challenges TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wellness_challenges TO anon, authenticated;

-- ============================================
-- 14. TABLE GAMES
-- ============================================

CREATE TABLE public.games (
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
CREATE POLICY "Anyone can create games" ON public.games FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update games" ON public.games FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete games" ON public.games FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_games_type ON public.games(type);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_created_at ON public.games(created_at DESC);

GRANT ALL ON TABLE public.games TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.games TO anon, authenticated;

-- ============================================
-- 15. TABLE GAME_PREDICTIONS
-- ============================================

CREATE TABLE public.game_predictions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  game_id uuid NOT NULL,
  choice text NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.game_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view predictions" ON public.game_predictions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create predictions" ON public.game_predictions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_predictions_user_id ON public.game_predictions(user_id);
CREATE INDEX idx_predictions_game_id ON public.game_predictions(game_id);

GRANT ALL ON TABLE public.game_predictions TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.game_predictions TO anon, authenticated;

-- ============================================
-- 16. TABLE REWARDS
-- ============================================

CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  cost integer NOT NULL,
  image text,
  stock integer DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rewards" ON public.rewards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create rewards" ON public.rewards FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update rewards" ON public.rewards FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete rewards" ON public.rewards FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX idx_rewards_category ON public.rewards(category);
CREATE INDEX idx_rewards_cost ON public.rewards(cost);

GRANT ALL ON TABLE public.rewards TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rewards TO anon, authenticated;

-- ============================================
-- 17. TABLE TRANSACTIONS
-- ============================================

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  type text NOT NULL CHECK (type IN ('earn', 'spend')),
  date text NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transactions" ON public.transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create transactions" ON public.transactions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);

GRANT ALL ON TABLE public.transactions TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO anon, authenticated;

-- ============================================
-- 18. TABLE APP_CONFIG
-- ============================================

CREATE TABLE public.app_config (
  id integer PRIMARY KEY DEFAULT 1,
  app_name text DEFAULT 'Star ComUnity' NOT NULL,
  app_slogan text DEFAULT 'Ensemble, cultivons notre réussite' NOT NULL,
  logo_url text,
  welcome_title text DEFAULT 'Bienvenue {name}' NOT NULL,
  welcome_subtitle text DEFAULT 'Ravi de vous revoir !' NOT NULL,
  document_categories jsonb DEFAULT '["RH", "Commercial", "Technique", "Administratif"]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT single_row_constraint CHECK (id = 1)
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app config" ON public.app_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update app config" ON public.app_config FOR UPDATE TO anon, authenticated USING (true);

GRANT ALL ON TABLE public.app_config TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_config TO anon, authenticated;

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Insertion de la configuration par défaut
INSERT INTO public.app_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VUES STATISTIQUES (optionnel)
-- ============================================

-- Vue pour stats utilisateurs
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
  p.id,
  p.name,
  p.email,
  p.role,
  p.department,
  p.points,
  COUNT(DISTINCT po.id) as posts_count,
  COUNT(DISTINCT i.id) as ideas_count,
  COUNT(DISTINCT c.id) as comments_count
FROM profiles p
LEFT JOIN posts po ON po.user_id = p.id
LEFT JOIN ideas i ON i.user_id = p.id
LEFT JOIN comments c ON c.user_id = p.id
GROUP BY p.id, p.name, p.email, p.role, p.department, p.points;

GRANT SELECT ON v_user_stats TO anon, authenticated;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

/*
  NOTES IMPORTANTES:

  1. Toutes les tables ont RLS activé avec des politiques ouvertes (USING true)
     car l'application gère les permissions côté frontend

  2. Les colonnes utilisent snake_case (convention PostgreSQL) mais l'app
     les lit directement donc les noms doivent correspondre exactement

  3. Les champs JSONB contiennent des structures complexes:
     - attachments, votes, likes, user_ids: arrays d'IDs
     - notification_settings: objet de config utilisateur
     - questions, responses: structures de sondages
     - articles: array d'articles de newsletter

  4. Index créés sur les colonnes fréquemment recherchées
     pour optimiser les performances

  5. La table app_config ne peut avoir qu'une seule ligne (id=1)
     pour stocker la configuration globale
*/
