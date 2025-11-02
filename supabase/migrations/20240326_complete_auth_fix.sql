-- Migration complète pour résoudre les problèmes d'authentification et de profil
-- Cette migration remplace et améliore les précédentes solutions

-- Partie 1: Désactiver RLS temporairement pour effectuer des modifications
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Partie 2: Améliorer la fonction de création d'utilisateur automatique
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_role user_role;
BEGIN
    -- Déterminer le rôle par défaut
    default_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        'renter'::user_role
    );

    -- Créer un profil uniquement s'il n'existe pas déjà
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        avatar_url,
        role,
        created_at,
        updated_at,
        notification_preferences
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        default_role,
        NOW(),
        NOW(),
        jsonb_build_object(
            'email', true,
            'push', true
        )
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN others THEN
    -- Log any errors but don't block the auth process
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Partie 3: Fonction RPC pour obtenir ou créer un profil utilisateur
CREATE OR REPLACE FUNCTION public.get_or_create_profile()
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id uuid;
    user_email text;
    meta_first_name text;
    meta_last_name text;
    meta_avatar_url text;
    meta_role user_role;
    user_profile profiles;
BEGIN
    -- Obtenir l'ID et l'email de l'utilisateur authentifié
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Non authentifié';
    END IF;

    -- Récupérer les métadonnées via les fonctions auth
    SELECT
        email, raw_user_meta_data->>'first_name', 
        raw_user_meta_data->>'last_name', 
        raw_user_meta_data->>'avatar_url',
        (raw_user_meta_data->>'role')::user_role
    INTO 
        user_email, meta_first_name, meta_last_name, 
        meta_avatar_url, meta_role
    FROM auth.users
    WHERE id = user_id;

    -- Si role est NULL ou vide, définir par défaut comme 'renter'
    meta_role := COALESCE(meta_role, 'renter'::user_role);

    -- Vérifier si le profil existe déjà
    SELECT * INTO user_profile 
    FROM profiles 
    WHERE id = user_id;

    -- Si le profil n'existe pas, le créer
    IF user_profile.id IS NULL THEN
        INSERT INTO profiles (
            id,
            email,
            first_name,
            last_name,
            avatar_url,
            role,
            created_at,
            updated_at,
            notification_preferences
        ) VALUES (
            user_id,
            user_email,
            COALESCE(meta_first_name, ''),
            COALESCE(meta_last_name, ''),
            COALESCE(meta_avatar_url, ''),
            meta_role,
            NOW(),
            NOW(),
            jsonb_build_object(
                'email', true,
                'push', true
            )
        )
        RETURNING * INTO user_profile;
    END IF;

    -- Si le profil existe mais que les données métadonnées sont plus récentes, mettre à jour
    IF user_profile.role IS DISTINCT FROM meta_role 
       AND meta_role IS NOT NULL THEN
        UPDATE profiles
        SET 
            role = meta_role,
            updated_at = NOW()
        WHERE id = user_id
        RETURNING * INTO user_profile;
    END IF;

    RETURN user_profile;
EXCEPTION WHEN others THEN
    RAISE WARNING 'Error in get_or_create_profile: %', SQLERRM;
    -- Retourner quand même ce qu'on a trouvé
    RETURN user_profile;
END;
$$;

-- Accorder l'accès à la fonction RPC aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_or_create_profile TO authenticated;

-- Partie 4: Recréer toutes les politiques RLS nécessaires
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "service_role_manage_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;

-- Créer de nouvelles politiques
-- 1. Politique pour permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "profiles_select_own" 
    ON profiles FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- 2. Politique pour permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "profiles_update_own" 
    ON profiles FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. Politique pour permettre aux utilisateurs d'insérer leur propre profil
CREATE POLICY "profiles_insert_own" 
    ON profiles FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 4. Politique pour permettre au rôle de service de gérer tous les profils
CREATE POLICY "service_role_manage_profiles" 
    ON profiles FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Politique pour permettre aux utilisateurs de supprimer leur propre profil
CREATE POLICY "profiles_delete_own" 
    ON profiles FOR DELETE 
    TO authenticated
    USING (auth.uid() = id);

-- Réactiver RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Partie 5: S'assurer que les permissions sont correctes
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO service_role;

-- Vérifier et corriger les colonnes dans la table profiles
DO $$
BEGIN
    -- Vérifier si la colonne notification_preferences existe
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name = 'notification_preferences'
    ) THEN
        -- Ajouter la colonne si elle n'existe pas
        ALTER TABLE profiles 
        ADD COLUMN notification_preferences JSONB DEFAULT jsonb_build_object(
            'email', true,
            'push', true
        );
    END IF;
END
$$; 