-- Migration pour corriger le problème de la colonne "category"

-- Vérifie si la colonne "category" existe et l'ajoute si elle n'existe pas
DO $$
BEGIN
    -- Vérifier si la colonne category existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicles'
        AND column_name = 'category'
    ) THEN
        -- La colonne n'existe pas, on l'ajoute
        EXECUTE 'ALTER TABLE public.vehicles ADD COLUMN category vehicle_category';
        
        -- Ajouter un message dans les logs
        RAISE NOTICE 'Colonne category ajoutée à la table vehicles';
    ELSE
        RAISE NOTICE 'La colonne category existe déjà';
    END IF;
    
    -- Créer l'index pour cette colonne si nécessaire
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'vehicles' 
        AND indexname = 'idx_vehicles_category'
    ) THEN
        CREATE INDEX idx_vehicles_category ON public.vehicles(category);
        RAISE NOTICE 'Index idx_vehicles_category créé';
    END IF;
END
$$;

-- Modification de la fonction get_available_vehicles pour gérer le cas où category serait NULL
CREATE OR REPLACE FUNCTION public.get_available_vehicles(
    location_filter TEXT DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    category_filter vehicle_category DEFAULT NULL,
    start_date TIMESTAMP DEFAULT NULL,
    end_date TIMESTAMP DEFAULT NULL
)
RETURNS SETOF public.vehicles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT v.*
    FROM public.vehicles v
    WHERE (v.status = 'available')
    AND (location_filter IS NULL OR v.location ILIKE '%' || location_filter || '%')
    AND (min_price IS NULL OR v.price_per_day >= min_price)
    AND (max_price IS NULL OR v.price_per_day <= max_price)
    AND (category_filter IS NULL OR v.category = category_filter OR (category_filter IS NOT NULL AND v.category IS NULL))
    AND (
        start_date IS NULL OR end_date IS NULL
        OR NOT EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.vehicle_id = v.id
            AND b.status IN ('confirmed', 'pending')
            AND (
                (b.start_date <= end_date AND b.end_date >= start_date)
            )
        )
    )
    ORDER BY v.created_at DESC;
END;
$$;

-- Modification de la fonction create_vehicle pour mieux gérer la catégorie
CREATE OR REPLACE FUNCTION public.create_vehicle(
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
    p_category TEXT DEFAULT NULL,
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
    v_category vehicle_category;
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
    
    -- Convertir la catégorie texte en type enum si fournie
    BEGIN
        IF p_category IS NOT NULL THEN
            v_category := p_category::vehicle_category;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Catégorie invalide: %, sera définie à NULL', p_category;
        v_category := NULL;
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
        v_category,
        p_latitude,
        p_longitude,
        p_is_premium,
        now(),
        now()
    ) RETURNING * INTO v_vehicle;
    
    RETURN v_vehicle;
END;
$$;

-- Accorder à nouveau les permissions
GRANT EXECUTE ON FUNCTION public.get_available_vehicles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_vehicle TO authenticated; 