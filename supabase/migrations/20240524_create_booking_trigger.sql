-- Création de l'extension uuid-ossp si elle n'existe pas déjà
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table email_logs pour stocker les logs d'emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  related_id UUID,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table email_queue pour stocker les emails en attente d'envoi
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  related_id UUID,
  related_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- Fonction pour mettre à jour le champ updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le champ updated_at automatiquement
CREATE TRIGGER update_email_queue_updated_at
BEFORE UPDATE ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at
BEFORE UPDATE ON public.email_logs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer un email de notification de réservation
CREATE OR REPLACE FUNCTION queue_booking_notification_email()
RETURNS TRIGGER AS $$
DECLARE
    v_vehicle_info RECORD;
    v_owner_info RECORD;
    v_renter_info RECORD;
    v_html_content TEXT;
    v_text_content TEXT;
    v_subject TEXT;
BEGIN
    -- Récupérer les informations du véhicule
    SELECT 
        v.id, 
        v.make, 
        v.model, 
        v.year, 
        v.price_per_day,
        v.location
    INTO v_vehicle_info
    FROM public.vehicles v
    WHERE v.id = NEW.vehicle_id;
    
    -- Récupérer les informations du propriétaire
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        p.email
    INTO v_owner_info
    FROM public.profiles p
    WHERE p.id = NEW.owner_id;
    
    -- Récupérer les informations du locataire
    SELECT 
        p.id, 
        p.first_name, 
        p.last_name, 
        p.email,
        p.phone
    INTO v_renter_info
    FROM public.profiles p
    WHERE p.id = NEW.renter_id;
    
    -- Créer le sujet de l'email
    v_subject := 'Nouvelle réservation pour votre véhicule ' || 
                 COALESCE(v_vehicle_info.make, '') || ' ' || 
                 COALESCE(v_vehicle_info.model, '');
    
    -- Créer le contenu HTML de l'email
    v_html_content := '
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .details { margin: 20px 0; }
            .details table { width: 100%; border-collapse: collapse; }
            .details th, .details td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .details th { background-color: #f2f2f2; }
            .button { display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Nouvelle réservation</h1>
            </div>
            <div class="content">
                <p>Bonjour ' || v_owner_info.first_name || ',</p>
                <p>Vous avez reçu une nouvelle demande de réservation pour votre véhicule.</p>
                
                <div class="details">
                    <h2>Détails de la réservation</h2>
                    <table>
                        <tr>
                            <th>Véhicule</th>
                            <td>' || COALESCE(v_vehicle_info.make, '') || ' ' || COALESCE(v_vehicle_info.model, '') || ' ' || COALESCE(v_vehicle_info.year::text, '') || '</td>
                        </tr>
                        <tr>
                            <th>Dates</th>
                            <td>Du ' || TO_CHAR(NEW.start_date::date, 'DD/MM/YYYY') || ' au ' || TO_CHAR(NEW.end_date::date, 'DD/MM/YYYY') || '</td>
                        </tr>
                        <tr>
                            <th>Lieu</th>
                            <td>' || COALESCE(NEW.pickup_location, v_vehicle_info.location) || '</td>
                        </tr>
                        <tr>
                            <th>Prix total</th>
                            <td>' || COALESCE(NEW.total_price::text, '0') || ' MAD</td>
                        </tr>
                    </table>
                </div>
                
                <div class="details">
                    <h2>Informations sur le locataire</h2>
                    <table>
                        <tr>
                            <th>Nom</th>
                            <td>' || v_renter_info.first_name || ' ' || v_renter_info.last_name || '</td>
                        </tr>
                        <tr>
                            <th>Email</th>
                            <td>' || v_renter_info.email || '</td>
                        </tr>
                        <tr>
                            <th>Téléphone</th>
                            <td>' || COALESCE(v_renter_info.phone, 'Non renseigné') || '</td>
                        </tr>
                    </table>
                </div>
                
                <p>Veuillez vous connecter à votre compte pour accepter ou refuser cette demande.</p>
                <p style="text-align: center; margin-top: 30px;">
                    <a href="https://rakeb.ma/dashboard/owner" class="button">Accéder à mon tableau de bord</a>
                </p>
            </div>
            <div class="footer">
                <p>Cet email a été envoyé automatiquement par Rakeb. Merci de ne pas y répondre.</p>
            </div>
        </div>
    </body>
    </html>
    ';
    
    -- Créer le contenu texte de l'email
    v_text_content := 'Bonjour ' || v_owner_info.first_name || ',
    
Vous avez reçu une nouvelle demande de réservation pour votre véhicule.

Détails de la réservation:
- Véhicule: ' || COALESCE(v_vehicle_info.make, '') || ' ' || COALESCE(v_vehicle_info.model, '') || ' ' || COALESCE(v_vehicle_info.year::text, '') || '
- Dates: Du ' || TO_CHAR(NEW.start_date::date, 'DD/MM/YYYY') || ' au ' || TO_CHAR(NEW.end_date::date, 'DD/MM/YYYY') || '
- Lieu: ' || COALESCE(NEW.pickup_location, v_vehicle_info.location) || '
- Prix total: ' || COALESCE(NEW.total_price::text, '0') || ' MAD

Informations sur le locataire:
- Nom: ' || v_renter_info.first_name || ' ' || v_renter_info.last_name || '
- Email: ' || v_renter_info.email || '
- Téléphone: ' || COALESCE(v_renter_info.phone, 'Non renseigné') || '

Veuillez vous connecter à votre compte pour accepter ou refuser cette demande: https://rakeb.ma/dashboard/owner

Cet email a été envoyé automatiquement par Rakeb. Merci de ne pas y répondre.';
    
    -- Ajouter l'email à la file d'attente
    INSERT INTO public.email_queue (
        recipient_email,
        subject,
        html_content,
        text_content,
        status,
        related_id,
        related_type
    ) VALUES (
        v_owner_info.email,
        v_subject,
        v_html_content,
        v_text_content,
        'pending',
        NEW.id,
        'booking'
    );
    
    -- Ajouter un log
    INSERT INTO public.email_logs (
        recipient_email,
        email_type,
        related_id,
        status
    ) VALUES (
        v_owner_info.email,
        'booking_notification',
        NEW.id,
        'queued'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour envoyer un email lors de la création d'une réservation
CREATE TRIGGER trigger_queue_booking_notification_email
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION queue_booking_notification_email();

-- Accorder les permissions nécessaires
GRANT ALL ON public.email_queue TO authenticated;
GRANT ALL ON public.email_logs TO authenticated; 