-- Add foreign key constraints for bookings table
ALTER TABLE public.bookings
    ADD CONSTRAINT fk_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES public.vehicles(id)
    ON DELETE CASCADE;

-- Enable RLS on bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

CREATE POLICY "Users can view bookings they're involved in"
    ON public.bookings
    FOR SELECT
    USING (
        auth.uid() = renter_id 
        OR auth.uid() IN (
            SELECT owner_id 
            FROM public.vehicles 
            WHERE id = vehicle_id
        )
    );

CREATE POLICY "Users can create their own bookings"
    ON public.bookings
    FOR INSERT
    WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update their own bookings"
    ON public.bookings
    FOR UPDATE
    USING (
        auth.uid() = renter_id 
        OR auth.uid() IN (
            SELECT owner_id 
            FROM public.vehicles 
            WHERE id = vehicle_id
        )
    )
    WITH CHECK (
        auth.uid() = renter_id 
        OR auth.uid() IN (
            SELECT owner_id 
            FROM public.vehicles 
            WHERE id = vehicle_id
        )
    );

CREATE POLICY "Users can delete their own bookings"
    ON public.bookings
    FOR DELETE
    USING (auth.uid() = renter_id);

-- Grant necessary permissions
GRANT ALL ON public.bookings TO authenticated; 