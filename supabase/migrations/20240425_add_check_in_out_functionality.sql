-- Check if check_in_out_status column exists in bookings table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
                   FROM information_schema.columns 
                   WHERE table_name = 'bookings' 
                   AND column_name = 'check_in_out_status') THEN
        ALTER TABLE bookings 
        ADD COLUMN check_in_out_status text 
        CHECK (check_in_out_status IN ('checked_in', 'checked_out'));
    END IF;
END $$;

-- Create check_in_out_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS check_in_out_photos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('check-in', 'check-out')),
    category text NOT NULL CHECK (category IN ('exterior', 'interior', 'odometer')),
    url text NOT NULL,
    taken_at timestamp with time zone DEFAULT now(),
    taken_by text NOT NULL CHECK (taken_by IN ('owner', 'renter')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_check_in_out_photos_booking_id ON check_in_out_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_check_in_out_photos_type ON check_in_out_photos(type);

-- Enable RLS
ALTER TABLE check_in_out_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own check-in/out photos" ON check_in_out_photos;
DROP POLICY IF EXISTS "Owners can insert check-in photos" ON check_in_out_photos;
DROP POLICY IF EXISTS "Renters can insert check-out photos" ON check_in_out_photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON check_in_out_photos;

-- Create policies
CREATE POLICY "Users can view their own check-in/out photos"
ON check_in_out_photos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id
        AND (b.owner_id = auth.uid() OR b.renter_id = auth.uid())
    )
);

CREATE POLICY "Owners can insert check-in photos"
ON check_in_out_photos FOR INSERT
WITH CHECK (
    type = 'check-in'
    AND taken_by = 'owner'
    AND EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id
        AND b.owner_id = auth.uid()
        AND b.status = 'confirmed'
    )
);

CREATE POLICY "Renters can insert check-out photos"
ON check_in_out_photos FOR INSERT
WITH CHECK (
    type = 'check-out'
    AND taken_by = 'renter'
    AND EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id
        AND b.renter_id = auth.uid()
        AND b.status = 'in_progress'
    )
);

CREATE POLICY "Admins can view all photos"
ON check_in_out_photos FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
);