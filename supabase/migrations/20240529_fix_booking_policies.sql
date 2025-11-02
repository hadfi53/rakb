-- Disable RLS temporarily
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view bookings they're involved in" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

-- Create simpler and more direct policies
CREATE POLICY "Users can view their bookings"
    ON public.bookings
    FOR SELECT
    USING (
        auth.uid() = renter_id 
        OR auth.uid() = owner_id
    );

CREATE POLICY "Users can create their own bookings"
    ON public.bookings
    FOR INSERT
    WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update their bookings"
    ON public.bookings
    FOR UPDATE
    USING (
        auth.uid() = renter_id 
        OR auth.uid() = owner_id
    )
    WITH CHECK (
        auth.uid() = renter_id 
        OR auth.uid() = owner_id
    );

CREATE POLICY "Users can delete their own bookings"
    ON public.bookings
    FOR DELETE
    USING (auth.uid() = renter_id);

-- Re-enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.bookings TO authenticated; 