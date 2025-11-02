-- Script pour créer la table notifications

-- Vérifier si la fonction uuid_generate_v4 existe, sinon l'installer
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes pour de meilleures performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Activer Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Politiques pour Row Level Security
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour le timestamp updated_at
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER AS $BODY$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $BODY$ LANGUAGE plpgsql;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS set_updated_at ON public.notifications;

-- Créer le trigger pour mettre à jour updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Accorder les permissions
GRANT ALL ON public.notifications TO authenticated;

-- Ajouter une notification de test pour vérifier que tout fonctionne
INSERT INTO public.notifications (
  user_id,
  type,
  title,
  message,
  is_read
) 
SELECT 
  auth.uid(), -- Utilisera l'ID de l'utilisateur actuellement connecté
  'test',
  'Test Notification',
  'This is a test notification to verify the table creation',
  false
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO NOTHING; -- Éviter les erreurs si la notification existe déjà 