-- First, ensure the vehicles table has the correct ID column
ALTER TABLE public.vehicles
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create the bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    renter_id UUID NOT NULL,
    owner_id UUID NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_location TEXT NOT NULL,
    return_location TEXT NOT NULL,
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    base_price DECIMAL(10,2) NOT NULL,
    insurance_fee DECIMAL(10,2) DEFAULT 0,
    service_fee DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_renter FOREIGN KEY (renter_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON public.bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir tous les véhicules" ON public.vehicles;
DROP POLICY IF EXISTS "Les propriétaires peuvent gérer leurs propres véhicules" ON public.vehicles;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

-- Enable RLS on all tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

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

-- Bookings policies
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to bookings
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.vehicles TO authenticated;
GRANT ALL ON public.bookings TO authenticated; 