-- Désactiver temporairement RLS
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "vehicles_view_available" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_owner" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_owner" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_owner" ON public.vehicles;
DROP POLICY IF EXISTS "Available vehicles are viewable by everyone" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can insert their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can update their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Owners can delete their own vehicles" ON public.vehicles;

-- Créer des politiques simples
CREATE POLICY "enable_read_vehicles"
ON public.vehicles
FOR SELECT
USING (
    status = 'available' 
    OR status = 'rented' 
    OR owner_id = auth.uid()
);

CREATE POLICY "enable_owner_all"
ON public.vehicles
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Réactiver RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- S'assurer que les permissions sont correctes
GRANT SELECT ON public.vehicles TO public;
GRANT ALL ON public.vehicles TO authenticated; 