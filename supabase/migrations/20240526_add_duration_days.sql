-- Migration pour ajouter la colonne duration_days à la table bookings
-- et mettre à jour les valeurs existantes

-- Ajouter la colonne duration_days si elle n'existe pas déjà
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS duration_days INTEGER;

-- Mettre à jour les valeurs existantes en calculant la durée à partir des dates
UPDATE public.bookings
SET duration_days = CEIL(EXTRACT(EPOCH FROM (end_date - start_date)) / 86400)
WHERE duration_days IS NULL;

-- Créer une fonction pour calculer automatiquement la durée lors de l'insertion ou de la mise à jour
CREATE OR REPLACE FUNCTION calculate_booking_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la durée en jours
    NEW.duration_days := CEIL(EXTRACT(EPOCH FROM (NEW.end_date - NEW.start_date)) / 86400);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un déclencheur pour calculer automatiquement la durée
DROP TRIGGER IF EXISTS calculate_booking_duration_trigger ON public.bookings;
CREATE TRIGGER calculate_booking_duration_trigger
BEFORE INSERT OR UPDATE OF start_date, end_date ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION calculate_booking_duration();

-- Mettre à jour la fonction request_booking pour stocker la durée calculée
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
  -- Vérifier la disponibilité
  IF NOT EXISTS (
    SELECT 1 FROM check_vehicle_availability(p_vehicle_id, p_start_date, p_end_date) 
    WHERE check_vehicle_availability = TRUE
  ) THEN
    RAISE EXCEPTION 'Le véhicule n''est pas disponible pour ces dates';
  END IF;

  -- Obtenir les informations du véhicule
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
    payment_status,
    duration_days
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
    'preauthorized',
    v_days
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$; 