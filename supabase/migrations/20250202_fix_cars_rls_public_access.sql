-- Fix RLS Policy for Cars Table to Allow Public Access
-- This migration fixes the issue where unauthenticated users cannot view cars

-- Drop the existing policy that only allows authenticated users
DROP POLICY IF EXISTS "Anyone can view available cars" ON public.cars;

-- Create a new policy that allows everyone (including anonymous users) to view available and approved cars
CREATE POLICY "Anyone can view available cars"
ON public.cars FOR SELECT
TO public
USING (is_available = true AND is_approved = true);

-- Verify the policy was created
-- You can check with: SELECT * FROM pg_policies WHERE tablename = 'cars';

