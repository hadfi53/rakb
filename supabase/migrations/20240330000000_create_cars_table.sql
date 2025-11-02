-- Enable PostGIS extension for location-based features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum for car transmission types
CREATE TYPE public.transmission_type AS ENUM ('manual', 'automatic');

-- Create enum for car fuel types
CREATE TYPE public.fuel_type AS ENUM ('gasoline', 'diesel', 'electric', 'hybrid');

-- Create cars table
CREATE TABLE IF NOT EXISTS public.cars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE)),
    transmission transmission_type NOT NULL,
    fuel_type fuel_type NOT NULL,
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    seats INTEGER NOT NULL CHECK (seats > 0 AND seats <= 9),
    price_per_day DECIMAL(10, 2) NOT NULL CHECK (price_per_day > 0),
    location GEOGRAPHY(POINT) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'France',
    description TEXT NOT NULL,
    features TEXT[] NOT NULL DEFAULT '{}',
    images TEXT[] NOT NULL DEFAULT '{}',
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_images CHECK (array_length(images, 1) >= 1)
);

-- Create indexes for performance
CREATE INDEX cars_owner_id_idx ON public.cars(owner_id);
CREATE INDEX cars_brand_idx ON public.cars(brand);
CREATE INDEX cars_model_idx ON public.cars(model);
CREATE INDEX cars_city_idx ON public.cars(city);
CREATE INDEX cars_postal_code_idx ON public.cars(postal_code);
CREATE INDEX cars_available_idx ON public.cars(available);
CREATE INDEX cars_location_idx ON public.cars USING GIST(location);
CREATE INDEX cars_price_idx ON public.cars(price_per_day);
CREATE INDEX cars_year_idx ON public.cars(year);
CREATE INDEX cars_transmission_idx ON public.cars(transmission);
CREATE INDEX cars_fuel_type_idx ON public.cars(fuel_type);

-- Enable RLS
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view available cars"
ON public.cars FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create their own cars"
ON public.cars FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own cars"
ON public.cars FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own cars"
ON public.cars FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
    point1 GEOGRAPHY,
    point2 GEOGRAPHY
) RETURNS FLOAT AS $$
BEGIN
    RETURN ST_Distance(point1, point2) / 1000; -- Convert to kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to search cars by location and radius
CREATE OR REPLACE FUNCTION search_cars_by_location(
    search_lat FLOAT,
    search_lng FLOAT,
    radius_km FLOAT
) RETURNS SETOF public.cars AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.cars
    WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
        radius_km * 1000  -- Convert km to meters
    )
    AND available = true
    ORDER BY location <-> ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cars_updated_at
    BEFORE UPDATE ON public.cars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 