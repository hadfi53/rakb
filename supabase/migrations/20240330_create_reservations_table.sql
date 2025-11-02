-- Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id UUID NOT NULL REFERENCES public.cars(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    car_owner_id UUID NOT NULL REFERENCES auth.users(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
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
    auth.uid() != car_owner_id
);

CREATE POLICY "Users can update their own reservations"
ON public.reservations FOR UPDATE TO authenticated
USING (
    auth.uid() = user_id OR 
    auth.uid() = car_owner_id
)
WITH CHECK (
    (auth.uid() = user_id AND status IN ('pending', 'cancelled')) OR
    (auth.uid() = car_owner_id AND status IN ('confirmed', 'cancelled', 'completed'))
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 