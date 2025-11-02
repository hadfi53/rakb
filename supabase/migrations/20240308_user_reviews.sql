-- Create enum types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_platform') THEN
        CREATE TYPE social_platform AS ENUM ('linkedin', 'instagram', 'facebook');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_language') THEN
        CREATE TYPE user_language AS ENUM ('fr', 'en', 'ar');
    END IF;
END $$;

-- Add languages array to profiles if columns don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'languages') THEN
        ALTER TABLE profiles ADD COLUMN languages user_language[] DEFAULT ARRAY['fr']::user_language[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
        ALTER TABLE profiles ADD COLUMN email_verified boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE profiles ADD COLUMN phone_verified boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE profiles ADD COLUMN is_verified boolean DEFAULT false;
    END IF;
END $$;

-- Create social profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS social_profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  url text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, platform)
);

-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  rental_id uuid, -- Removed reference as rentals table might not exist yet
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_user_id') THEN
        CREATE INDEX idx_reviews_user_id ON reviews(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_reviewer_id') THEN
        CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_rental_id') THEN
        CREATE INDEX idx_reviews_rental_id ON reviews(rental_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_social_profiles_user_id') THEN
        CREATE INDEX idx_social_profiles_user_id ON social_profiles(user_id);
    END IF;
END $$;

-- Create function to update average rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE user_id = NEW.user_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE user_id = NEW.user_id
    )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating user rating if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_rating_trigger') THEN
        CREATE TRIGGER update_user_rating_trigger
        AFTER INSERT OR UPDATE OR DELETE ON reviews
        FOR EACH ROW
        EXECUTE FUNCTION update_user_rating();
    END IF;
END $$;

-- Add RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for others" ON reviews;
DROP POLICY IF EXISTS "Social profiles are viewable by everyone" ON social_profiles;
DROP POLICY IF EXISTS "Users can manage their own social profiles" ON social_profiles;

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
ON reviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create reviews for others"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (
  reviewer_id = auth.uid() AND
  user_id != auth.uid()
);

-- Social profiles policies
CREATE POLICY "Social profiles are viewable by everyone"
ON social_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own social profiles"
ON social_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid()); 