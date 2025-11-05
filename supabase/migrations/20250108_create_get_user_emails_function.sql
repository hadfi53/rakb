-- Migration: Create get_user_emails RPC function
-- This function allows fetching user emails from auth.users for admin purposes

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users (admins)
GRANT EXECUTE ON FUNCTION public.get_user_emails(uuid[]) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_emails(uuid[]) IS 'Returns user emails for given user IDs. Used by admin interface.';

