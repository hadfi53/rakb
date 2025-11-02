-- Script pour ajouter la colonne notes à la table bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT; 