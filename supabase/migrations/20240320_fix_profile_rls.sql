-- Mettre à jour les politiques RLS pour la table profiles
-- Cette migration corrige les problèmes d'accès aux profils pour différents rôles d'utilisateurs

-- 1. Permettre à la fonction handle_new_user de créer des profils sans restriction RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 3. Créer des politiques plus permissives
-- Permettre à l'utilisateur de voir son propre profil
CREATE POLICY "profiles_select_own" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Permettre à l'utilisateur de modifier son propre profil
CREATE POLICY "profiles_update_own" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Permettre à l'utilisateur de créer son propre profil
CREATE POLICY "profiles_insert_own" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 4. Autoriser le service auth supabase à créer des profils
CREATE POLICY "service_insert_profiles" 
  ON profiles FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- 5. Garantir que toutes les tables ont les bonnes politiques
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO service_role;

-- 6. Améliorer la fonction handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    default_role user_role;
BEGIN
    -- Set default role to 'renter' if not specified
    default_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        'renter'::user_role
    );

    -- Debug log
    RAISE NOTICE 'Creating profile for user % with role %', NEW.id, default_role;

    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        avatar_url,
        role
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        default_role
    );

    -- Debug log
    RAISE NOTICE 'Profile created successfully';
    
    RETURN NEW;
EXCEPTION WHEN others THEN
    -- Log any errors
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recréer le trigger si nécessaire
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 