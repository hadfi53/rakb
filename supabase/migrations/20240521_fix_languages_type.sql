-- 1. Vérifier si le type user_language existe, sinon le créer
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_language') THEN
        CREATE TYPE user_language AS ENUM ('fr', 'en', 'ar');
    END IF;
END $$;

-- 2. Supprimer la fonction existante
DROP FUNCTION IF EXISTS profile_update_v1(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB);

-- 3. Créer une nouvelle version de la fonction qui gère correctement le type user_language[]
CREATE OR REPLACE FUNCTION profile_update_v1(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_phone TEXT,
    p_birthdate TEXT DEFAULT NULL,
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
    v_languages user_language[] := '{}';
    v_lang text;
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
    
    -- Convertir le tableau de langues de text[] à user_language[]
    IF p_languages IS NOT NULL AND array_length(p_languages, 1) > 0 THEN
        FOREACH v_lang IN ARRAY p_languages
        LOOP
            BEGIN
                v_languages := array_append(v_languages, v_lang::user_language);
            EXCEPTION WHEN OTHERS THEN
                -- Ignorer les langues invalides
                RAISE NOTICE 'Langue invalide ignorée: %', v_lang;
            END;
        END LOOP;
    END IF;
    
    -- Mettre à jour le profil
    UPDATE public.profiles
    SET 
        first_name = p_first_name,
        last_name = p_last_name,
        phone = p_phone,
        birthdate = v_date,
        languages = v_languages,
        notification_preferences = p_notification_preferences,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id
    RETURNING to_jsonb(profiles.*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 4. Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION profile_update_v1 TO authenticated; 