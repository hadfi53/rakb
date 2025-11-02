-- Vérifier si la table notifications existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
    ) THEN
        -- Créer la table notifications si elle n'existe pas
        CREATE TABLE public.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            related_id UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Créer les index pour les performances
        CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
        CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
        CREATE INDEX idx_notifications_type ON public.notifications(type);

        -- Activer RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Configurer les politiques RLS
        CREATE POLICY "Users can view their own notifications"
            ON public.notifications
            FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can update their own notifications"
            ON public.notifications
            FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);

        -- Créer un trigger pour mettre à jour updated_at
        CREATE OR REPLACE FUNCTION update_notifications_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_notifications_updated_at
            BEFORE UPDATE ON public.notifications
            FOR EACH ROW
            EXECUTE FUNCTION update_notifications_updated_at();

        -- Accorder les permissions nécessaires
        GRANT ALL ON public.notifications TO authenticated;
    END IF;
END
$$; 