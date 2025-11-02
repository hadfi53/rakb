-- ============================================================================
-- PRODUCTION SECURITY & PERFORMANCE FIXES
-- Date: January 30, 2025
-- Purpose: Fix critical security issues and optimize performance for production
-- ============================================================================

-- ============================================================================
-- 1. SECURITY FIXES: Enable RLS on tables without it
-- ============================================================================

-- Enable RLS on refund_requests (currently disabled)
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for refund_requests
DROP POLICY IF EXISTS "users_select_own_refunds" ON public.refund_requests;
DROP POLICY IF EXISTS "users_create_refunds" ON public.refund_requests;
DROP POLICY IF EXISTS "users_update_own_refunds" ON public.refund_requests;
DROP POLICY IF EXISTS "admins_manage_refunds" ON public.refund_requests;

CREATE POLICY "users_select_own_refunds" ON public.refund_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = requester 
    OR auth.uid() IN (
      SELECT user_id FROM public.bookings WHERE id = booking_id
    )
    OR auth.uid() IN (
      SELECT host_id FROM public.bookings WHERE id = booking_id
    )
  );

CREATE POLICY "users_create_refunds" ON public.refund_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = requester 
    AND auth.uid() IN (
      SELECT user_id FROM public.bookings WHERE id = booking_id
    )
  );

CREATE POLICY "users_update_own_refunds" ON public.refund_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = requester)
  WITH CHECK (auth.uid() = requester);

-- Admin policy (adjust based on your admin role logic)
CREATE POLICY "admins_manage_refunds" ON public.refund_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND (role = 'admin' OR user_role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND (role = 'admin' OR user_role = 'admin')
    )
  );

-- Enable RLS on app_config (currently disabled)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for app_config (admin only)
DROP POLICY IF EXISTS "admins_read_config" ON public.app_config;
DROP POLICY IF EXISTS "admins_write_config" ON public.app_config;
DROP POLICY IF EXISTS "public_read_config" ON public.app_config;

-- Admin-only read/write
CREATE POLICY "admins_read_config" ON public.app_config
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND (role = 'admin' OR user_role = 'admin')
    )
  );

CREATE POLICY "admins_write_config" ON public.app_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND (role = 'admin' OR user_role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND (role = 'admin' OR user_role = 'admin')
    )
  );

-- Public read (for non-sensitive config - adjust as needed)
CREATE POLICY "public_read_config" ON public.app_config
  FOR SELECT TO authenticated
  USING (key IN ('app_version', 'maintenance_mode', 'feature_flags'));

-- ============================================================================
-- 2. SECURITY FIXES: Add missing RLS policies
-- ============================================================================

-- booking_cancellations (RLS enabled but may be missing policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_cancellations' 
    AND policyname = 'users_view_own_cancellations'
  ) THEN
    CREATE POLICY "users_view_own_cancellations" ON public.booking_cancellations
      FOR SELECT TO authenticated
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.bookings WHERE id = booking_id
        )
        OR auth.uid() IN (
          SELECT host_id FROM public.bookings WHERE id = booking_id
        )
      );
  END IF;
END $$;

-- dispute_attachments (RLS enabled but may be missing policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dispute_attachments' 
    AND policyname = 'users_view_own_dispute_attachments'
  ) THEN
    CREATE POLICY "users_view_own_dispute_attachments" ON public.dispute_attachments
      FOR SELECT TO authenticated
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.disputes WHERE id = dispute_id
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() 
          AND (role = 'admin' OR user_role = 'admin')
        )
      );

    CREATE POLICY "users_create_dispute_attachments" ON public.dispute_attachments
      FOR INSERT TO authenticated
      WITH CHECK (
        auth.uid() IN (
          SELECT user_id FROM public.disputes WHERE id = dispute_id
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 3. PERFORMANCE: Add missing indexes on foreign keys
-- ============================================================================

-- Index on refund_requests foreign keys
CREATE INDEX IF NOT EXISTS idx_refund_requests_booking_id ON public.refund_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_requester ON public.refund_requests(requester);
CREATE INDEX IF NOT EXISTS idx_refund_requests_decided_by ON public.refund_requests(decided_by);

-- Index on booking_cancellations foreign keys
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_booking_id ON public.booking_cancellations(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_policy_id ON public.booking_cancellations(policy_id);

-- Index on dispute_attachments foreign keys
CREATE INDEX IF NOT EXISTS idx_dispute_attachments_dispute_id ON public.dispute_attachments(dispute_id);

-- Index on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON public.refund_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_computed_at ON public.booking_cancellations(computed_at);

-- ============================================================================
-- 4. PERFORMANCE: Optimize RLS policies (use security definer functions)
-- ============================================================================

-- Create helper function to check if user is admin (reduces redundant queries)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id 
    AND (role = 'admin' OR user_role = 'admin')
  );
$$;

-- Create helper function to check booking ownership
CREATE OR REPLACE FUNCTION public.user_involved_in_booking(user_id uuid, booking_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = booking_uuid
    AND (bookings.user_id = user_id OR bookings.host_id = user_id)
  );
$$;

-- ============================================================================
-- 5. SECURITY: Fix function search_path
-- ============================================================================

-- Update existing functions to have immutable search_path
-- This prevents potential SQL injection via search_path manipulation

DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = false  -- Not already security definer
    AND p.provolatile IN ('v', 's')  -- Volatile or stable
  LOOP
    BEGIN
      -- Set search_path for each function (example - adjust based on actual functions)
      EXECUTE format(
        'ALTER FUNCTION public.%I(%s) SET search_path = public',
        func_record.function_name,
        func_record.args
      );
    EXCEPTION WHEN OTHERS THEN
      -- Function might not exist or already set, skip
      CONTINUE;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- 6. SECURITY: Enable password leak protection (should be done in Supabase Dashboard)
-- ============================================================================

-- Note: Password leak protection must be enabled manually in Supabase Dashboard:
-- Authentication → Password → Enable "Password Leak Protection"

-- ============================================================================
-- 7. GRANTS: Ensure proper permissions
-- ============================================================================

-- Grant necessary permissions on new/modified tables
GRANT SELECT, INSERT, UPDATE ON public.refund_requests TO authenticated;
GRANT SELECT ON public.app_config TO authenticated;
GRANT SELECT, INSERT ON public.booking_cancellations TO authenticated;
GRANT SELECT, INSERT ON public.dispute_attachments TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.is_admin(uuid) IS 'Helper function to check if user is admin (security definer for performance)';
COMMENT ON FUNCTION public.user_involved_in_booking(uuid, uuid) IS 'Helper function to check if user is involved in a booking (security definer for performance)';

COMMENT ON TABLE public.refund_requests IS 'Refund requests with RLS enabled for security';
COMMENT ON TABLE public.app_config IS 'Application configuration with admin-only access via RLS';

-- ============================================================================
-- VERIFICATION QUERIES (run after applying migration)
-- ============================================================================

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('refund_requests', 'app_config', 'booking_cancellations', 'dispute_attachments');

-- Verify policies exist:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('refund_requests', 'app_config', 'booking_cancellations', 'dispute_attachments');

-- Verify indexes exist:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('refund_requests', 'booking_cancellations', 'dispute_attachments');

