-- Ajouter la colonne birthdate à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Mettre à jour les permissions
GRANT ALL ON public.profiles TO authenticated; 