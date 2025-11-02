-- Drop existing payment_status type if it exists
DROP TYPE IF EXISTS payment_status CASCADE;

-- Create new payment_status enum
CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- Create payment_method enum
CREATE TYPE payment_method AS ENUM (
  'credit_card',
  'inwi_money',
  'western_union'
);

-- Add new columns to bookings table
ALTER TABLE bookings
  DROP COLUMN IF EXISTS payment_intent_id,
  ADD COLUMN IF NOT EXISTS payment_method payment_method,
  ADD COLUMN IF NOT EXISTS payment_data jsonb; 