-- Migration pour corriger définitivement les problèmes de RLS sur les profils
-- Cette migration est conçue pour être exécutée directement dans l'éditeur SQL de Supabase

-- 1. Vérifier que les fonctions existent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'debug_auth_info'
    ) THEN
        RAISE NOTICE 'Creating debug_auth_info function';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_or_create_profile'
    ) THEN
        RAISE NOTICE 'Creating get_or_create_profile function';
    END IF;
END $$;

-- 2. Désactiver temporairement RLS pour effectuer les opérations de nettoyage
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Supprimer toutes les anciennes politiques RLS qui pourraient causer des conflits
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles; 
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "service_role_manage_profiles" ON public.profiles;
DROP POLICY IF EXISTS "auth_users_select" ON public.profiles;
DROP POLICY IF EXISTS "auth_users_insert" ON public.profiles;
DROP POLICY IF EXISTS "auth_users_update" ON public.profiles;
DROP POLICY IF EXISTS "auth_users_delete" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service can manage all profiles" ON public.profiles;

-- 4. Recréer la fonction get_or_create_profile avec un meilleur contrôle d'erreurs
CREATE OR REPLACE FUNCTION public.get_or_create_profile()
RETURNS SETOF profiles
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
    result_profile profiles;
BEGIN
    -- Obtenir l'ID de l'utilisateur authentifié
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;

    -- Récupérer les données utilisateur de la table auth.users
    SELECT 
        au.email,
        COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
        COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
        COALESCE(au.raw_user_meta_data->>'avatar_url', '') as avatar_url,
        COALESCE((au.raw_user_meta_data->>'role')::user_role, 'renter'::user_role) as role
    INTO
        user_email, meta_first_name, meta_last_name, meta_avatar_url, meta_role
    FROM auth.users au
    WHERE au.id = user_id;

    -- Vérifier si un profil existe déjà
    SELECT * INTO result_profile
    FROM profiles
    WHERE id = user_id;

    -- Si aucun profil n'existe, en créer un nouveau
    IF result_profile.id IS NULL THEN
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
            meta_first_name,
            meta_last_name,
            meta_avatar_url,
            meta_role,
            NOW(),
            NOW(),
            jsonb_build_object(
                'email', true,
                'push', true
            )
        )
        RETURNING * INTO result_profile;
    -- Mettre à jour le profil si nécessaire
    ELSIF (result_profile.role IS DISTINCT FROM meta_role AND meta_role IS NOT NULL) OR
          (result_profile.email IS NULL AND user_email IS NOT NULL) OR
          (result_profile.first_name IS NULL AND meta_first_name IS NOT NULL) OR
          (result_profile.last_name IS NULL AND meta_last_name IS NOT NULL) THEN
        
        UPDATE profiles SET
            email = COALESCE(user_email, email),
            first_name = COALESCE(meta_first_name, first_name),
            last_name = COALESCE(meta_last_name, last_name),
            avatar_url = COALESCE(meta_avatar_url, avatar_url),
            role = COALESCE(meta_role, role),
            updated_at = NOW()
        WHERE id = user_id
        RETURNING * INTO result_profile;
    END IF;
    
    -- Retourner le profil trouvé ou créé
    RETURN QUERY SELECT * FROM profiles WHERE id = user_id;
    
EXCEPTION WHEN others THEN
    -- Log l'erreur mais continue l'exécution
    RAISE WARNING 'Error in get_or_create_profile: %', SQLERRM;
    -- Une approche différente en cas d'erreur
    RETURN QUERY 
        SELECT p.* FROM profiles p 
        WHERE p.id = user_id;
END;
$$;

-- 5. Créer/recréer la fonction debug_auth_info
CREATE OR REPLACE FUNCTION public.debug_auth_info()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id uuid;
    user_info json;
    profile_info json;
    debug_info json;
BEGIN
    -- Obtenir l'ID utilisateur actuel
    user_id := auth.uid();
    
    -- Récupérer les informations de l'utilisateur
    SELECT json_build_object(
        'id', au.id,
        'email', au.email,
        'metadata', au.raw_user_meta_data
    ) INTO user_info
    FROM auth.users au
    WHERE au.id = user_id;
    
    -- Récupérer les informations du profil
    SELECT json_build_object(
        'exists', CASE WHEN p.id IS NOT NULL THEN true ELSE false END,
        'id', p.id,
        'email', p.email,
        'role', p.role,
        'first_name', p.first_name,
        'last_name', p.last_name
    ) INTO profile_info
    FROM profiles p
    WHERE p.id = user_id;
    
    -- Créer l'objet de débogage
    debug_info := json_build_object(
        'authenticated', user_id IS NOT NULL,
        'user_id', user_id,
        'user_info', user_info,
        'profile_info', profile_info
    );
    
    RETURN debug_info;
EXCEPTION WHEN others THEN
    RETURN json_build_object(
        'error', SQLERRM,
        'authenticated', user_id IS NOT NULL,
        'user_id', user_id
    );
END;
$$;

-- 6. Accorder les permissions nécessaires pour exécuter ces fonctions
GRANT EXECUTE ON FUNCTION public.get_or_create_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_profile TO anon;
GRANT EXECUTE ON FUNCTION public.debug_auth_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_auth_info TO anon;

-- 7. Créer des politiques RLS plus permissives pour la table profiles

-- Politique pour permettre aux utilisateurs authentifiés de voir leur propre profil
CREATE POLICY "users_select_own_profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Politique pour permettre aux utilisateurs authentifiés de mettre à jour leur propre profil
CREATE POLICY "users_update_own_profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Politique TRÈS IMPORTANTE: permettre aux utilisateurs authentifiés d'insérer leur propre profil
CREATE POLICY "users_insert_own_profile" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Politique pour permettre aux utilisateurs anonymes de lire certains profils (pour l'affichage public)
CREATE POLICY "anon_select_public_profile_data" 
ON public.profiles FOR SELECT 
TO anon
USING (true);

-- Politique pour permettre au service role de tout faire
CREATE POLICY "service_role_full_access" 
ON public.profiles FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 8. Réactiver RLS sur la table profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 9. Accorder les permissions nécessaires sur la table profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- 10. S'assurer que les fonctions de gestion de profil fonctionnent en ajoutant une fonction spéciale
CREATE OR REPLACE FUNCTION public.force_create_profile(
    user_id uuid,
    user_email text,
    first_name text DEFAULT '',
    last_name text DEFAULT '',
    user_role user_role DEFAULT 'renter'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    existing_profile profiles;
BEGIN
    -- Vérifier si le profil existe déjà
    SELECT * INTO existing_profile
    FROM profiles
    WHERE id = user_id;
    
    -- Si le profil existe, le mettre à jour
    IF existing_profile.id IS NOT NULL THEN
        UPDATE profiles SET
            email = COALESCE(user_email, email),
            first_name = COALESCE(first_name, existing_profile.first_name),
            last_name = COALESCE(last_name, existing_profile.last_name),
            role = COALESCE(user_role, existing_profile.role),
            updated_at = NOW()
        WHERE id = user_id;
        
        RETURN true;
    ELSE
        -- Si le profil n'existe pas, en créer un nouveau
        INSERT INTO profiles (
            id,
            email,
            first_name,
            last_name,
            role,
            created_at,
            updated_at,
            notification_preferences
        ) VALUES (
            user_id,
            user_email,
            first_name,
            last_name,
            user_role,
            NOW(),
            NOW(),
            jsonb_build_object(
                'email', true,
                'push', true
            )
        );
        
        RETURN true;
    END IF;
EXCEPTION WHEN others THEN
    RAISE WARNING 'Error in force_create_profile: %', SQLERRM;
    RETURN false;
END;
$$;

-- Donner accès à cette fonction
GRANT EXECUTE ON FUNCTION public.force_create_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_create_profile TO anon; 