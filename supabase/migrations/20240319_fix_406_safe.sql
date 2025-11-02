-- Créer une fonction RPC pour récupérer les adresses d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_addresses(user_id UUID)
RETURNS SETOF public.addresses
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.addresses WHERE user_id = get_user_addresses.user_id;
$$;

-- Créer une fonction RPC pour supprimer et insérer une adresse (approche atomique)
CREATE OR REPLACE FUNCTION public.upsert_user_address(
  p_user_id UUID,
  p_street TEXT,
  p_city TEXT,
  p_postal_code TEXT,
  p_country TEXT DEFAULT 'MA'
)
RETURNS public.addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.addresses;
BEGIN
  -- Supprimer l'adresse existante s'il y en a une
  DELETE FROM public.addresses WHERE user_id = p_user_id;
  
  -- Insérer la nouvelle adresse
  INSERT INTO public.addresses (
    user_id, 
    street, 
    city, 
    postal_code, 
    country, 
    created_at, 
    updated_at
  ) VALUES (
    p_user_id,
    p_street,
    p_city,
    p_postal_code,
    p_country,
    now(),
    now()
  ) RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Utiliser un bloc DO pour gérer proprement les suppressions de politiques
DO $$ 
BEGIN
  -- Supprimer les politiques existantes s'il y en a
  BEGIN
    DROP POLICY "Users can view their own address" ON addresses;
  EXCEPTION
    WHEN undefined_object THEN 
      RAISE NOTICE 'Policy "Users can view their own address" does not exist, skipping...';
  END;
  
  BEGIN
    DROP POLICY "Users can update own address" ON addresses;
  EXCEPTION
    WHEN undefined_object THEN 
      RAISE NOTICE 'Policy "Users can update own address" does not exist, skipping...';
  END;
  
  BEGIN
    DROP POLICY "Users can insert their own address" ON addresses;
  EXCEPTION
    WHEN undefined_object THEN 
      RAISE NOTICE 'Policy "Users can insert their own address" does not exist, skipping...';
  END;
  
  BEGIN
    DROP POLICY "Users can delete their own address" ON addresses;
  EXCEPTION
    WHEN undefined_object THEN 
      RAISE NOTICE 'Policy "Users can delete their own address" does not exist, skipping...';
  END;
END $$;

-- Recréer les politiques avec des noms plus cohérents et des permissions plus claires
CREATE POLICY "auth_users_select" ON addresses
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "auth_users_insert" ON addresses
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_users_update" ON addresses
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_users_delete" ON addresses
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- S'assurer que les fonctions sont disponibles pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_user_addresses TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_address TO authenticated; 