-- Migration pour créer la table vehicle_blocked_dates
-- Cette table stocke les dates bloquées par les agences pour leurs véhicules

CREATE TABLE IF NOT EXISTS public.vehicle_blocked_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason TEXT DEFAULT 'manual' CHECK (reason IN ('maintenance', 'manual', 'other')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(vehicle_id, blocked_date)
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_vehicle_blocked_dates_vehicle_id ON public.vehicle_blocked_dates(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_blocked_dates_blocked_date ON public.vehicle_blocked_dates(blocked_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_blocked_dates_vehicle_date ON public.vehicle_blocked_dates(vehicle_id, blocked_date);

-- Activer RLS
ALTER TABLE public.vehicle_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Tout le monde peut voir les dates bloquées (pour les recherches)
CREATE POLICY "Tout le monde peut voir les dates bloquées"
    ON public.vehicle_blocked_dates FOR SELECT
    TO authenticated, anon
    USING (true);

-- Politique RLS : Les propriétaires peuvent gérer les dates bloquées de leurs véhicules
CREATE POLICY "Les propriétaires peuvent gérer leurs dates bloquées"
    ON public.vehicle_blocked_dates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cars
            WHERE cars.id = vehicle_blocked_dates.vehicle_id
            AND cars.host_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cars
            WHERE cars.id = vehicle_blocked_dates.vehicle_id
            AND cars.host_id = auth.uid()
        )
    );

-- Fonction pour vérifier si un véhicule a des dates bloquées dans une plage de dates
CREATE OR REPLACE FUNCTION public.has_blocked_dates_in_range(
    p_vehicle_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.vehicle_blocked_dates
        WHERE vehicle_id = p_vehicle_id
        AND blocked_date >= p_start_date
        AND blocked_date <= p_end_date
    );
END;
$$;

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION public.has_blocked_dates_in_range(UUID, DATE, DATE) TO authenticated, anon;

-- Commentaire sur la table
COMMENT ON TABLE public.vehicle_blocked_dates IS 'Table pour stocker les dates bloquées par les agences pour leurs véhicules';
COMMENT ON COLUMN public.vehicle_blocked_dates.reason IS 'Raison du blocage : maintenance, manual, ou other';
COMMENT ON COLUMN public.vehicle_blocked_dates.blocked_date IS 'Date bloquée (sans heure)';

