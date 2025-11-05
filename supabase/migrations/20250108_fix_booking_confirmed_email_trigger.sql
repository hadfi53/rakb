-- Fix booking confirmed email trigger to use correct column names
-- The bookings table uses: user_id (renter), host_id (owner), car_id (vehicle)
-- Not: renter_id, owner_id, vehicle_id

CREATE OR REPLACE FUNCTION trigger_send_booking_confirmed_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_renter_email TEXT;
  v_renter_name TEXT;
  v_vehicle_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
  v_total_price NUMERIC;
  v_renter_id_from_auth UUID;
BEGIN
  -- Only trigger if status changed to confirmed
  IF NEW.status != 'confirmed' OR OLD.status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Get renter email from auth.users using RPC function
  -- First get the user_id (which is the renter in bookings table)
  v_renter_id_from_auth := NEW.user_id;
  
  -- Get renter email via RPC function
  SELECT email INTO v_renter_email
  FROM get_user_emails(ARRAY[v_renter_id_from_auth])
  LIMIT 1;

  -- Get renter name from profiles
  SELECT 
    CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
  INTO v_renter_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get vehicle details from cars table (not vehicles)
  SELECT 
    CONCAT(
      COALESCE(make, ''), ' ',
      COALESCE(model, ''), ' ',
      COALESCE(year::text, '')
    )
  INTO v_vehicle_name
  FROM cars
  WHERE id = NEW.car_id;

  -- Format dates
  v_start_date := TO_CHAR(NEW.start_date, 'DD/MM/YYYY');
  v_end_date := TO_CHAR(NEW.end_date, 'DD/MM/YYYY');
  v_total_price := NEW.total_amount;

  -- Queue email via queue_event_email function (which will use Resend)
  IF v_renter_email IS NOT NULL THEN
    PERFORM queue_event_email(
      'booking_confirmed',
      v_renter_email,
      COALESCE(v_renter_name, 'Locataire'),
      jsonb_build_object(
        'booking_id', NEW.id::TEXT,
        'vehicle_name', COALESCE(v_vehicle_name, 'Véhicule'),
        'start_date', v_start_date,
        'end_date', v_end_date,
        'total_price', v_total_price,
        'pickup_location', COALESCE(NEW.pickup_location, ''),
        'return_location', COALESCE(NEW.dropoff_location, NEW.pickup_location, '')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS send_email_on_booking_confirmed ON bookings;
CREATE TRIGGER send_email_on_booking_confirmed
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'confirmed')
  EXECUTE FUNCTION trigger_send_booking_confirmed_email();

COMMENT ON FUNCTION trigger_send_booking_confirmed_email() IS 'Sends booking confirmation email via Resend when a booking status changes to confirmed';

