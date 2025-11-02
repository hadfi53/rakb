-- Création de la table des véhicules
CREATE TABLE IF NOT EXISTS public.vehicles (
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

-- Création du trigger pour la mise à jour automatique du timestamp
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON public.vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON public.vehicles(price_per_day);

-- Correction des autorisations pour la table addresses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;

-- Ajouter l'en-tête Accept pour résoudre l'erreur 406
ALTER TABLE addresses SET (request.header.Accept = 'application/json'); 