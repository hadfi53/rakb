-- ============================================================================
-- RLS Hardening Migration - 2025-02-02
-- ============================================================================
-- Fixes:
-- 1. Missing RLS policies on booking_cancellations and dispute_attachments
-- 2. Ensures all sensitive tables have proper policies
-- 3. Adds admin access where needed
-- ============================================================================

-- ============================================================================
-- 1. BOOKING_CANCELLATIONS RLS Policies
-- ============================================================================

-- Enable RLS (already enabled, but ensure it)
ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;

-- Users can view their own cancellations (via bookings)
CREATE POLICY "Users can view cancellations for their bookings"
ON public.booking_cancellations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_cancellations.booking_id
    AND (
      b.user_id = auth.uid()
      OR b.host_id = auth.uid()
    )
  )
);

-- Admins can view all cancellations
CREATE POLICY "Admins can view all cancellations"
ON public.booking_cancellations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admins can manage cancellations
CREATE POLICY "Admins can manage cancellations"
ON public.booking_cancellations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- 2. DISPUTE_ATTACHMENTS RLS Policies
-- ============================================================================

-- Enable RLS (already enabled, but ensure it)
ALTER TABLE public.dispute_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments for disputes they're involved in
CREATE POLICY "Users can view attachments for their disputes"
ON public.dispute_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_attachments.dispute_id
    AND (
      d.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = d.booking_id
        AND (
          b.user_id = auth.uid()
          OR b.host_id = auth.uid()
        )
      )
    )
  )
);

-- Users can insert attachments for their disputes
CREATE POLICY "Users can insert attachments for their disputes"
ON public.dispute_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_attachments.dispute_id
    AND (
      d.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = d.booking_id
        AND (
          b.user_id = auth.uid()
          OR b.host_id = auth.uid()
        )
      )
    )
  )
);

-- Admins can view all attachments
CREATE POLICY "Admins can view all dispute attachments"
ON public.dispute_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admins can manage all attachments
CREATE POLICY "Admins can manage all dispute attachments"
ON public.dispute_attachments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- 3. Ensure email_queue and email_logs have proper admin-only policies
-- ============================================================================

-- Email queue should be admin-only (already has policy, but ensure it's correct)
-- Check if policy exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'email_queue'
    AND policyname = 'Admins can view email queue'
  ) THEN
    CREATE POLICY "Admins can view email queue"
    ON public.email_queue
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- Email logs should be admin-only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'email_logs'
    AND policyname = 'Admins can view email logs'
  ) THEN
    CREATE POLICY "Admins can view email logs"
    ON public.email_logs
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    );
  END IF;
END $$;

-- ============================================================================
-- 4. Revoke PUBLIC grants on sensitive tables (if any)
-- ============================================================================

-- Ensure no PUBLIC access to sensitive tables
REVOKE ALL ON public.email_queue FROM PUBLIC;
REVOKE ALL ON public.email_logs FROM PUBLIC;
REVOKE ALL ON public.audit_logs FROM PUBLIC;
REVOKE ALL ON public.stripe_customers FROM PUBLIC;
REVOKE ALL ON public.stripe_payment_methods FROM PUBLIC;
REVOKE ALL ON public.payment_transactions FROM PUBLIC;

-- Grant to authenticated role only (RLS will handle permissions)
GRANT SELECT, INSERT, UPDATE ON public.email_queue TO authenticated;
GRANT SELECT, INSERT ON public.email_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stripe_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stripe_payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_transactions TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view cancellations for their bookings" ON public.booking_cancellations IS 
'Allows users to view cancellation records for bookings they are involved in (as renter or host)';

COMMENT ON POLICY "Admins can view all cancellations" ON public.booking_cancellations IS 
'Allows admin users to view all cancellation records';

COMMENT ON POLICY "Users can view attachments for their disputes" ON public.dispute_attachments IS 
'Allows users to view dispute attachments for disputes they are involved in';

COMMENT ON POLICY "Admins can view all dispute attachments" ON public.dispute_attachments IS 
'Allows admin users to view all dispute attachments';

