-- Ajouter la colonne check_in_out_status à la table bookings
ALTER TABLE bookings
ADD COLUMN check_in_out_status TEXT NOT NULL DEFAULT 'not_started'
CHECK (check_in_out_status IN ('not_started', 'check_in_completed', 'check_out_completed'));

-- Créer la table pour les photos de check-in/check-out
CREATE TABLE check_in_out_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('exterior', 'interior', 'odometer')),
  url TEXT NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  taken_by TEXT NOT NULL CHECK (taken_by IN ('owner', 'renter')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Créer un index sur booking_id pour optimiser les requêtes
CREATE INDEX idx_check_in_out_photos_booking_id ON check_in_out_photos(booking_id);

-- Créer un trigger pour mettre à jour updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON check_in_out_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer les politiques de sécurité
ALTER TABLE check_in_out_photos ENABLE ROW LEVEL SECURITY;

-- Les propriétaires peuvent voir les photos de leurs réservations
CREATE POLICY "Owners can view their booking photos"
  ON check_in_out_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = check_in_out_photos.booking_id
      AND bookings.owner_id = auth.uid()
    )
  );

-- Les locataires peuvent voir les photos de leurs réservations
CREATE POLICY "Renters can view their booking photos"
  ON check_in_out_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = check_in_out_photos.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Les propriétaires peuvent ajouter des photos de check-in
CREATE POLICY "Owners can add check-in photos"
  ON check_in_out_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = check_in_out_photos.booking_id
      AND bookings.owner_id = auth.uid()
      AND bookings.status = 'confirmed'
      AND check_in_out_photos.taken_by = 'owner'
    )
  );

-- Les locataires peuvent ajouter des photos de check-out
CREATE POLICY "Renters can add check-out photos"
  ON check_in_out_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = check_in_out_photos.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'in_progress'
      AND check_in_out_photos.taken_by = 'renter'
    )
  );

-- Les administrateurs peuvent tout voir
CREATE POLICY "Admins can view all photos"
  ON check_in_out_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  ); 