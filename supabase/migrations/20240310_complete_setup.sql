-- First, drop everything in the correct order with CASCADE
DO $$ 
BEGIN
    -- Drop triggers with CASCADE to handle dependencies
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
    DROP TRIGGER IF EXISTS update_profile_rating_trigger ON reviews CASCADE;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    -- Drop functions with CASCADE
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS update_profile_rating() CASCADE;
EXCEPTION
    WHEN undefined_function THEN null;
END $$;

DO $$ 
BEGIN
    -- Drop tables in correct order (child tables first)
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS social_profiles CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    -- Drop types with CASCADE
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS social_platform CASCADE;
    DROP TYPE IF EXISTS user_language CASCADE;
    DROP TYPE IF EXISTS verification_status CASCADE;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Now create everything from scratch

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('owner', 'renter', 'admin');
CREATE TYPE social_platform AS ENUM ('facebook', 'instagram', 'linkedin', 'twitter');
CREATE TYPE user_language AS ENUM ('ar', 'fr', 'en');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Create the profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    role user_role DEFAULT 'renter',
    languages user_language[] DEFAULT '{fr}'::user_language[],
    is_email_verified BOOLEAN DEFAULT false,
    is_phone_verified BOOLEAN DEFAULT false,
    is_identity_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create social profiles table
CREATE TABLE social_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    profile_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, platform)
);

-- Create reviews table
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    rental_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policies for social profiles
CREATE POLICY "Users can view all social profiles"
ON social_profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can manage own social profiles"
ON social_profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policies for reviews
CREATE POLICY "Users can view all reviews"
ON reviews FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Create function to update average rating
CREATE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET rating = (
        SELECT ROUND(CAST(AVG(rating) AS NUMERIC), 2)
        FROM reviews
        WHERE reviewed_id = NEW.reviewed_id
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE reviewed_id = NEW.reviewed_id
    )
    WHERE id = NEW.reviewed_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating rating
CREATE TRIGGER update_profile_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_profile_rating();

-- Create trigger for automatically creating a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    default_role user_role;
BEGIN
    -- Set default role to 'renter' if not specified
    default_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        'renter'::user_role
    );

    -- Debug log
    RAISE NOTICE 'Creating profile for user % with role %', NEW.id, default_role;

    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        avatar_url,
        role
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        default_role
    );

    -- Debug log
    RAISE NOTICE 'Profile created successfully';
    
    RETURN NEW;
EXCEPTION WHEN others THEN
    -- Log any errors
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX idx_social_profiles_user_id ON social_profiles(user_id);

-- Grant necessary permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Allow public to use the uuid-ossp extension
GRANT EXECUTE ON FUNCTION uuid_generate_v4() TO public;

-- Allow authenticated users to use the handle_new_user function
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- Ensure the trigger has proper permissions
GRANT TRIGGER ON auth.users TO authenticated;
GRANT TRIGGER ON auth.users TO anon;

-- Allow the trigger function to access auth.users
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Insert default admin user if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'admin@rakeb.com'
    ) THEN
        -- Note: You'll need to set this up manually in the Supabase dashboard
        -- as we can't directly insert into auth.users
        NULL;
    END IF;
END $$; 