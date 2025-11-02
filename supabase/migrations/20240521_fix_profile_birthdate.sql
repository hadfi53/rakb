-- 1. Vérifier et ajouter la colonne birthdate si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'birthdate'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN birthdate DATE;
    END IF;
END $$;

-- 2. Supprimer toutes les fonctions existantes liées à la mise à jour du profil
DROP FUNCTION IF EXISTS update_user_profile(UUID, TEXT, TEXT, TEXT, DATE, TEXT[], JSONB);
DROP FUNCTION IF EXISTS update_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB);
DROP FUNCTION IF EXISTS update_user_profile(UUID, TEXT, TEXT, TEXT, DATE, TEXT[], TEXT);
DROP FUNCTION IF EXISTS update_user_profile_v2(UUID, TEXT, TEXT, TEXT, DATE, TEXT[], JSONB);

-- 3. Créer une nouvelle fonction avec un nom complètement différent
CREATE OR REPLACE FUNCTION profile_update_v1(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT,
    p_birthdate TEXT DEFAULT NULL, -- Utiliser TEXT au lieu de DATE pour éviter les problèmes de conversion
    p_languages TEXT[] DEFAULT '{}',
    p_notification_preferences JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_date DATE := NULL;
BEGIN
    -- Vérifier si l'utilisateur est authentifié
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;
    
    -- Vérifier si l'utilisateur est autorisé à mettre à jour ce profil
    IF auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Vous n''êtes pas autorisé à mettre à jour ce profil';
    END IF;
    
    -- Convertir la date si elle n'est pas NULL ou vide
    IF p_birthdate IS NOT NULL AND p_birthdate != '' THEN
        BEGIN
            v_date := p_birthdate::DATE;
        EXCEPTION WHEN OTHERS THEN
            v_date := NULL; -- En cas d'erreur de conversion, utiliser NULL
        END;
    END IF;
    
    -- Mettre à jour le profil
    UPDATE public.profiles
    SET 
        first_name = p_first_name,
        last_name = p_last_name,
        phone = p_phone,
        birthdate = v_date,
        languages = p_languages,
        notification_preferences = p_notification_preferences,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id
    RETURNING to_jsonb(profiles.*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 4. Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION profile_update_v1 TO authenticated; 