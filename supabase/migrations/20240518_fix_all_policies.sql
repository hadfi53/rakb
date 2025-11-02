-- Désactiver temporairement RLS sur toutes les tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
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

-- Vérifier et créer les types d'énumération si nécessaires
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
        CREATE TYPE vehicle_status AS ENUM ('available', 'rented', 'maintenance', 'unavailable');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_transmission') THEN
        CREATE TYPE vehicle_transmission AS ENUM ('automatic', 'manual', 'semi-automatic');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_fuel_type') THEN
        CREATE TYPE vehicle_fuel_type AS ENUM ('diesel', 'essence', 'hybrid', 'electric');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_category') THEN
        CREATE TYPE vehicle_category AS ENUM ('SUV', 'Berline', 'Sportive', 'Luxe', 'Électrique', 'Familiale');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'preauthorized', 'paid', 'refunded', 'failed');
    END IF;
END
$$;

-- Créer des politiques simples pour profiles
CREATE POLICY "profiles_select_all"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Créer des politiques simples pour vehicles
CREATE POLICY "vehicles_select_all"
ON public.vehicles
FOR SELECT
USING (true);

CREATE POLICY "vehicles_insert_own"
ON public.vehicles
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "vehicles_update_own"
ON public.vehicles
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "vehicles_delete_own"
ON public.vehicles
FOR DELETE
USING (auth.uid() = owner_id);

-- Créer des politiques simples pour bookings
CREATE POLICY "bookings_select_involved"
ON public.bookings
FOR SELECT
USING (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "bookings_insert_own"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "bookings_update_involved"
ON public.bookings
FOR UPDATE
USING (auth.uid() = renter_id OR auth.uid() = owner_id)
WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "bookings_delete_own"
ON public.bookings
FOR DELETE
USING (auth.uid() = renter_id);

-- Réactiver RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

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