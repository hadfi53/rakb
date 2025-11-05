-- ============================================================================
-- Indexes and Performance Optimization Migration - 2025-02-02
-- ============================================================================
-- Fixes:
-- 1. Missing indexes on foreign keys (performance)
-- 2. Composite indexes for common query patterns
-- ============================================================================

-- ============================================================================
-- 1. Missing Foreign Key Indexes
-- ============================================================================

-- bookings.platform_revenue_id
CREATE INDEX IF NOT EXISTS idx_bookings_platform_revenue_id 
ON public.bookings(platform_revenue_id)
WHERE platform_revenue_id IS NOT NULL;

-- cars.pricing_config_id
CREATE INDEX IF NOT EXISTS idx_cars_pricing_config_id 
ON public.cars(pricing_config_id)
WHERE pricing_config_id IS NOT NULL;

-- disputes.booking_id
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id 
ON public.disputes(booking_id);

-- disputes.car_id
CREATE INDEX IF NOT EXISTS idx_disputes_car_id 
ON public.disputes(car_id)
WHERE car_id IS NOT NULL;

-- messages.chat_id
CREATE INDEX IF NOT EXISTS idx_messages_chat_id 
ON public.messages(chat_id);

-- profiles.agency_id
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id 
ON public.profiles(agency_id)
WHERE agency_id IS NOT NULL;

-- ============================================================================
-- 2. Composite Indexes for Common Query Patterns
-- ============================================================================

-- Bookings: status + user_id (for user's bookings)
CREATE INDEX IF NOT EXISTS idx_bookings_status_user_id 
ON public.bookings(status, user_id)
WHERE status IN ('pending', 'confirmed', 'in_progress', 'completed');

-- Bookings: status + host_id (for host's bookings)
CREATE INDEX IF NOT EXISTS idx_bookings_status_host_id 
ON public.bookings(status, host_id)
WHERE status IN ('pending', 'confirmed', 'in_progress', 'completed');

-- Bookings: car_id + date range (for availability checks)
CREATE INDEX IF NOT EXISTS idx_bookings_car_date_range 
ON public.bookings(car_id, start_date, end_date)
WHERE status NOT IN ('cancelled', 'rejected');

-- Cars: host_id + is_approved (for host's approved cars)
CREATE INDEX IF NOT EXISTS idx_cars_host_approved 
ON public.cars(host_id, is_approved)
WHERE is_approved = true;

-- Cars: location + is_available (for search)
CREATE INDEX IF NOT EXISTS idx_cars_location_available 
ON public.cars(location, is_available)
WHERE is_available = true AND is_approved = true;

-- Payments: booking_id + status (for payment tracking)
CREATE INDEX IF NOT EXISTS idx_payments_booking_status 
ON public.payments(booking_id, status)
WHERE status IN ('pending', 'paid', 'failed', 'refunded');

-- Payment transactions: booking_id + type (for transaction history)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_type 
ON public.payment_transactions(booking_id, type)
WHERE booking_id IS NOT NULL;

-- Notifications: user_id + is_read (for unread notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications(user_id, is_read)
WHERE is_read = false;

-- Email queue: status + created_at (for processing)
CREATE INDEX IF NOT EXISTS idx_email_queue_status_created 
ON public.email_queue(status, created_at)
WHERE status = 'pending';

-- Verification submissions: user_id + status (for verification tracking)
CREATE INDEX IF NOT EXISTS idx_verification_submissions_user_status 
ON public.verification_submissions(user_id, status)
WHERE status = 'pending_review';

-- Booking messages: thread_id + created_at (for message ordering)
CREATE INDEX IF NOT EXISTS idx_booking_messages_thread_created 
ON public.booking_messages(thread_id, created_at DESC);

-- ============================================================================
-- 3. Partial Indexes for Active/Recent Records
-- ============================================================================

-- Recent bookings (last 90 days)
CREATE INDEX IF NOT EXISTS idx_bookings_recent 
ON public.bookings(created_at DESC)
WHERE created_at >= NOW() - INTERVAL '90 days';

-- Active disputes (open or in_progress)
CREATE INDEX IF NOT EXISTS idx_disputes_active 
ON public.disputes(status, created_at DESC)
WHERE status IN ('open', 'in_progress');

-- Pending email queue (for faster processing)
CREATE INDEX IF NOT EXISTS idx_email_queue_pending 
ON public.email_queue(id, created_at)
WHERE status = 'pending';

-- ============================================================================
-- 4. Indexes for Full-Text Search (if needed)
-- ============================================================================

-- Cars: Full-text search on description (if using tsvector)
-- Uncomment if implementing full-text search:
-- CREATE INDEX IF NOT EXISTS idx_cars_description_fts 
-- ON public.cars USING gin(to_tsvector('french', description));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_bookings_status_user_id IS 
'Optimizes queries for user bookings by status';

COMMENT ON INDEX idx_bookings_car_date_range IS 
'Optimizes vehicle availability checks';

COMMENT ON INDEX idx_email_queue_pending IS 
'Optimizes email queue processing';

