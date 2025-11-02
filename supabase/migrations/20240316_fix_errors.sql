-- Nettoyer les anciennes erreurs et vérifier que les tables nécessaires existent
-- Cette migration répare les problèmes des migrations précédentes

-- 1. Vérifier que la table vehicles existe, sinon la créer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vehicles') THEN
    CREATE TABLE public.vehicles (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      price_per_day DECIMAL(10,2) NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      images TEXT[] DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'available',
      fuel_type TEXT,
      luggage INTEGER,
      mileage INTEGER,
      color TEXT,
      transmission TEXT,
      seats INTEGER,
      features TEXT[] DEFAULT '{}',
      rating DECIMAL(3,2),
      reviews_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Activer RLS
    ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

    -- Politiques RLS pour les véhicules
    CREATE POLICY "Les utilisateurs peuvent voir tous les véhicules"
      ON public.vehicles FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Les propriétaires peuvent gérer leurs propres véhicules"
      ON public.vehicles FOR ALL
      TO authenticated
      USING (auth.uid() = owner_id)
      WITH CHECK (auth.uid() = owner_id);

    -- Création d'index pour améliorer les performances
    CREATE INDEX idx_vehicles_owner_id ON public.vehicles(owner_id);
    CREATE INDEX idx_vehicles_status ON public.vehicles(status);
    CREATE INDEX idx_vehicles_location ON public.vehicles(location);
    CREATE INDEX idx_vehicles_price ON public.vehicles(price_per_day);
  END IF;
END $$;

-- 2. Vérifier que les politiques RLS sont correctement définies pour addresses
DO $$ 
BEGIN
  -- Supprimer les anciennes politiques si elles existent
  DROP POLICY IF EXISTS "Users can view their own address" ON addresses;
  DROP POLICY IF EXISTS "Users can update own address" ON addresses;
  DROP POLICY IF EXISTS "Users can insert their own address" ON addresses;
  
  -- Créer les nouvelles politiques
  CREATE POLICY "Users can view their own address"
    ON addresses FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update own address"
    ON addresses FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own address"
    ON addresses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  
  -- Créer des politiques de suppression
  CREATE POLICY "Users can delete their own address"
    ON addresses FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- 3. S'assurer que les triggers nécessaires existent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_vehicles_updated_at'
  ) THEN
    CREATE TRIGGER update_vehicles_updated_at
      BEFORE UPDATE ON public.vehicles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4. Mettre à jour les permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated; 