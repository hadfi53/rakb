-- Fonction pour mettre à jour le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION update_user_role(
  user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si l'utilisateur existe
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id
  ) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;

  -- Vérifier si le nouveau rôle est valide
  IF new_role NOT IN ('owner', 'renter', 'admin') THEN
    RAISE EXCEPTION 'Rôle invalide';
  END IF;

  -- Mettre à jour le rôle dans la table profiles
  UPDATE profiles
  SET 
    role = new_role,
    updated_at = NOW()
  WHERE id = user_id;

  -- Mettre à jour les métadonnées de l'utilisateur
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', new_role)
  WHERE id = user_id;

  RETURN TRUE;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT) TO authenticated;

-- Trigger pour synchroniser le rôle entre profiles et auth.users
CREATE OR REPLACE FUNCTION sync_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS sync_user_role_trigger ON profiles;
CREATE TRIGGER sync_user_role_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_role(); 