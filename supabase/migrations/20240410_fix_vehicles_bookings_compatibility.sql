-- Migration pour assurer la compatibilité entre les tables vehicles et bookings
-- Cette migration résout les problèmes potentiels de structure pour le système de réservation

-- S'assurer que les colonnes nécessaires existent dans la table vehicles
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS price_per_day DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

-- Créer une fonction pour vérifier les disponibilités des véhicules en tenant compte des différentes structures de données
CREATE OR REPLACE FUNCTION check_vehicle_availability_v2(
  p_vehicle_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si le véhicule existe et est disponible (compatible avec différentes structures de colonnes)
  IF NOT EXISTS (
    SELECT 1 FROM vehicles 
    WHERE id = p_vehicle_id 
    AND (status = 'available' OR coalesce(status, 'available') = 'available')
  ) THEN
    RETURN FALSE;
  END IF;

  -- Vérifier s'il n'y a pas de chevauchement avec d'autres réservations
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.vehicle_id = check_vehicle_availability_v2.p_vehicle_id
    AND bookings.status IN ('pending', 'accepted', 'confirmed', 'in_progress')
    AND (
      (bookings.start_date <= check_vehicle_availability_v2.p_end_date)
      AND
      (bookings.end_date >= check_vehicle_availability_v2.p_start_date)
    )
  );
END;
$$;

-- Mettre à jour la fonction request_booking pour utiliser la nouvelle fonction de vérification
CREATE OR REPLACE FUNCTION request_booking(
  p_vehicle_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_pickup_location TEXT,
  p_return_location TEXT,
  p_insurance_option TEXT DEFAULT 'basic'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_base_price DECIMAL(10,2);
  v_days INTEGER;
  v_insurance_fee DECIMAL(10,2) := 0;
  v_service_fee DECIMAL(10,2);
  v_total_price DECIMAL(10,2);
  v_deposit_amount DECIMAL(10,2) := 5000; -- Dépôt standard de 5000 MAD
  v_booking_id UUID;
BEGIN
  -- Vérifier la disponibilité avec la nouvelle fonction
  IF NOT check_vehicle_availability_v2(p_vehicle_id, p_start_date, p_end_date) THEN
    RAISE EXCEPTION 'Le véhicule n''est pas disponible pour ces dates';
  END IF;

  -- Obtenir les informations du véhicule (s'assurer qu'on utilise price_per_day directement)
  SELECT owner_id, price_per_day
  INTO v_owner_id, v_base_price
  FROM vehicles
  WHERE id = p_vehicle_id;

  -- Calculer le nombre de jours
  v_days := CEIL(EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / 86400);
  
  -- Calculer les frais d'assurance
  IF p_insurance_option = 'premium' THEN
    v_insurance_fee := v_days * 100; -- 100 MAD/jour
  ELSIF p_insurance_option = 'standard' THEN
    v_insurance_fee := v_days * 50; -- 50 MAD/jour
  END IF;
  
  -- Calculer les frais de service (10%)
  v_service_fee := (v_base_price * v_days) * 0.10;
  
  -- Calculer le prix total
  v_total_price := (v_base_price * v_days) + v_insurance_fee + v_service_fee;

  -- Créer la réservation
  INSERT INTO bookings (
    vehicle_id,
    renter_id,
    owner_id,
    start_date,
    end_date,
    pickup_location,
    return_location,
    base_price,
    insurance_fee,
    service_fee,
    total_price,
    deposit_amount,
    status,
    payment_status
  )
  VALUES (
    p_vehicle_id,
    auth.uid(),
    v_owner_id,
    p_start_date,
    p_end_date,
    p_pickup_location,
    p_return_location,
    v_base_price * v_days,
    v_insurance_fee,
    v_service_fee,
    v_total_price,
    v_deposit_amount,
    'pending',
    'preauthorized'
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION check_vehicle_availability_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION request_booking TO authenticated; 