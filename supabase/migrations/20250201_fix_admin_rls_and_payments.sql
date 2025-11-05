-- Fix admin RLS policies and ensure payments table has updated_at column
-- This migration fixes:
-- 1. Infinite recursion in profiles and bookings RLS policies
-- 2. Admin access to all tables
-- 3. Payments table schema consistency

-- ============================================================================
-- 0. Create handle_updated_at function if it doesn't exist
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 1. Ensure payments table has updated_at column
-- ============================================================================
DO $$
BEGIN
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.payments 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
    
    -- Create trigger to update updated_at (drop if exists first)
    DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
    CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON public.payments
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ============================================================================
-- 2. Fix RLS policies for profiles (prevent infinite recursion)
-- ============================================================================
-- Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "profiles_view_public_data" ON public.profiles;
DROP POLICY IF EXISTS "profiles_manage_own" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "service_role_manage_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "anon_select_public_profile_data" ON public.profiles;
DROP POLICY IF EXISTS "service_role_full_access" ON public.profiles;
DROP POLICY IF EXISTS "enable_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "enable_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "enable_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "enable_delete_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_full_access_profiles" ON public.profiles;

-- Create helper function to check admin status (prevents recursion)
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = check_user_id
    AND raw_user_meta_data->>'role' = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND (role = 'admin' OR user_role = 'admin')
  );
$$;

-- Create simple policies without recursion
CREATE POLICY "profiles_select_all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_user_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_user_admin(auth.uid()));

CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id OR public.is_user_admin(auth.uid()));

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Fix RLS policies for bookings (prevent infinite recursion)
-- ============================================================================
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view bookings they're involved in" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_involved" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_involved" ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete_own" ON public.bookings;
DROP POLICY IF EXISTS "admins_full_access_bookings" ON public.bookings;

-- Create simple policies
CREATE POLICY "bookings_select_all"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR auth.uid() = host_id
    OR public.is_user_admin(auth.uid())
  );

CREATE POLICY "bookings_insert_own"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_user_admin(auth.uid()));

CREATE POLICY "bookings_update_involved"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR auth.uid() = host_id
    OR public.is_user_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() = host_id
    OR public.is_user_admin(auth.uid())
  );

CREATE POLICY "bookings_delete_own"
  ON public.bookings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_user_admin(auth.uid()));

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Fix RLS policies for payments (add admin access)
-- ============================================================================
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "admins_full_access_payments" ON public.payments;

CREATE POLICY "payments_select_own_or_admin"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.is_user_admin(auth.uid())
  );

CREATE POLICY "payments_insert_own"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_user_admin(auth.uid()));

CREATE POLICY "payments_update_admin"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Fix RLS policies for identity_documents (add admin access)
-- ============================================================================
ALTER TABLE public.identity_documents DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own documents" ON public.identity_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.identity_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.identity_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.identity_documents;
DROP POLICY IF EXISTS "admins_full_access_documents" ON public.identity_documents;

CREATE POLICY "identity_documents_select_own_or_admin"
  ON public.identity_documents
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.is_user_admin(auth.uid())
  );

CREATE POLICY "identity_documents_insert_own"
  ON public.identity_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "identity_documents_update_admin"
  ON public.identity_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_user_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_user_admin(auth.uid()));

ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Ensure get_user_emails function has proper permissions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_emails(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_emails(uuid[]) TO service_role;

-- ============================================================================
-- 7. Grant necessary table permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT, UPDATE ON public.identity_documents TO authenticated;

-- ============================================================================
-- 8. Add comment
-- ============================================================================
COMMENT ON FUNCTION public.is_user_admin(uuid) IS 'Helper function to check if user is admin. Prevents RLS recursion.';
COMMENT ON FUNCTION public.get_user_emails(uuid[]) IS 'Returns user emails for given user IDs. Used by admin interface. SECURITY DEFINER to access auth.users.';

