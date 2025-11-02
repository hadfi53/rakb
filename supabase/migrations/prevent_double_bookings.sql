-- Fonction pour vérifier les chevauchements de réservations
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier s'il existe des réservations qui se chevauchent
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE vehicle_id = NEW.vehicle_id
    AND status IN ('pending', 'confirmed', 'in_progress')
    AND id != NEW.id  -- Exclure la réservation en cours de modification
    AND (
      -- Chevauchement complet
      (start_date <= NEW.end_date AND end_date >= NEW.start_date) OR
      -- Début pendant une réservation existante
      (start_date >= NEW.start_date AND start_date <= NEW.end_date) OR
      -- Fin pendant une réservation existante
      (end_date >= NEW.start_date AND end_date <= NEW.end_date)
    )
  ) THEN
    RAISE EXCEPTION 'Ce véhicule est déjà réservé pour cette période';
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
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS prevent_booking_overlap ON bookings;

-- Créer le trigger
CREATE TRIGGER prevent_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_overlap();

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION check_booking_overlap() TO authenticated; 