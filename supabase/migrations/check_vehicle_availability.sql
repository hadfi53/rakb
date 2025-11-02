-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS check_vehicle_availability(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Créer la nouvelle fonction
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
  v_exists BOOLEAN;
BEGIN
  -- Vérifier si le véhicule existe
  SELECT EXISTS (
    SELECT 1 FROM vehicles 
    WHERE id = p_vehicle_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Véhicule non trouvé';
  END IF;

  -- Vérifier que la date de début est avant la date de fin
  IF p_start_date >= p_end_date THEN
    RAISE EXCEPTION 'La date de début doit être antérieure à la date de fin';
  END IF;

  -- Vérifier que la date de début n'est pas dans le passé
  IF p_start_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'La date de début ne peut pas être dans le passé';
  END IF;

  -- Vérifier s'il existe des réservations qui se chevauchent
  RETURN NOT EXISTS (
    SELECT 1 
    FROM bookings
    WHERE vehicle_id = p_vehicle_id
    AND status IN ('pending', 'confirmed', 'in_progress')
    AND (
      (start_date <= p_end_date AND end_date >= p_start_date)
      OR 
      (start_date >= p_start_date AND start_date <= p_end_date)
      OR
      (end_date >= p_start_date AND end_date <= p_end_date)
    )
  );
END;
$$;

-- Créer le trigger pour empêcher les réservations en double
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ne pas vérifier la disponibilité lors de la mise à jour du statut
  IF TG_OP = 'UPDATE' AND OLD.vehicle_id = NEW.vehicle_id 
     AND OLD.start_date = NEW.start_date 
     AND OLD.end_date = NEW.end_date THEN
    RETURN NEW;
  END IF;

  IF NOT check_vehicle_availability(NEW.vehicle_id, NEW.start_date, NEW.end_date) THEN
    RAISE EXCEPTION 'Le véhicule n''est pas disponible pour les dates sélectionnées';
  END IF;

  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS check_booking_availability ON bookings;

-- Créer le nouveau trigger
CREATE TRIGGER check_booking_availability
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_double_booking();

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION check_vehicle_availability(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION prevent_double_booking() TO authenticated; 