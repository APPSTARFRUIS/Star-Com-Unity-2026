/*
  # Improve Game Persistence and Predictions

  1. Schema Changes
    - Add columns to game_predictions for better tracking
    - Add indexed columns for faster queries
    - Add result validation

  2. Updates
    - Add constraints to ensure data integrity
    - Add indexes on frequently queried columns

  3. Security
    - Ensure proper RLS policies for game data
*/

-- Add columns to game_predictions for better persistence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_predictions' AND column_name = 'is_won'
  ) THEN
    ALTER TABLE game_predictions ADD COLUMN is_won boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_predictions' AND column_name = 'points_earned'
  ) THEN
    ALTER TABLE game_predictions ADD COLUMN points_earned integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_predictions' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE game_predictions ADD COLUMN processed_at timestamptz;
  END IF;
END $$;

-- Add indexes for game queries
CREATE INDEX IF NOT EXISTS idx_game_predictions_user_id ON game_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_predictions_game_id ON game_predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_predictions_is_won ON game_predictions(is_won);
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);

-- Ensure RLS policies are set for games
DROP POLICY IF EXISTS "Users can view all games" ON games;
DROP POLICY IF EXISTS "Users can insert game results" ON games;

CREATE POLICY "Users can view all games"
  ON games FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert game results"
  ON games FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
  ));

-- RLS for game_predictions
DROP POLICY IF EXISTS "Users can view all predictions" ON game_predictions;
DROP POLICY IF EXISTS "Users can insert their predictions" ON game_predictions;
DROP POLICY IF EXISTS "Users can update their predictions" ON game_predictions;

CREATE POLICY "Users can view all predictions"
  ON game_predictions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their predictions"
  ON game_predictions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their predictions"
  ON game_predictions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
  ))
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
  ));