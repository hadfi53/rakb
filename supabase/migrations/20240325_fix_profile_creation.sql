-- Migration pour corriger le problème de création de profil
-- Cette migration résout le problème de violation RLS lors de la création d'un profil après connexion

-- Créer une fonction RPC qui peut être appelée par le client pour créer un profil en toute sécurité
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_first_name TEXT DEFAULT '',
  user_last_name TEXT DEFAULT '',
  user_avatar_url TEXT DEFAULT '',
  user_role user_role DEFAULT 'renter'
)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER -- Exécuté avec les privilèges du créateur, pas ceux de l'appelant
SET search_path = public
AS $$
BEGIN
  -- Insérer uniquement si le profil n'existe pas déjà
  RETURN QUERY
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    avatar_url,
    role,
    created_at,
    updated_at
  )
  SELECT
    auth.uid(),
    auth.email(),
    user_first_name,
    user_last_name,
    user_avatar_url,
    user_role,
    now(),
    now()
  WHERE
    NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  RETURNING *;
END;
$$;

-- Accorder l'accès à cette fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

-- Améliorer la politique RLS de table profiles existante
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "service_insert_profiles" ON profiles;

-- Recréer les politiques avec une meilleure configuration
CREATE POLICY "profiles_select_own" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" 
  ON profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

-- Cette politique n'est généralement pas utilisée directement (nous utilisons la fonction RPC à la place)
CREATE POLICY "profiles_insert_own" 
  ON profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Politique pour autoriser le service à insérer des profils (pour les triggers, etc.)
CREATE POLICY "service_role_manage_profiles" 
  ON profiles FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- S'assurer que RLS est actif
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 