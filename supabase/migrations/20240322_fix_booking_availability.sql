-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS check_vehicle_availability(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Fonction pour vérifier la disponibilité d'un véhicule
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  p_vehicle_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_available BOOLEAN;
BEGIN
  -- Vérifier si le véhicule existe et est disponible
  IF NOT EXISTS (
    SELECT 1 FROM vehicles 
    WHERE id = p_vehicle_id 
    AND status = 'available'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Vérifier s'il n'y a pas de chevauchement avec d'autres réservations
  SELECT NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE vehicle_id = p_vehicle_id
    AND status IN ('pending', 'confirmed', 'in_progress')
    AND (
      -- Chevauchement complet
      (start_date <= p_end_date AND end_date >= p_start_date)
      OR
      -- Début pendant une réservation existante
      (start_date >= p_start_date AND start_date <= p_end_date)
      OR
      -- Fin pendant une réservation existante
      (end_date >= p_start_date AND end_date <= p_end_date)
    )
  ) INTO v_is_available;

  RETURN v_is_available;
END;
$$;

-- Trigger pour empêcher les réservations en double
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier la disponibilité
  IF NOT check_vehicle_availability(NEW.vehicle_id, NEW.start_date, NEW.end_date) THEN
    RAISE EXCEPTION 'Le véhicule n''est pas disponible pour les dates sélectionnées';
  END IF;

  -- Vérifier que la date de début est avant la date de fin
  IF NEW.start_date >= NEW.end_date THEN
    RAISE EXCEPTION 'La date de début doit être antérieure à la date de fin';
  END IF;

  -- Vérifier que la date de début n'est pas dans le passé
  IF NEW.start_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'La date de début ne peut pas être dans le passé';
  END IF;

  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS check_booking_availability ON bookings;

-- Créer le trigger
CREATE TRIGGER check_booking_availability
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_double_booking();

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION check_vehicle_availability(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION prevent_double_booking() TO authenticated; 