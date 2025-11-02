-- Ensure notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS trigger_notify_booking_request ON public.bookings;
DROP TRIGGER IF EXISTS trigger_notify_booking_confirmed ON public.bookings;
DROP TRIGGER IF EXISTS trigger_notify_booking_rejected ON public.bookings;

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_related_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        related_id,
        is_read,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_related_id,
        FALSE,
        NOW(),
        NOW()
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify owner of new booking request
CREATE OR REPLACE FUNCTION notify_booking_request() RETURNS TRIGGER AS $$
DECLARE
    v_vehicle_info RECORD;
    v_renter_info RECORD;
BEGIN
    -- Get vehicle and renter information
    SELECT v.make, v.model, v.year, v.owner_id
    INTO v_vehicle_info
    FROM vehicles v
    WHERE v.id = NEW.vehicle_id;

    SELECT p.first_name, p.last_name
    INTO v_renter_info
    FROM profiles p
    WHERE p.id = NEW.renter_id;

    -- Create notification for owner
    PERFORM create_notification(
        v_vehicle_info.owner_id,
        'booking_request',
        'Nouvelle demande de réservation',
        format(
            '%s %s souhaite réserver votre %s %s %s',
            v_renter_info.first_name,
            v_renter_info.last_name,
            v_vehicle_info.make,
            v_vehicle_info.model,
            v_vehicle_info.year
        ),
        NEW.id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify renter of booking confirmation
CREATE OR REPLACE FUNCTION notify_booking_confirmed() RETURNS TRIGGER AS $$
DECLARE
    v_vehicle_info RECORD;
    v_owner_info RECORD;
BEGIN
    -- Get vehicle and owner information
    SELECT v.make, v.model, v.year
    INTO v_vehicle_info
    FROM vehicles v
    WHERE v.id = NEW.vehicle_id;

    SELECT p.first_name, p.last_name
    INTO v_owner_info
    FROM profiles p
    WHERE p.id = NEW.owner_id;

    -- Create notification for renter
    PERFORM create_notification(
        NEW.renter_id,
        'booking_confirmed',
        'Réservation confirmée',
        format(
            'Votre réservation pour %s %s %s a été confirmée par %s %s',
            v_vehicle_info.make,
            v_vehicle_info.model,
            v_vehicle_info.year,
            v_owner_info.first_name,
            v_owner_info.last_name
        ),
        NEW.id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for notifications
CREATE TRIGGER trigger_notify_booking_request
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_booking_request();

CREATE TRIGGER trigger_notify_booking_confirmed
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    WHEN (OLD.status = 'pending' AND NEW.status = 'confirmed')
    EXECUTE FUNCTION notify_booking_confirmed();

-- Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Ensure existing bookings have notifications
INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    is_read,
    created_at,
    updated_at
)
SELECT 
    v.owner_id,
    'booking_request',
    'Nouvelle demande de réservation',
    format(
        '%s %s souhaite réserver votre %s %s %s',
        rp.first_name,
        rp.last_name,
        v.make,
        v.model,
        v.year
    ),
    b.id,
    false,
    b.created_at,
    b.created_at
FROM public.bookings b
JOIN public.vehicles v ON b.vehicle_id = v.id
JOIN public.profiles rp ON b.renter_id = rp.id
WHERE b.status = 'pending'
AND NOT EXISTS (
    SELECT 1 
    FROM public.notifications n 
    WHERE n.related_id = b.id 
    AND n.type = 'booking_request'
); 