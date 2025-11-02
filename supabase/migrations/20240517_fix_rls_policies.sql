-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir tous les véhicules" ON public.vehicles;
DROP POLICY IF EXISTS "Les propriétaires peuvent gérer leurs propres véhicules" ON public.vehicles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by users who own them" ON public.profiles;

-- Enable RLS on both tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Vehicles policies
CREATE POLICY "Available vehicles are viewable by everyone"
    ON public.vehicles
    FOR SELECT
    USING (
        status = 'available' 
        OR status = 'rented' 
        OR owner_id = auth.uid()
    );

CREATE POLICY "Owners can insert their own vehicles"
    ON public.vehicles
    FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id 
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'owner'
        )
    );

CREATE POLICY "Owners can update their own vehicles"
    ON public.vehicles
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own vehicles"
    ON public.vehicles
    FOR DELETE
    USING (auth.uid() = owner_id);

-- Grant necessary permissions
GRANT ALL ON public.vehicles TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SEQUENCE vehicles_id_seq TO authenticated; 