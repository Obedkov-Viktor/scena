-- Phase 1: Multi-theater support
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create theaters table
CREATE TABLE IF NOT EXISTS theaters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert TMZh as the first theater
INSERT INTO theaters (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Театр мимики и жеста', 'tmzh')
ON CONFLICT DO NOTHING;

-- 3. Add theater_id to all tables (nullable for now)
ALTER TABLE artists  ADD COLUMN IF NOT EXISTS theater_id UUID REFERENCES theaters(id);
ALTER TABLE venues   ADD COLUMN IF NOT EXISTS theater_id UUID REFERENCES theaters(id);
ALTER TABLE events   ADD COLUMN IF NOT EXISTS theater_id UUID REFERENCES theaters(id);

-- 4. Assign existing data to TMZh
UPDATE artists SET theater_id = '00000000-0000-0000-0000-000000000001' WHERE theater_id IS NULL;
UPDATE venues  SET theater_id = '00000000-0000-0000-0000-000000000001' WHERE theater_id IS NULL;
UPDATE events  SET theater_id = '00000000-0000-0000-0000-000000000001' WHERE theater_id IS NULL;

-- 5. Create user_theaters table (links auth users to theaters)
CREATE TABLE IF NOT EXISTS user_theaters (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theater_id UUID REFERENCES theaters(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',  -- 'admin' | 'viewer'
  PRIMARY KEY (user_id, theater_id)
);

-- 6. Link all existing auth users to TMZh (they were working there before)
INSERT INTO user_theaters (user_id, theater_id, role)
SELECT id, '00000000-0000-0000-0000-000000000001', 'admin'
FROM auth.users
ON CONFLICT DO NOTHING;

-- 7. Enable RLS on theaters and user_theaters
ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_theaters ENABLE ROW LEVEL SECURITY;

-- Users can see theaters they belong to
CREATE POLICY "theater_members_can_view" ON theaters
  FOR SELECT USING (
    id IN (SELECT theater_id FROM user_theaters WHERE user_id = auth.uid())
  );

-- Users can see their own user_theaters rows
CREATE POLICY "own_user_theaters" ON user_theaters
  FOR SELECT USING (user_id = auth.uid());

-- 8. Enable RLS on data tables (if not already enabled)
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues  ENABLE ROW LEVEL SECURITY;
ALTER TABLE events  ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policies if they exist
DROP POLICY IF EXISTS "allow_all_artists" ON artists;
DROP POLICY IF EXISTS "allow_all_venues" ON venues;
DROP POLICY IF EXISTS "allow_all_events" ON events;

-- Create theater-scoped policies
CREATE POLICY "theater_artists" ON artists
  FOR ALL USING (
    theater_id IN (SELECT theater_id FROM user_theaters WHERE user_id = auth.uid())
  );

CREATE POLICY "theater_venues" ON venues
  FOR ALL USING (
    theater_id IN (SELECT theater_id FROM user_theaters WHERE user_id = auth.uid())
  );

CREATE POLICY "theater_events" ON events
  FOR ALL USING (
    theater_id IN (SELECT theater_id FROM user_theaters WHERE user_id = auth.uid())
  );
