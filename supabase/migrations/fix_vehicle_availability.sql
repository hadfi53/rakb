-- Migration pour améliorer la vérification de disponibilité des véhicules
-- Cette migration modifie la fonction get_available_vehicles pour exclure les 
-- véhicules qui ont des réservations ayant des statuts qui les rendent indisponibles

-- Suppression de l'ancienne fonction pour éviter les ambiguïtés
DROP FUNCTION IF EXISTS public.get_available_vehicles(TEXT, DECIMAL, DECIMAL, vehicle_category, TIMESTAMP, TIMESTAMP);

-- Mise à jour de la fonction get_available_vehicles
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
            -- Tous les statuts qui rendent un véhicule indisponible
            AND b.status IN ('pending', 'accepted', 'confirmed', 'in_progress')
            AND (
                -- Vérification de chevauchement de dates
                (b.start_date <= end_date AND b.end_date >= start_date)
            )
        )
    )
    ORDER BY v.created_at DESC;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_available_vehicles(TEXT, DECIMAL, DECIMAL, vehicle_category, TIMESTAMP, TIMESTAMP) TO authenticated, anon;

-- Suppression de l'ancienne fonction check_vehicle_availability pour éviter les ambiguïtés
DROP FUNCTION IF EXISTS public.check_vehicle_availability(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Mettre à jour la fonction check_vehicle_availability pour la même logique
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  vehicle_id UUID,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si le véhicule existe et est disponible
  IF NOT EXISTS (
    SELECT 1 FROM vehicles 
    WHERE id = vehicle_id 
    AND status = 'available'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Vérifier s'il n'y a pas de chevauchement avec d'autres réservations
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.vehicle_id = check_vehicle_availability.vehicle_id
    -- Mise à jour des statuts qui rendent un véhicule indisponible
    AND bookings.status IN ('pending', 'accepted', 'confirmed', 'in_progress')
    AND (
      (bookings.start_date <= check_vehicle_availability.end_date)
      AND
      (bookings.end_date >= check_vehicle_availability.start_date)
    )
  );
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION check_vehicle_availability(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated, anon; 