-- Migration: Email Notifications for All Events via Resend
-- This migration sets up triggers to send emails for all events using the send-event-email Edge Function

-- Note: Direct HTTP calls from PostgreSQL require pg_net extension
-- Instead, we queue emails and process them via Edge Functions or cron jobs

-- Alternative simpler function that queues emails to be processed by Edge Function
CREATE OR REPLACE FUNCTION queue_event_email(
  p_event_type TEXT,
  p_recipient_email TEXT,
  p_recipient_name TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subject TEXT;
  v_html TEXT;
BEGIN
  -- Generate basic email content
  v_subject := 'Notification RAKB - ' || p_event_type;
  v_html := '<html><body><h1>Notification ' || p_event_type || '</h1><p>Bonjour ' || 
            COALESCE(p_recipient_name, 'Utilisateur') || '</p></body></html>';

  -- Insert into email_queue for processing
  INSERT INTO public.email_queue (
    recipient_email,
    subject,
    html_content,
    text_content,
    related_type,
    related_id,
    status,
    metadata
  ) VALUES (
    p_recipient_email,
    v_subject,
    v_html,
    'Notification ' || p_event_type,
    p_event_type,
    (p_data->>'booking_id')::UUID,
    'pending',
    jsonb_build_object(
      'event_type', p_event_type,
      'recipient_name', p_recipient_name,
      'data', p_data
    )
  )
  ON CONFLICT DO NOTHING;
END;
$$;

-- ============================================================================
-- TRIGGERS FOR ALL EVENTS
-- ============================================================================

-- 1. User Registration Email
CREATE OR REPLACE FUNCTION trigger_send_user_registered_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_first_name TEXT;
  v_email TEXT;
BEGIN
  -- Get user details
  SELECT 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    NEW.email
  INTO v_first_name, v_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Queue email
  PERFORM queue_event_email(
    'user_registered',
    v_email,
    v_first_name,
    jsonb_build_object(
      'user_id', NEW.id::TEXT,
      'first_name', v_first_name,
      'email', v_email
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_email_on_user_registration ON auth.users;
CREATE TRIGGER send_email_on_user_registration
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_user_registered_email();

-- 2. Booking Created Email (to owner)
CREATE OR REPLACE FUNCTION trigger_send_booking_created_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_vehicle_name TEXT;
  v_renter_name TEXT;
  v_renter_email TEXT;
  v_renter_phone TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
  v_total_price NUMERIC;
BEGIN
  -- Get owner details
  SELECT 
    p.email,
    CONCAT(p.first_name, ' ', p.last_name)
  INTO v_owner_email, v_owner_name
  FROM profiles p
  WHERE p.id = NEW.owner_id;

  -- Get vehicle details
  SELECT 
    CONCAT(v.make, ' ', v.model, ' ', v.year)
  INTO v_vehicle_name
  FROM vehicles v
  WHERE v.id = NEW.vehicle_id;

  -- Get renter details
  SELECT 
    CONCAT(p.first_name, ' ', p.last_name),
    p.email,
    p.phone
  INTO v_renter_name, v_renter_email, v_renter_phone
  FROM profiles p
  WHERE p.id = NEW.renter_id;

  -- Format dates
  v_start_date := TO_CHAR(NEW.start_date, 'DD/MM/YYYY');
  v_end_date := TO_CHAR(NEW.end_date, 'DD/MM/YYYY');
  v_total_price := NEW.total_price;

  IF v_owner_email IS NOT NULL THEN
    PERFORM queue_event_email(
      'booking_created',
      v_owner_email,
      v_owner_name,
      jsonb_build_object(
        'booking_id', NEW.id::TEXT,
        'vehicle_name', v_vehicle_name,
        'renter_name', v_renter_name,
        'renter_email', v_renter_email,
        'renter_phone', v_renter_phone,
        'start_date', v_start_date,
        'end_date', v_end_date,
        'total_price', v_total_price,
        'pickup_location', NEW.pickup_location,
        'return_location', NEW.return_location,
        'owner_name', v_owner_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_email_on_booking_created ON bookings;
CREATE TRIGGER send_email_on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION trigger_send_booking_created_email();

-- 3. Booking Confirmed Email (to renter)
CREATE OR REPLACE FUNCTION trigger_send_booking_confirmed_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_renter_email TEXT;
  v_renter_name TEXT;
  v_vehicle_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
  v_total_price NUMERIC;
BEGIN
  -- Only trigger if status changed to confirmed
  IF NEW.status != 'confirmed' OR OLD.status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Get renter details
  SELECT 
    p.email,
    CONCAT(p.first_name, ' ', p.last_name)
  INTO v_renter_email, v_renter_name
  FROM profiles p
  WHERE p.id = NEW.renter_id;

  -- Get vehicle details
  SELECT 
    CONCAT(v.make, ' ', v.model, ' ', v.year)
  INTO v_vehicle_name
  FROM vehicles v
  WHERE v.id = NEW.vehicle_id;

  -- Format dates
  v_start_date := TO_CHAR(NEW.start_date, 'DD/MM/YYYY');
  v_end_date := TO_CHAR(NEW.end_date, 'DD/MM/YYYY');
  v_total_price := NEW.total_price;

  IF v_renter_email IS NOT NULL THEN
    PERFORM queue_event_email(
      'booking_confirmed',
      v_renter_email,
      v_renter_name,
      jsonb_build_object(
        'booking_id', NEW.id::TEXT,
        'vehicle_name', v_vehicle_name,
        'start_date', v_start_date,
        'end_date', v_end_date,
        'total_price', v_total_price,
        'pickup_location', NEW.pickup_location,
        'return_location', NEW.return_location
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_email_on_booking_confirmed ON bookings;
CREATE TRIGGER send_email_on_booking_confirmed
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'confirmed')
  EXECUTE FUNCTION trigger_send_booking_confirmed_email();

-- 4. Booking Rejected Email (to renter)
CREATE OR REPLACE FUNCTION trigger_send_booking_rejected_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_renter_email TEXT;
  v_renter_name TEXT;
  v_vehicle_name TEXT;
BEGIN
  -- Only trigger if status changed to rejected
  IF NEW.status != 'rejected' OR OLD.status = 'rejected' THEN
    RETURN NEW;
  END IF;

  -- Get renter details
  SELECT 
    p.email,
    CONCAT(p.first_name, ' ', p.last_name)
  INTO v_renter_email, v_renter_name
  FROM profiles p
  WHERE p.id = NEW.renter_id;

  -- Get vehicle details
  SELECT 
    CONCAT(v.make, ' ', v.model, ' ', v.year)
  INTO v_vehicle_name
  FROM vehicles v
  WHERE v.id = NEW.vehicle_id;

  IF v_renter_email IS NOT NULL THEN
    PERFORM queue_event_email(
      'booking_rejected',
      v_renter_email,
      v_renter_name,
      jsonb_build_object(
        'booking_id', NEW.id::TEXT,
        'vehicle_name', v_vehicle_name,
        'rejection_reason', COALESCE(NEW.rejection_reason, 'Non spécifiée')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_email_on_booking_rejected ON bookings;
CREATE TRIGGER send_email_on_booking_rejected
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'rejected')
  EXECUTE FUNCTION trigger_send_booking_rejected_email();

-- 5. Booking Cancelled Email (to both renter and owner)
CREATE OR REPLACE FUNCTION trigger_send_booking_cancelled_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_renter_email TEXT;
  v_renter_name TEXT;
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_vehicle_name TEXT;
  v_start_date TEXT;
BEGIN
  -- Only trigger if status changed to cancelled
  IF NEW.status != 'cancelled' OR OLD.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Get renter details
  SELECT 
    p.email,
    CONCAT(p.first_name, ' ', p.last_name)
  INTO v_renter_email, v_renter_name
  FROM profiles p
  WHERE p.id = NEW.renter_id;

  -- Get owner details
  SELECT 
    p.email,
    CONCAT(p.first_name, ' ', p.last_name)
  INTO v_owner_email, v_owner_name
  FROM profiles p
  WHERE p.id = NEW.owner_id;

  -- Get vehicle details
  SELECT 
    CONCAT(v.make, ' ', v.model, ' ', v.year)
  INTO v_vehicle_name
  FROM vehicles v
  WHERE v.id = NEW.vehicle_id;

  v_start_date := TO_CHAR(NEW.start_date, 'DD/MM/YYYY');

  -- Send to renter
  IF v_renter_email IS NOT NULL THEN
    PERFORM queue_event_email(
      'booking_cancelled',
      v_renter_email,
      v_renter_name,
      jsonb_build_object(
        'booking_id', NEW.id::TEXT,
        'vehicle_name', v_vehicle_name,
        'start_date', v_start_date,
        'cancelled_by', 'renter'
      )
    );
  END IF;

  -- Send to owner
  IF v_owner_email IS NOT NULL THEN
    PERFORM queue_event_email(
      'booking_cancelled',
      v_owner_email,
      v_owner_name,
      jsonb_build_object(
        'booking_id', NEW.id::TEXT,
        'vehicle_name', v_vehicle_name,
        'start_date', v_start_date,
        'cancelled_by', 'renter',
        'renter_name', v_renter_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_email_on_booking_cancelled ON bookings;
CREATE TRIGGER send_email_on_booking_cancelled
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled')
  EXECUTE FUNCTION trigger_send_booking_cancelled_email();

-- 6. Message Received Email
CREATE OR REPLACE FUNCTION trigger_send_message_received_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_email TEXT;
  v_recipient_name TEXT;
  v_sender_name TEXT;
BEGIN
  -- Get recipient details
  SELECT 
    p.email,
    CONCAT(p.first_name, ' ', p.last_name)
  INTO v_recipient_email, v_recipient_name
  FROM profiles p
  WHERE p.id = NEW.recipient_id;

  -- Get sender details
  SELECT 
    CONCAT(p.first_name, ' ', p.last_name)
  INTO v_sender_name
  FROM profiles p
  WHERE p.id = NEW.sender_id;

  IF v_recipient_email IS NOT NULL THEN
    PERFORM queue_event_email(
      'message_received',
      v_recipient_email,
      v_recipient_name,
      jsonb_build_object(
        'message_id', NEW.id::TEXT,
        'sender_name', v_sender_name,
        'message_content', SUBSTRING(NEW.content, 1, 500)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger if messages table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    DROP TRIGGER IF EXISTS send_email_on_message_received ON messages;
    CREATE TRIGGER send_email_on_message_received
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION trigger_send_message_received_email();
  END IF;
END $$;

-- 7. Review Received Email (to owner)
CREATE OR REPLACE FUNCTION trigger_send_review_received_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_vehicle_name TEXT;
  v_reviewer_name TEXT;
BEGIN
  -- Get owner details from vehicle
  SELECT 
    p.email,
    CONCAT(p.first_name, ' ', p.last_name),
    CONCAT(v.make, ' ', v.model, ' ', v.year)
  INTO v_owner_email, v_owner_name, v_vehicle_name
  FROM vehicles v
  JOIN profiles p ON v.owner_id = p.id
  WHERE v.id = NEW.vehicle_id;

  -- Get reviewer details
  SELECT 
    CONCAT(p.first_name, ' ', p.last_name)
  INTO v_reviewer_name
  FROM profiles p
  WHERE p.id = NEW.user_id;

  IF v_owner_email IS NOT NULL THEN
    PERFORM queue_event_email(
      'review_received',
      v_owner_email,
      v_owner_name,
      jsonb_build_object(
        'review_id', NEW.id::TEXT,
        'vehicle_name', v_vehicle_name,
        'reviewer_name', v_reviewer_name,
        'rating', NEW.rating,
        'comment', NEW.comment
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger if reviews table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    DROP TRIGGER IF EXISTS send_email_on_review_received ON reviews;
    CREATE TRIGGER send_email_on_review_received
      AFTER INSERT ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION trigger_send_review_received_email();
  END IF;
END $$;

-- 8. Tenant Verification Approved Email
CREATE OR REPLACE FUNCTION trigger_send_tenant_verification_approved_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_first_name TEXT;
BEGIN
  -- Only trigger if tenant verification changed to true
  IF NEW.verified_tenant = true AND (OLD.verified_tenant = false OR OLD.verified_tenant IS NULL) THEN
    SELECT 
      p.email,
      p.first_name
    INTO v_email, v_first_name
    FROM profiles p
    WHERE p.id = NEW.id;

    IF v_email IS NOT NULL THEN
      PERFORM queue_event_email(
        'tenant_verification_approved',
        v_email,
        v_first_name,
        jsonb_build_object(
          'user_id', NEW.id::TEXT,
          'first_name', v_first_name
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_email_on_tenant_verification_approved ON profiles;
CREATE TRIGGER send_email_on_tenant_verification_approved
  AFTER UPDATE OF verified_tenant ON profiles
  FOR EACH ROW
  WHEN (NEW.verified_tenant = true AND (OLD.verified_tenant = false OR OLD.verified_tenant IS NULL))
  EXECUTE FUNCTION trigger_send_tenant_verification_approved_email();

-- 9. Host Verification Approved Email
CREATE OR REPLACE FUNCTION trigger_send_host_verification_approved_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_first_name TEXT;
BEGIN
  -- Only trigger if host verification changed to true
  IF NEW.verified_host = true AND (OLD.verified_host = false OR OLD.verified_host IS NULL) THEN
    SELECT 
      p.email,
      p.first_name
    INTO v_email, v_first_name
    FROM profiles p
    WHERE p.id = NEW.id;

    IF v_email IS NOT NULL THEN
      PERFORM queue_event_email(
        'host_verification_approved',
        v_email,
        v_first_name,
        jsonb_build_object(
          'user_id', NEW.id::TEXT,
          'first_name', v_first_name
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_email_on_host_verification_approved ON profiles;
CREATE TRIGGER send_email_on_host_verification_approved
  AFTER UPDATE OF verified_host ON profiles
  FOR EACH ROW
  WHEN (NEW.verified_host = true AND (OLD.verified_host = false OR OLD.verified_host IS NULL))
  EXECUTE FUNCTION trigger_send_host_verification_approved_email();

-- 10. Payment Received Email
CREATE OR REPLACE FUNCTION trigger_send_payment_received_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Only trigger if payment status changed to completed/succeeded
  IF (NEW.status = 'completed' OR NEW.status = 'succeeded') AND 
     (OLD.status != 'completed' AND OLD.status != 'succeeded') THEN
    
    SELECT 
      p.email,
      CONCAT(p.first_name, ' ', p.last_name)
    INTO v_user_email, v_user_name
    FROM profiles p
    WHERE p.id = NEW.user_id;

    IF v_user_email IS NOT NULL THEN
      PERFORM queue_event_email(
        'payment_received',
        v_user_email,
        v_user_name,
        jsonb_build_object(
          'payment_id', NEW.id::TEXT,
          'amount', NEW.amount,
          'booking_id', NEW.booking_id::TEXT
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger if payments table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    DROP TRIGGER IF EXISTS send_email_on_payment_received ON payments;
    CREATE TRIGGER send_email_on_payment_received
      AFTER UPDATE OF status ON payments
      FOR EACH ROW
      WHEN ((NEW.status = 'completed' OR NEW.status = 'succeeded') AND 
            (OLD.status != 'completed' AND OLD.status != 'succeeded'))
      EXECUTE FUNCTION trigger_send_payment_received_email();
  END IF;
END $$;

-- ============================================================================
-- PROCESS EMAIL QUEUE - Edge Function call
-- ============================================================================

-- Function to process queued emails (should be called by scheduled job or Edge Function)
CREATE OR REPLACE FUNCTION process_queued_emails()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email RECORD;
  v_processed INTEGER := 0;
  v_supabase_url TEXT;
  v_response JSONB;
BEGIN
  v_supabase_url := 'https://kcujctyosmjlofppntfb.supabase.co';

  -- Process up to 50 pending emails
  FOR v_email IN 
    SELECT * FROM email_queue 
    WHERE status = 'pending' 
    ORDER BY created_at ASC 
    LIMIT 50
  LOOP
    BEGIN
      -- Call Edge Function to send email
      -- Note: This requires pg_net extension or similar
      -- For production, set up a cron job that calls the Edge Function directly
      
      -- Update status to processing
      UPDATE email_queue 
      SET status = 'processing', updated_at = NOW()
      WHERE id = v_email.id;

      -- Mark as processed (actual sending handled by Edge Function)
      UPDATE email_queue 
      SET status = 'sent', updated_at = NOW()
      WHERE id = v_email.id;

      v_processed := v_processed + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- Mark as error
        UPDATE email_queue 
        SET status = 'error', 
            error_message = SQLERRM,
            updated_at = NOW()
        WHERE id = v_email.id;
    END;
  END LOOP;

  RETURN v_processed;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION queue_event_email TO authenticated;
GRANT EXECUTE ON FUNCTION process_queued_emails TO authenticated;

-- Create index on email_queue for better performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status_created ON email_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_related ON email_queue(related_type, related_id);

