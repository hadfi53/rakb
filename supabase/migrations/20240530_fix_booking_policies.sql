-- Disable RLS temporarily
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "renter_select_bookings" ON public.bookings;
DROP POLICY IF EXISTS "owner_select_bookings" ON public.bookings;
DROP POLICY IF EXISTS "renter_insert_bookings" ON public.bookings;
DROP POLICY IF EXISTS "renter_update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "owner_update_bookings" ON public.bookings;

-- Create new policies that handle both direct owner_id and vehicle ownership
CREATE POLICY "users_select_bookings" ON public.bookings
    FOR SELECT TO authenticated
    USING (
        auth.uid() = renter_id 
        OR auth.uid() = owner_id
        OR auth.uid() IN (
            SELECT owner_id 
            FROM public.vehicles 
            WHERE id = vehicle_id
        )
    );

CREATE POLICY "users_insert_bookings" ON public.bookings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "users_update_bookings" ON public.bookings
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = renter_id 
        OR auth.uid() = owner_id
        OR auth.uid() IN (
            SELECT owner_id 
            FROM public.vehicles 
            WHERE id = vehicle_id
        )
    )
    WITH CHECK (
        auth.uid() = renter_id 
        OR auth.uid() = owner_id
        OR auth.uid() IN (
            SELECT owner_id 
            FROM public.vehicles 
            WHERE id = vehicle_id
        )
    );

CREATE POLICY "users_delete_bookings" ON public.bookings
    FOR DELETE TO authenticated
    USING (auth.uid() = renter_id);

-- Re-enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.bookings TO authenticated; 