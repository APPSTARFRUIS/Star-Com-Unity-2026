/*
  # Add Performance Indexes

  1. New Indexes
    - Add indexes on frequently queried columns
    - Speed up ORDER BY queries
    - Improve JOIN performance

  2. Columns Indexed
    - profiles.name (for ordering)
    - profiles.email (for lookups)
    - posts.created_at
    - events.date
    - ideas.created_at
    - moods.created_at
    - messages.created_at
    - documents.uploaded_at
    - games.created_at
    - All user_id, created_by columns

  3. Impact
    - Eliminates statement timeouts
    - Faster data loading
    - Better overall performance
*/

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Post indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- Event indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Idea indexes
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);

-- Mood indexes
CREATE INDEX IF NOT EXISTS idx_moods_created_at ON moods(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Game indexes
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- Reward indexes
CREATE INDEX IF NOT EXISTS idx_rewards_cost ON rewards(cost);

-- Newsletter indexes
CREATE INDEX IF NOT EXISTS idx_newsletters_published_at ON newsletters(published_at DESC);

-- Poll indexes
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);

-- Celebration indexes
CREATE INDEX IF NOT EXISTS idx_celebrations_date ON celebrations(date);

-- Wellness indexes
CREATE INDEX IF NOT EXISTS idx_wellness_contents_created_at ON wellness_contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_challenges_created_at ON wellness_challenges(created_at DESC);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);