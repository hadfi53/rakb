-- Vérifier si la table bookings existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings'
    ) THEN
        -- Créer la table bookings si elle n'existe pas
        CREATE TABLE public.bookings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
            renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            start_date TIMESTAMPTZ NOT NULL,
            end_date TIMESTAMPTZ NOT NULL,
            status booking_status NOT NULL DEFAULT 'pending'::booking_status,
            total_amount DECIMAL(10, 2) NOT NULL,
            duration_days INTEGER,
            payment_status payment_status DEFAULT 'pending'::payment_status,
            payment_id TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            review_comment TEXT,
            is_owner_notified BOOLEAN DEFAULT FALSE,
            is_renter_notified BOOLEAN DEFAULT FALSE,
            last_notification_date TIMESTAMPTZ
        );
    ELSE
        -- Ajouter les colonnes manquantes si la table existe déjà
        BEGIN
            ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_owner_notified BOOLEAN DEFAULT FALSE;
        EXCEPTION WHEN duplicate_column THEN
            -- Colonne existe déjà, ne rien faire
        END;
        
        BEGIN
            ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_renter_notified BOOLEAN DEFAULT FALSE;
        EXCEPTION WHEN duplicate_column THEN
            -- Colonne existe déjà, ne rien faire
        END;
        
        BEGIN
            ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS last_notification_date TIMESTAMPTZ;
        EXCEPTION WHEN duplicate_column THEN
            -- Colonne existe déjà, ne rien faire
        END;
    END IF;
END
$$;

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON public.bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);

-- Créer ou mettre à jour la fonction de notification pour les propriétaires
CREATE OR REPLACE FUNCTION notify_owner_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Marquer la réservation comme non notifiée pour le propriétaire
    NEW.is_owner_notified = FALSE;
    NEW.last_notification_date = NOW();
    
    -- Insérer une notification dans la table des notifications (si elle existe)
    BEGIN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            related_id,
            is_read
        ) VALUES (
            NEW.owner_id,
            'booking_request',
            'Nouvelle demande de réservation',
            'Vous avez reçu une nouvelle demande de réservation pour votre véhicule.',
            NEW.id,
            FALSE
        );
    EXCEPTION WHEN undefined_table THEN
        -- La table notifications n'existe pas encore, on ignore
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour la notification des propriétaires
DROP TRIGGER IF EXISTS trigger_notify_owner_on_booking ON public.bookings;
CREATE TRIGGER trigger_notify_owner_on_booking
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION notify_owner_on_booking();

-- Créer la table des notifications si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Créer les index pour la table des notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Accorder les permissions nécessaires
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Désactiver RLS pour ces tables (comme les autres tables du système)
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY; 