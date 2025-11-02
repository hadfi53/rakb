-- Migration pour le flux de réservation complet

-- Créer des énumérations pour les statuts de réservation
CREATE TYPE booking_status AS ENUM (
  'pending', -- Demande initiale
  'accepted', -- Acceptée par le propriétaire
  'rejected', -- Refusée par le propriétaire
  'cancelled', -- Annulée par le locataire
  'confirmed', -- Paiement validé
  'in_progress', -- Véhicule retiré
  'completed', -- Location terminée
  'disputed' -- Litige en cours
);

-- Créer des énumérations pour les statuts de paiement
CREATE TYPE payment_status AS ENUM (
  'preauthorized', -- Carte enregistrée, montant préautorisé
  'charged', -- Paiement effectué
  'refunded', -- Remboursé
  'failed', -- Échec du paiement
  'partial_refund' -- Remboursement partiel (dépôt)
);

-- Créer la table des réservations avec le flux complet
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  renter_id UUID REFERENCES public.profiles(id) NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Dates et heures
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Informations de réservation
  pickup_location TEXT NOT NULL,
  return_location TEXT NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  
  -- Informations financières
  base_price DECIMAL(10,2) NOT NULL,
  insurance_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  service_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'preauthorized',
  payment_id TEXT, -- Identifiant externe du paiement
  
  -- Échange de coordonnées (disponible uniquement après confirmation)
  contact_shared BOOLEAN NOT NULL DEFAULT false,
  
  -- État des lieux et contrat
  pickup_contract_signed BOOLEAN NOT NULL DEFAULT false,
  pickup_checklist JSONB, -- Liste de vérification au retrait
  pickup_photos TEXT[], -- Photos au retrait
  
  return_contract_signed BOOLEAN NOT NULL DEFAULT false,
  return_checklist JSONB, -- Liste de vérification au retour
  return_photos TEXT[], -- Photos au retour
  
  -- Notes et commentaires
  renter_notes TEXT,
  owner_notes TEXT
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON public.bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id); 
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);

-- Activer RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Configurer les politiques RLS
-- Locataires peuvent voir leurs propres réservations
CREATE POLICY "renter_select_bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = renter_id);

-- Propriétaires peuvent voir les réservations de leurs véhicules
CREATE POLICY "owner_select_bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

-- Locataires peuvent créer des réservations
CREATE POLICY "renter_insert_bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = renter_id);

-- Locataires peuvent modifier leurs propres réservations
CREATE POLICY "renter_update_bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = renter_id)
  WITH CHECK (
    -- Ne peut modifier que certaines colonnes
    (auth.uid() = renter_id) AND
    (
      -- Si la réservation est en cours, ne peut modifier que les champs de retour
      (status = 'in_progress' AND
       OLD.renter_id = auth.uid() AND
       OLD.vehicle_id = NEW.vehicle_id AND
       OLD.owner_id = NEW.owner_id AND
       OLD.start_date = NEW.start_date AND
       OLD.end_date = NEW.end_date AND
       OLD.base_price = NEW.base_price AND
       OLD.total_price = NEW.total_price)
      OR
      -- Si la réservation est en attente, peut l'annuler
      (status = 'pending' AND NEW.status = 'cancelled')
    )
  );

-- Propriétaires peuvent mettre à jour les réservations de leurs véhicules
CREATE POLICY "owner_update_bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (
    -- Ne peut modifier que certaines colonnes
    (auth.uid() = owner_id) AND
    (
      -- Accepter/refuser une demande
      (OLD.status = 'pending' AND (NEW.status = 'accepted' OR NEW.status = 'rejected'))
      OR
      -- Mettre à jour l'état des lieux et le contrat
      (OLD.status = 'confirmed' AND NEW.status = 'in_progress')
      OR
      -- Terminer la location
      (OLD.status = 'in_progress' AND NEW.status = 'completed')
    )
  );

-- Créer une fonction pour vérifier les disponibilités
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  vehicle_id UUID,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si le véhicule existe et est disponible
  IF NOT EXISTS (
    SELECT 1 FROM vehicles 
    WHERE id = vehicle_id 
    AND status = 'available'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Vérifier s'il n'y a pas de chevauchement avec d'autres réservations
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.vehicle_id = check_vehicle_availability.vehicle_id
    AND bookings.status IN ('pending', 'accepted', 'confirmed', 'in_progress')
    AND (
      (bookings.start_date <= check_vehicle_availability.end_date)
      AND
      (bookings.end_date >= check_vehicle_availability.start_date)
    )
  );
END;
$$;

-- Trigger pour assurer que les dates sont valides
CREATE OR REPLACE FUNCTION validate_booking_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que la date de début est avant la date de fin
  IF NEW.start_date >= NEW.end_date THEN
    RAISE EXCEPTION 'La date de début doit être antérieure à la date de fin';
  END IF;

  -- Vérifier que la date de début est dans le futur pour les nouvelles réservations
  IF TG_OP = 'INSERT' AND NEW.start_date <= NOW() THEN
    RAISE EXCEPTION 'La date de début doit être dans le futur';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_booking_dates
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION validate_booking_dates();

-- Créer une fonction RPC pour demander une réservation
CREATE OR REPLACE FUNCTION request_booking(
  p_vehicle_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_pickup_location TEXT,
  p_return_location TEXT,
  p_insurance_option TEXT DEFAULT 'basic'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
  v_base_price DECIMAL(10,2);
  v_days INTEGER;
  v_insurance_fee DECIMAL(10,2) := 0;
  v_service_fee DECIMAL(10,2);
  v_total_price DECIMAL(10,2);
  v_deposit_amount DECIMAL(10,2) := 5000; -- Dépôt standard de 5000 MAD
  v_booking_id UUID;
BEGIN
  -- Vérifier la disponibilité
  IF NOT check_vehicle_availability(p_vehicle_id, p_start_date, p_end_date) THEN
    RAISE EXCEPTION 'Le véhicule n''est pas disponible pour ces dates';
  END IF;

  -- Obtenir les informations du véhicule
  SELECT owner_id, price_per_day 
  INTO v_owner_id, v_base_price
  FROM vehicles
  WHERE id = p_vehicle_id;

  -- Calculer le nombre de jours
  v_days := CEIL(EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / 86400);
  
  -- Calculer les frais d'assurance
  IF p_insurance_option = 'premium' THEN
    v_insurance_fee := v_days * 100; -- 100 MAD/jour
  ELSIF p_insurance_option = 'standard' THEN
    v_insurance_fee := v_days * 50; -- 50 MAD/jour
  END IF;
  
  -- Calculer les frais de service (10%)
  v_service_fee := (v_base_price * v_days) * 0.10;
  
  -- Calculer le prix total
  v_total_price := (v_base_price * v_days) + v_insurance_fee + v_service_fee;

  -- Créer la réservation
  INSERT INTO bookings (
    vehicle_id,
    renter_id,
    owner_id,
    start_date,
    end_date,
    pickup_location,
    return_location,
    base_price,
    insurance_fee,
    service_fee,
    total_price,
    deposit_amount,
    status,
    payment_status
  )
  VALUES (
    p_vehicle_id,
    auth.uid(),
    v_owner_id,
    p_start_date,
    p_end_date,
    p_pickup_location,
    p_return_location,
    v_base_price * v_days,
    v_insurance_fee,
    v_service_fee,
    v_total_price,
    v_deposit_amount,
    'pending',
    'preauthorized'
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

-- Créer une fonction RPC pour accepter une demande de réservation
CREATE OR REPLACE FUNCTION accept_booking_request(
  p_booking_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings;
BEGIN
  -- Vérifier que la réservation existe et que l'utilisateur est le propriétaire
  SELECT * INTO v_booking 
  FROM bookings 
  WHERE id = p_booking_id 
  AND owner_id = auth.uid()
  AND status = 'pending';
  
  IF v_booking.id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Mettre à jour la réservation
  UPDATE bookings
  SET status = 'accepted',
      updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Créer une fonction RPC pour refuser une demande de réservation
CREATE OR REPLACE FUNCTION reject_booking_request(
  p_booking_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings;
BEGIN
  -- Vérifier que la réservation existe et que l'utilisateur est le propriétaire
  SELECT * INTO v_booking 
  FROM bookings 
  WHERE id = p_booking_id 
  AND owner_id = auth.uid()
  AND status = 'pending';
  
  IF v_booking.id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Mettre à jour la réservation
  UPDATE bookings
  SET status = 'rejected',
      owner_notes = p_reason,
      updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Accorder les permissions pour les fonctions
GRANT EXECUTE ON FUNCTION check_vehicle_availability TO authenticated;
GRANT EXECUTE ON FUNCTION request_booking TO authenticated;
GRANT EXECUTE ON FUNCTION accept_booking_request TO authenticated;
GRANT EXECUTE ON FUNCTION reject_booking_request TO authenticated;

-- Créer un trigger pour mettre à jour les dates de modification
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 