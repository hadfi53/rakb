-- Migration pour résoudre le problème des valeurs null dans les profils
-- Cette migration corrige la fonction RPC get_or_create_profile

-- Version améliorée et déboguée de la fonction get_or_create_profile
CREATE OR REPLACE FUNCTION public.get_or_create_profile()
RETURNS SETOF profiles  -- Changement de RETURNS profiles à RETURNS SETOF profiles
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
    
    -- Log pour débogage
    RAISE NOTICE 'Retrieving profile for user_id: %', user_id;
    
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
    
    -- Log pour débogage
    RAISE NOTICE 'User data retrieved: email=%, first_name=%, last_name=%, role=%', 
        user_email, meta_first_name, meta_last_name, meta_role;

    -- Vérifier si un profil existe déjà
    SELECT * INTO result_profile
    FROM profiles
    WHERE id = user_id;
    
    -- Log pour débogage
    IF result_profile.id IS NOT NULL THEN
        RAISE NOTICE 'Existing profile found with id=%', result_profile.id;
    ELSE
        RAISE NOTICE 'No existing profile found, will create new one';
    END IF;

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
        
        RAISE NOTICE 'Created new profile with id=%', result_profile.id;
    -- Mettre à jour le profil si nécessaire (si les métadonnées sont différentes)
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
        
        RAISE NOTICE 'Updated existing profile with id=%', result_profile.id;
    END IF;
    
    -- Retourner le profil trouvé ou créé comme un ensemble (pour compatibilité SETOF)
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

-- Accorder l'accès à la fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_or_create_profile TO authenticated;

-- Fonction pour déboguer les problèmes d'authentification et de profil
CREATE OR REPLACE FUNCTION public.debug_auth_info()
RETURNS json
SECURITY DEFINER
LANGUAGE plpgsql
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

-- Accorder l'accès à la fonction de débogage aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.debug_auth_info TO authenticated;

-- Vérifier la structure de la table profiles
-- S'assurer que toutes les colonnes requises existent
DO $$
BEGIN
    -- Vérifier que la colonne rôle existe et a le bon type
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'renter';
    END IF;

    -- Vérifier les autres colonnes essentielles
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;
    
    -- S'assurer que l'email est mis à jour pour les profils existants
    UPDATE profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
END
$$; 