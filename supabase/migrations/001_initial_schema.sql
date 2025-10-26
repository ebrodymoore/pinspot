-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  google_refresh_token TEXT, -- encrypted in production
  last_import_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pins table
CREATE TABLE IF NOT EXISTS pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name TEXT NOT NULL,
  visit_date DATE,
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_photos')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  google_photo_id TEXT,
  display_order INTEGER DEFAULT 0,
  taken_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create import_jobs table
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  photos_imported INTEGER DEFAULT 0,
  pins_created INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pins_user_id ON pins(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_visit_date ON pins(visit_date);
CREATE INDEX IF NOT EXISTS idx_pins_location_name ON pins(location_name);
CREATE INDEX IF NOT EXISTS idx_photos_pin_id ON photos(pin_id);
CREATE INDEX IF NOT EXISTS idx_photos_google_photo_id ON photos(google_photo_id);
CREATE INDEX IF NOT EXISTS idx_tags_pin_id ON tags(pin_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag_name ON tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create spatial index for coordinates (useful for map queries)
-- Note: PostGIS extension may need to be enabled in Supabase
-- To enable, uncomment the lines below and run separately:
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE INDEX IF NOT EXISTS idx_pins_location ON pins USING GIST (
--   ST_Point(longitude, latitude)::geography
-- );
-- For now using basic B-tree indexes on coordinates for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_pins_latitude ON pins(latitude);
CREATE INDEX IF NOT EXISTS idx_pins_longitude ON pins(longitude);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "users_can_view_own_profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_can_view_public_profiles"
  ON users FOR SELECT
  USING (is_public = true);

CREATE POLICY "users_can_update_own_profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for pins table
CREATE POLICY "users_can_view_own_pins"
  ON pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_view_public_pins"
  ON pins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = pins.user_id
      AND users.is_public = true
    )
  );

CREATE POLICY "users_can_create_own_pins"
  ON pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_pins"
  ON pins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_pins"
  ON pins FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for photos table
CREATE POLICY "users_can_view_own_photos"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pins
      WHERE pins.id = photos.pin_id
      AND pins.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_view_public_photos"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pins
      JOIN users ON users.id = pins.user_id
      WHERE pins.id = photos.pin_id
      AND users.is_public = true
    )
  );

CREATE POLICY "users_can_create_own_photos"
  ON photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pins
      WHERE pins.id = photos.pin_id
      AND pins.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_update_own_photos"
  ON photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pins
      WHERE pins.id = photos.pin_id
      AND pins.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_delete_own_photos"
  ON photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pins
      WHERE pins.id = pin_id
      AND pins.user_id = auth.uid()
    )
  );

-- RLS Policies for tags table
CREATE POLICY "users_can_view_own_tags"
  ON tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pins
      WHERE pins.id = tags.pin_id
      AND pins.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_view_public_tags"
  ON tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pins
      JOIN users ON users.id = pins.user_id
      WHERE pins.id = tags.pin_id
      AND users.is_public = true
    )
  );

CREATE POLICY "users_can_create_own_tags"
  ON tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pins
      WHERE pins.id = tags.pin_id
      AND pins.user_id = auth.uid()
    )
  );

CREATE POLICY "users_can_delete_own_tags"
  ON tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pins
      WHERE pins.id = tags.pin_id
      AND pins.user_id = auth.uid()
    )
  );

-- RLS Policies for import_jobs table
CREATE POLICY "users_can_view_own_import_jobs"
  ON import_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_own_import_jobs"
  ON import_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_import_jobs"
  ON import_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user signup from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    now()
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create user profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pins_updated_at BEFORE UPDATE ON pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
