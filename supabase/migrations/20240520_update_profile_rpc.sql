-- Supprimer toutes les versions existantes de la fonction
DROP FUNCTION IF EXISTS update_user_profile(UUID, TEXT, TEXT, TEXT, DATE, TEXT[], JSONB);
DROP FUNCTION IF EXISTS update_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB);
DROP FUNCTION IF EXISTS update_user_profile(UUID, TEXT, TEXT, TEXT, DATE, TEXT[], TEXT);
DROP FUNCTION IF EXISTS update_user_profile_v2(UUID, TEXT, TEXT, TEXT, DATE, TEXT[], JSONB);

-- Create a function to update a user's profile with a new name to avoid conflicts
CREATE OR REPLACE FUNCTION update_user_profile_v2(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT,
    p_birthdate DATE DEFAULT NULL,
    p_languages TEXT[] DEFAULT '{}',
    p_notification_preferences JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Vérifier si l'utilisateur est authentifié
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;
    
    -- Vérifier si l'utilisateur est autorisé à mettre à jour ce profil
    IF auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Vous n''êtes pas autorisé à mettre à jour ce profil';
    END IF;
    
    -- Mettre à jour le profil
    UPDATE public.profiles
    SET 
        first_name = p_first_name,
        last_name = p_last_name,
        phone = p_phone,
        birthdate = p_birthdate,
        languages = p_languages,
        notification_preferences = p_notification_preferences,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id
    RETURNING to_jsonb(profiles.*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION update_user_profile_v2 TO authenticated; 