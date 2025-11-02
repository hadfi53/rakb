-- Désactiver complètement RLS sur les tables problématiques
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes qui causent des problèmes
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

DROP POLICY IF EXISTS "vehicles_view_available" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_owner" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_owner" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_owner" ON public.vehicles;
DROP POLICY IF EXISTS "Available vehicles are viewable by everyone" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can insert their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can update their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can delete their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "enable_read_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "enable_owner_all" ON public.vehicles;
DROP POLICY IF EXISTS "enable_read_all_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "enable_owner_insert" ON public.vehicles;
DROP POLICY IF EXISTS "enable_owner_update" ON public.vehicles;
DROP POLICY IF EXISTS "enable_owner_delete" ON public.vehicles;

DROP POLICY IF EXISTS "Users can view bookings they're involved in" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

-- Accorder les permissions nécessaires
GRANT SELECT ON public.profiles TO public;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.vehicles TO public;
GRANT ALL ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;

GRANT SELECT ON public.bookings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role; 