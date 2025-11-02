-- Drop existing objects
DROP TABLE IF EXISTS public.rentals CASCADE;
DROP TYPE IF EXISTS rental_status CASCADE;

-- Create rental status type
CREATE TYPE rental_status AS ENUM (
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'rejected'
);

-- Create rentals table
CREATE TABLE public.rentals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    renter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status rental_status DEFAULT 'pending' NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    payment_intent_id VARCHAR(255),
    reviewed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,
    completed_at TIMESTAMPTZ,
    notes TEXT
);

-- Create indexes
CREATE INDEX idx_rentals_vehicle_id ON public.rentals(vehicle_id);
CREATE INDEX idx_rentals_renter_id ON public.rentals(renter_id);
CREATE INDEX idx_rentals_owner_id ON public.rentals(owner_id);
CREATE INDEX idx_rentals_status ON public.rentals(status);
CREATE INDEX idx_rentals_dates ON public.rentals(start_date, end_date);

-- Enable RLS
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own rentals"
    ON public.rentals FOR SELECT
    TO authenticated
    USING (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create rentals"
    ON public.rentals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update their own rentals"
    ON public.rentals FOR UPDATE
    TO authenticated
    USING (auth.uid() = renter_id OR auth.uid() = owner_id)
    WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "Users can delete their own rentals"
    ON public.rentals FOR DELETE
    TO authenticated
    USING (auth.uid() = renter_id AND status = 'pending');

-- Create function to get rental details
CREATE OR REPLACE FUNCTION get_rental_details(p_rental_id UUID)
RETURNS TABLE (
    id UUID,
    vehicle_id UUID,
    vehicle_name TEXT,
    renter_id UUID,
    renter_name TEXT,
    owner_id UUID,
    owner_name TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    total_price DECIMAL(10,2),
    status rental_status,
    payment_status VARCHAR(50),
    reviewed BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID,
    cancellation_reason TEXT,
    completed_at TIMESTAMPTZ,
    notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.vehicle_id,
        v.name as vehicle_name,
        r.renter_id,
        CONCAT(rp.first_name, ' ', rp.last_name) as renter_name,
        r.owner_id,
        CONCAT(op.first_name, ' ', op.last_name) as owner_name,
        r.start_date,
        r.end_date,
        r.total_price,
        r.status,
        r.payment_status,
        r.reviewed,
        r.created_at,
        r.updated_at,
        r.cancelled_at,
        r.cancelled_by,
        r.cancellation_reason,
        r.completed_at,
        r.notes
    FROM public.rentals r
    JOIN public.vehicles v ON v.id = r.vehicle_id
    JOIN public.profiles rp ON rp.id = r.renter_id
    JOIN public.profiles op ON op.id = r.owner_id
    WHERE r.id = p_rental_id;
END;
$$; 