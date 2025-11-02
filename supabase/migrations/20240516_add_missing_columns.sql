-- Add missing columns to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS category vehicle_category,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Drop existing function to avoid overloading issues
DROP FUNCTION IF EXISTS public.create_vehicle;

-- Create the new function
CREATE FUNCTION public.create_vehicle_v2(
    p_make TEXT,
    p_model TEXT,
    p_year INTEGER,
    p_price_per_day DECIMAL,
    p_location TEXT,
    p_description TEXT DEFAULT NULL,
    p_images TEXT[] DEFAULT '{}',
    p_fuel_type vehicle_fuel_type DEFAULT NULL,
    p_luggage INTEGER DEFAULT NULL,
    p_mileage INTEGER DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_transmission vehicle_transmission DEFAULT NULL,
    p_seats INTEGER DEFAULT NULL,
    p_features TEXT[] DEFAULT '{}',
    p_category vehicle_category DEFAULT NULL,
    p_latitude DECIMAL DEFAULT NULL,
    p_longitude DECIMAL DEFAULT NULL,
    p_is_premium BOOLEAN DEFAULT FALSE
)
RETURNS public.vehicles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_vehicle public.vehicles;
BEGIN
    -- Vérifier si l'utilisateur est authentifié
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;
    
    -- Vérifier si l'utilisateur est un propriétaire
    DECLARE
        user_role text;
    BEGIN
        SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
        IF user_role != 'owner' THEN
            RAISE EXCEPTION 'Seuls les propriétaires peuvent ajouter des véhicules';
        END IF;
    END;
    
    -- Insérer le nouveau véhicule
    INSERT INTO public.vehicles (
        owner_id,
        make,
        model,
        year,
        price_per_day,
        location,
        description,
        images,
        fuel_type,
        luggage,
        mileage,
        color,
        transmission,
        seats,
        features,
        category,
        latitude,
        longitude,
        is_premium,
        created_at,
        updated_at
    ) VALUES (
        auth.uid(),
        p_make,
        p_model,
        p_year,
        p_price_per_day,
        p_location,
        p_description,
        p_images,
        p_fuel_type,
        p_luggage,
        p_mileage,
        p_color,
        p_transmission,
        p_seats,
        p_features,
        p_category,
        p_latitude,
        p_longitude,
        p_is_premium,
        now(),
        now()
    ) RETURNING * INTO v_vehicle;
    
    RETURN v_vehicle;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_vehicle_v2 TO authenticated; 