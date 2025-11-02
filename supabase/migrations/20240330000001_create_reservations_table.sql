-- Create enum for reservation status
CREATE TYPE public.reservation_status AS ENUM (
    'pending',      -- En attente de confirmation du propriétaire
    'confirmed',    -- Confirmée par le propriétaire
    'cancelled',    -- Annulée par l'une des parties
    'completed',    -- Location terminée
    'in_progress'   -- Location en cours
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID NOT NULL REFERENCES public.cars(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    car_owner_id UUID NOT NULL REFERENCES auth.users(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_location GEOGRAPHY(POINT),
    return_location GEOGRAPHY(POINT),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
    status reservation_status NOT NULL DEFAULT 'pending',
    cancellation_reason TEXT,
    payment_intent_id TEXT,
    payment_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT valid_owner CHECK (user_id != car_owner_id)
);

-- Create indexes for performance
CREATE INDEX reservations_car_id_idx ON public.reservations(car_id);
CREATE INDEX reservations_user_id_idx ON public.reservations(user_id);
CREATE INDEX reservations_car_owner_id_idx ON public.reservations(car_owner_id);
CREATE INDEX reservations_status_idx ON public.reservations(status);
CREATE INDEX reservations_date_range_idx ON public.reservations(start_date, end_date);
CREATE INDEX reservations_payment_intent_idx ON public.reservations(payment_intent_id);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reservations"
ON public.reservations FOR SELECT TO authenticated
USING (
    auth.uid() = user_id OR 
    auth.uid() = car_owner_id
);

CREATE POLICY "Users can create reservations"
ON public.reservations FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() != car_owner_id AND
    status = 'pending'
);

-- Separate policies for renters and owners
CREATE POLICY "Renters can update their reservations"
ON public.reservations FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
    auth.uid() = user_id AND 
    status IN ('pending', 'cancelled')
);

CREATE POLICY "Owners can update their reservations"
ON public.reservations FOR UPDATE TO authenticated
USING (auth.uid() = car_owner_id)
WITH CHECK (
    auth.uid() = car_owner_id AND 
    status IN ('confirmed', 'cancelled', 'completed', 'in_progress')
);

-- Function to check car availability
CREATE OR REPLACE FUNCTION check_car_availability(
    car_id_param UUID,
    start_date_param TIMESTAMP WITH TIME ZONE,
    end_date_param TIMESTAMP WITH TIME ZONE,
    exclude_reservation_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1
        FROM public.reservations
        WHERE car_id = car_id_param
        AND status NOT IN ('cancelled')
        AND (id != exclude_reservation_id OR exclude_reservation_id IS NULL)
        AND (
            (start_date_param, end_date_param) OVERLAPS (start_date, end_date)
            OR start_date_param BETWEEN start_date AND end_date
            OR end_date_param BETWEEN start_date AND end_date
        )
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to automatically update reservation status
CREATE OR REPLACE FUNCTION update_reservation_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la réservation vient d'être confirmée et la date de début est dans le passé
    IF NEW.status = 'confirmed' AND NEW.start_date <= CURRENT_TIMESTAMP THEN
        NEW.status = 'in_progress';
    -- Si la réservation est en cours et la date de fin est dans le passé
    ELSIF NEW.status = 'in_progress' AND NEW.end_date <= CURRENT_TIMESTAMP THEN
        NEW.status = 'completed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_reservation_status
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_reservation_status();

-- Trigger for updated_at
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 