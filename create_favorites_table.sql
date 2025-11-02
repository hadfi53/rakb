-- Création de la table des favoris
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contrainte d'unicité pour éviter les doublons
  UNIQUE(user_id, vehicle_id)
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_vehicle_id ON public.favorites(vehicle_id);

-- Fonction pour mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION update_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le champ updated_at automatiquement
CREATE TRIGGER update_favorites_updated_at
BEFORE UPDATE ON public.favorites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Accorder les permissions nécessaires
GRANT ALL ON public.favorites TO authenticated;

-- Désactiver RLS pour cette table (comme les autres tables du système)
ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY; 