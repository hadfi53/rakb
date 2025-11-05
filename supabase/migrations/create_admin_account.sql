-- Migration pour créer le compte administrateur
-- Note: Cette migration doit être exécutée via Supabase Dashboard ou CLI
-- car la création d'utilisateurs auth nécessite des privilèges spéciaux

-- Si l'utilisateur existe déjà, mettre à jour son profil
DO $$
DECLARE
  v_user_id UUID;
  v_admin_email TEXT := 'rakb@rakb.ma';
BEGIN
  -- Vérifier si l'utilisateur existe
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_admin_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Mettre à jour le profil existant
    UPDATE public.profiles
    SET 
      role = 'admin',
      user_role = 'admin',
      verified_tenant = true,
      verified_host = true,
      is_verified = true,
      is_active = true,
      first_name = 'Admin',
      last_name = 'RAKB',
      updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Mettre à jour les métadonnées utilisateur
    UPDATE auth.users
    SET 
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
      updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Profil admin mis à jour pour l''utilisateur: %', v_admin_email;
  ELSE
    RAISE NOTICE 'L''utilisateur % n''existe pas encore. Veuillez le créer via Supabase Dashboard > Authentication > Users', v_admin_email;
  END IF;
END $$;

