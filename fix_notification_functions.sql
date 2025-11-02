-- Script pour corriger les fonctions de notification

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