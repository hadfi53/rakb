-- Fonctions pour générer des notifications contextuelles

-- Créer la table des notifications si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Configurer les politiques RLS
CREATE POLICY "Les utilisateurs peuvent voir leurs propres notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le champ updated_at automatiquement
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    is_read,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_id,
    FALSE,
    NOW(),
    NOW()
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier le locataire d'une réservation confirmée
CREATE OR REPLACE FUNCTION notify_booking_confirmed() RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
  v_owner_name TEXT;
BEGIN
  -- Récupérer les informations du véhicule et du propriétaire
  SELECT 
    CONCAT(v.make, ' ', v.model, ' ', v.year) AS vehicle_name,
    TO_CHAR(b.start_date, 'DD/MM/YYYY') AS start_date,
    TO_CHAR(b.end_date, 'DD/MM/YYYY') AS end_date,
    CONCAT(p.first_name, ' ', p.last_name) AS owner_name
  INTO 
    v_vehicle_name, v_start_date, v_end_date, v_owner_name
  FROM 
    bookings b
    JOIN vehicles v ON b.vehicle_id = v.id
    JOIN profiles p ON v.owner_id = p.id
  WHERE 
    b.id = NEW.id;

  -- Créer la notification pour le locataire
  PERFORM create_notification(
    NEW.renter_id,
    'booking_confirmed',
    'Réservation confirmée',
    CONCAT('Votre réservation pour ', v_vehicle_name, ' du ', v_start_date, ' au ', v_end_date, ' a été confirmée par ', v_owner_name, '.'),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour notifier le locataire d'une réservation rejetée
CREATE OR REPLACE FUNCTION notify_booking_rejected() RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
  v_owner_name TEXT;
BEGIN
  -- Récupérer les informations du véhicule et du propriétaire
  SELECT 
    CONCAT(v.make, ' ', v.model, ' ', v.year) AS vehicle_name,
    TO_CHAR(b.start_date, 'DD/MM/YYYY') AS start_date,
    TO_CHAR(b.end_date, 'DD/MM/YYYY') AS end_date,
    CONCAT(p.first_name, ' ', p.last_name) AS owner_name
  INTO 
    v_vehicle_name, v_start_date, v_end_date, v_owner_name
  FROM 
    bookings b
    JOIN vehicles v ON b.vehicle_id = v.id
    JOIN profiles p ON v.owner_id = p.id
  WHERE 
    b.id = NEW.id;

  -- Créer la notification pour le locataire
  PERFORM create_notification(
    NEW.renter_id,
    'booking_rejected',
    'Réservation refusée',
    CONCAT('Votre demande de réservation pour ', v_vehicle_name, ' du ', v_start_date, ' au ', v_end_date, ' a été refusée par ', v_owner_name, '.'),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour notifier le propriétaire d'une nouvelle demande de réservation
CREATE OR REPLACE FUNCTION notify_booking_request() RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
  v_renter_name TEXT;
  v_owner_id UUID;
BEGIN
  -- Récupérer les informations du véhicule, du locataire et du propriétaire
  SELECT 
    CONCAT(v.make, ' ', v.model, ' ', v.year) AS vehicle_name,
    TO_CHAR(b.start_date, 'DD/MM/YYYY') AS start_date,
    TO_CHAR(b.end_date, 'DD/MM/YYYY') AS end_date,
    CONCAT(p.first_name, ' ', p.last_name) AS renter_name,
    v.owner_id
  INTO 
    v_vehicle_name, v_start_date, v_end_date, v_renter_name, v_owner_id
  FROM 
    bookings b
    JOIN vehicles v ON b.vehicle_id = v.id
    JOIN profiles p ON b.renter_id = p.id
  WHERE 
    b.id = NEW.id;

  -- Créer la notification pour le propriétaire
  PERFORM create_notification(
    v_owner_id,
    'booking_request',
    'Nouvelle demande de réservation',
    CONCAT(v_renter_name, ' souhaite réserver votre véhicule ', v_vehicle_name, ' du ', v_start_date, ' au ', v_end_date, '.'),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour notifier le propriétaire d'une annulation de réservation
CREATE OR REPLACE FUNCTION notify_booking_cancelled() RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_name TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
  v_renter_name TEXT;
  v_owner_id UUID;
BEGIN
  -- Récupérer les informations du véhicule, du locataire et du propriétaire
  SELECT 
    CONCAT(v.make, ' ', v.model, ' ', v.year) AS vehicle_name,
    TO_CHAR(b.start_date, 'DD/MM/YYYY') AS start_date,
    TO_CHAR(b.end_date, 'DD/MM/YYYY') AS end_date,
    CONCAT(p.first_name, ' ', p.last_name) AS renter_name,
    v.owner_id
  INTO 
    v_vehicle_name, v_start_date, v_end_date, v_renter_name, v_owner_id
  FROM 
    bookings b
    JOIN vehicles v ON b.vehicle_id = v.id
    JOIN profiles p ON b.renter_id = p.id
  WHERE 
    b.id = NEW.id;

  -- Créer la notification pour le propriétaire
  PERFORM create_notification(
    v_owner_id,
    'booking_cancelled',
    'Réservation annulée',
    CONCAT(v_renter_name, ' a annulé sa réservation pour votre véhicule ', v_vehicle_name, ' du ', v_start_date, ' au ', v_end_date, '.'),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour notifier l'utilisateur d'un nouveau message
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
BEGIN
  -- Récupérer le nom de l'expéditeur
  SELECT 
    CONCAT(p.first_name, ' ', p.last_name) AS sender_name
  INTO 
    v_sender_name
  FROM 
    profiles p
  WHERE 
    p.id = NEW.sender_id;

  -- Créer la notification pour le destinataire
  PERFORM create_notification(
    NEW.recipient_id,
    'message',
    'Nouveau message',
    CONCAT('Vous avez reçu un nouveau message de ', v_sender_name, ': "', SUBSTRING(NEW.content FROM 1 FOR 50), CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END, '"'),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour notifier le propriétaire d'un nouvel avis
CREATE OR REPLACE FUNCTION notify_new_review() RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name TEXT;
  v_vehicle_name TEXT;
  v_owner_id UUID;
BEGIN
  -- Récupérer les informations du véhicule, du propriétaire et de l'auteur de l'avis
  SELECT 
    CONCAT(p.first_name, ' ', p.last_name) AS reviewer_name,
    CONCAT(v.make, ' ', v.model, ' ', v.year) AS vehicle_name,
    v.owner_id
  INTO 
    v_reviewer_name, v_vehicle_name, v_owner_id
  FROM 
    reviews r
    JOIN profiles p ON r.user_id = p.id
    JOIN vehicles v ON r.vehicle_id = v.id
  WHERE 
    r.id = NEW.id;

  -- Créer la notification pour le propriétaire
  PERFORM create_notification(
    v_owner_id,
    'review',
    'Nouvel avis',
    CONCAT(v_reviewer_name, ' a laissé un avis ', NEW.rating, '/5 pour votre véhicule ', v_vehicle_name, '.'),
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour les différents événements
DROP TRIGGER IF EXISTS trigger_booking_confirmed ON bookings;
CREATE TRIGGER trigger_booking_confirmed
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'confirmed')
  EXECUTE FUNCTION notify_booking_confirmed();

DROP TRIGGER IF EXISTS trigger_booking_rejected ON bookings;
CREATE TRIGGER trigger_booking_rejected
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'rejected')
  EXECUTE FUNCTION notify_booking_rejected();

DROP TRIGGER IF EXISTS trigger_booking_request ON bookings;
CREATE TRIGGER trigger_booking_request
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_booking_request();

DROP TRIGGER IF EXISTS trigger_booking_cancelled ON bookings;
CREATE TRIGGER trigger_booking_cancelled
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled')
  EXECUTE FUNCTION notify_booking_cancelled();

-- Créer les triggers pour les messages et avis si les tables existent
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    DROP TRIGGER IF EXISTS trigger_new_message ON messages;
    CREATE TRIGGER trigger_new_message
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_message();
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    DROP TRIGGER IF EXISTS trigger_new_review ON reviews;
    CREATE TRIGGER trigger_new_review
      AFTER INSERT ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_review();
  END IF;
END $$; 