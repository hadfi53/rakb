-- Migration pour la gestion complète des véhicules
-- Cette migration configure ou améliore les tables suivantes:
-- 1. vehicles (voitures disponibles)
-- 2. vehicle_features (caractéristiques des véhicules)
-- 3. bookings (réservations)
-- 4. availability (disponibilité des véhicules)

-- Définir nos types d'énumération si non existants
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
        CREATE TYPE vehicle_status AS ENUM ('available', 'rented', 'maintenance', 'unavailable');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_transmission') THEN
        CREATE TYPE vehicle_transmission AS ENUM ('automatic', 'manual', 'semi-automatic');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_fuel_type') THEN
        CREATE TYPE vehicle_fuel_type AS ENUM ('diesel', 'essence', 'hybrid', 'electric');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_category') THEN
        CREATE TYPE vehicle_category AS ENUM ('SUV', 'Berline', 'Sportive', 'Luxe', 'Électrique', 'Familiale', 'Compacte', 'Utilitaire');
    END IF;
END$$;

-- Table principale des véhicules
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    images TEXT[] DEFAULT '{}',
    status vehicle_status NOT NULL DEFAULT 'available',
    fuel_type vehicle_fuel_type,
    luggage INTEGER,
    mileage INTEGER,
    color TEXT,
    transmission vehicle_transmission,
    seats INTEGER,
    features TEXT[] DEFAULT '{}',
    rating DECIMAL(3,2),
    reviews_count INTEGER DEFAULT 0,
    category vehicle_category,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assurer que la table des véhicules a les bons indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON public.vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON public.vehicles(price_per_day);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles(category);

-- Assurer que RLS est correctement configuré
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les véhicules
DROP POLICY IF EXISTS "Tout le monde peut voir les véhicules disponibles" ON public.vehicles;
CREATE POLICY "Tout le monde peut voir les véhicules disponibles"
    ON public.vehicles FOR SELECT
    USING (status = 'available' OR status = 'rented');

DROP POLICY IF EXISTS "Les propriétaires peuvent gérer leurs propres véhicules" ON public.vehicles;
CREATE POLICY "Les propriétaires peuvent gérer leurs propres véhicules"
    ON public.vehicles FOR ALL
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Trigger pour la mise à jour de la date
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour récupérer tous les véhicules disponibles
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
    AND (category_filter IS NULL OR v.category = category_filter)
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

-- Fonction pour récupérer les véhicules d'un propriétaire
CREATE OR REPLACE FUNCTION public.get_owner_vehicles()
RETURNS SETOF public.vehicles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT v.*
    FROM public.vehicles v
    WHERE v.owner_id = auth.uid()
    ORDER BY v.created_at DESC;
END;
$$;

-- Fonction pour créer un nouveau véhicule
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

-- Fonction pour vérifier la disponibilité d'un véhicule
CREATE OR REPLACE FUNCTION public.check_vehicle_availability(
    p_vehicle_id UUID,
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_available BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.vehicles v
        WHERE v.id = p_vehicle_id
        AND v.status = 'available'
        AND NOT EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.vehicle_id = v.id
            AND b.status IN ('confirmed', 'pending')
            AND (
                (b.start_date <= p_end_date AND b.end_date >= p_start_date)
            )
        )
    ) INTO v_is_available;
    
    RETURN v_is_available;
END;
$$;

-- Fonction pour trouver des dates alternatives
CREATE OR REPLACE FUNCTION public.find_alternative_dates(
    p_vehicle_id UUID,
    p_requested_start_date TIMESTAMP,
    p_requested_end_date TIMESTAMP,
    p_days_range INTEGER DEFAULT 14
)
RETURNS TABLE (
    suggested_start_date TIMESTAMP,
    suggested_end_date TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rental_duration INTEGER;
    v_current_date TIMESTAMP;
    v_end_search_date TIMESTAMP;
BEGIN
    -- Calculer la durée de location demandée
    v_rental_duration := (p_requested_end_date::date - p_requested_start_date::date);
    
    -- Définir la plage de recherche
    v_current_date := p_requested_start_date - (p_days_range || ' days')::interval;
    v_end_search_date := p_requested_end_date + (p_days_range || ' days')::interval;
    
    -- Vérifier si le véhicule existe et est disponible en général
    IF NOT EXISTS (SELECT 1 FROM public.vehicles WHERE id = p_vehicle_id AND status = 'available') THEN
        RETURN;
    END IF;
    
    -- Rechercher des fenêtres de disponibilité
    RETURN QUERY
    WITH booked_dates AS (
        SELECT 
            b.start_date, 
            b.end_date
        FROM 
            public.bookings b
        WHERE 
            b.vehicle_id = p_vehicle_id
            AND b.status IN ('confirmed', 'pending')
            AND (
                b.start_date <= v_end_search_date
                AND b.end_date >= v_current_date
            )
        ORDER BY 
            b.start_date
    ),
    date_ranges AS (
        SELECT
            v_current_date AS range_start,
            COALESCE(MIN(bd.start_date), v_end_search_date) AS range_end
        FROM
            (SELECT 1) dummy
            LEFT JOIN booked_dates bd ON TRUE
        WHERE
            v_current_date < COALESCE(bd.start_date, v_end_search_date)
        
        UNION ALL
        
        SELECT
            bd1.end_date AS range_start,
            COALESCE(MIN(bd2.start_date), v_end_search_date) AS range_end
        FROM
            booked_dates bd1
            LEFT JOIN booked_dates bd2 ON bd2.start_date > bd1.end_date
        WHERE
            bd1.end_date < v_end_search_date
            AND (bd2.start_date IS NULL OR bd2.start_date > bd1.end_date)
    )
    SELECT
        dr.range_start AS suggested_start_date,
        dr.range_start + (v_rental_duration || ' days')::interval AS suggested_end_date
    FROM
        date_ranges dr
    WHERE
        (dr.range_end - dr.range_start) >= make_interval(days => v_rental_duration)
        AND dr.range_start <> p_requested_start_date -- Exclure les dates déjà demandées
    ORDER BY
        ABS(EXTRACT(EPOCH FROM (dr.range_start - p_requested_start_date))) -- Trier par proximité avec les dates demandées
    LIMIT 3;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_available_vehicles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_owner_vehicles TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_vehicle TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_vehicle_availability TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.find_alternative_dates TO authenticated, anon;

GRANT SELECT ON public.vehicles TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.vehicles TO authenticated; 