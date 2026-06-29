-- ─────────────────────────────────────────────────────────────
-- SECURITY FIX: Explicit schema + search_path
-- ─────────────────────────────────────────────────────────────
-- Drops and recreates the handle_new_user function with:
--   1. Explicit 'public.' schema prefix on user_profiles
--   2. SET search_path = public at function start
-- This prevents search_path injection attacks.
-- ─────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger (DROP FUNCTION CASCADE removed it)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- DASHBOARD PREFERENCES
-- ─────────────────────────────────────────────────────────────
-- Add dashboard preferences for Dashboard Manager
-- Stores which dashboard widgets are visible.
-- Existing users automatically receive all widgets enabled.
-- Future widgets only require:
--   1. Add one JSON key here
--   2. Add one toggle in Settings.jsx
--   3. Read it through resolvePrefs()
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS dashboard_prefs JSONB
NOT NULL DEFAULT '{
  "quote": true,
  "agentBriefing": true,
  "focusTimer": true,
  "aiRecommendation": true,
  "deadlineCards": true
}'::jsonb;


-- ─────────────────────────────────────────────────────────────
-- DATA VALIDATION
-- ─────────────────────────────────────────────────────────────
-- Prevents invalid values from entering the database.
-- CHECK constraints reject invalid INSERT/UPDATE operations.
-- Wrapped in DO blocks with IF NOT EXISTS checks
-- so the migration can be rerun safely.
-- Safe to run multiple times.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_work_start_hour_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_work_start_hour_check
      CHECK (work_start_hour BETWEEN 0 AND 24);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_work_end_hour_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_work_end_hour_check
      CHECK (work_end_hour BETWEEN 0 AND 24);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_time_estimate_check'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_time_estimate_check
      CHECK (time_estimate > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_priority_score_check'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_priority_score_check
      CHECK (priority_score BETWEEN 0 AND 100);
       -- can use CHECK (priority_score >= 0); if needed in future
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_category_check'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_category_check
      CHECK (
        category IN (
          'study',
          'coding',
          'health',
          'personal',
          'work',
          'general'
        )
      );
  END IF;

END $$;


-- ─────────────────────────────────────────────────────────────
-- PERFORMANCE
-- ─────────────────────────────────────────────────────────────
-- Frequently used by:
-- • Dashboard
-- • Tasks page
-- • Agent Engine
-- • AI Briefing
--
-- IF NOT EXISTS allows safe re-execution.
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS tasks_user_id_idx
ON public.tasks(user_id);

CREATE INDEX IF NOT EXISTS tasks_status_idx
ON public.tasks(status);