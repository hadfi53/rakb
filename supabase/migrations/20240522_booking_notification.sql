-- Fonction pour envoyer un email au propriétaire lors d'une nouvelle réservation
CREATE OR REPLACE FUNCTION notify_owner_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vehicle_info RECORD;
  v_renter_info RECORD;
  v_owner_email TEXT;
  v_email_subject TEXT;
  v_email_content TEXT;
  v_start_date TEXT;
  v_end_date TEXT;
  v_total_days INTEGER;
BEGIN
  -- Récupérer les informations du véhicule et du propriétaire
  SELECT v.make, v.model, v.year, p.email, p.first_name, p.last_name
  INTO v_vehicle_info
  FROM public.vehicles v
  JOIN public.profiles p ON v.owner_id = p.id
  WHERE v.id = NEW.vehicle_id;
  
  -- Récupérer les informations du locataire
  SELECT p.first_name, p.last_name, p.email, p.phone
  INTO v_renter_info
  FROM public.profiles p
  WHERE p.id = NEW.renter_id;
  
  -- Stocker l'email du propriétaire
  v_owner_email := v_vehicle_info.email;
  
  -- Formater les dates pour l'affichage
  v_start_date := to_char(NEW.start_date, 'DD/MM/YYYY');
  v_end_date := to_char(NEW.end_date, 'DD/MM/YYYY');
  
  -- Calculer le nombre de jours
  v_total_days := (NEW.end_date - NEW.start_date)::INTEGER;
  
  -- Créer le sujet de l'email
  v_email_subject := 'Nouvelle réservation pour votre ' || v_vehicle_info.make || ' ' || v_vehicle_info.model;
  
  -- Créer le contenu de l'email
  v_email_content := '
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background-color: #f9fafb; }
      .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
      .booking-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
      .price { font-weight: bold; color: #4f46e5; }
      .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Nouvelle réservation</h1>
      </div>
      <div class="content">
        <p>Bonjour ' || v_vehicle_info.first_name || ',</p>
        <p>Bonne nouvelle ! Un locataire souhaite réserver votre véhicule.</p>
        
        <div class="booking-details">
          <h2>Détails de la réservation</h2>
          <p><strong>Véhicule :</strong> ' || v_vehicle_info.make || ' ' || v_vehicle_info.model || ' ' || v_vehicle_info.year || '</p>
          <p><strong>Dates :</strong> Du ' || v_start_date || ' au ' || v_end_date || ' (' || v_total_days || ' jours)</p>
          <p><strong>Lieu de prise en charge :</strong> ' || NEW.pickup_location || '</p>
          <p><strong>Lieu de retour :</strong> ' || NEW.return_location || '</p>
          <p><strong>Prix total :</strong> <span class="price">' || NEW.total_price || ' MAD</span></p>
        </div>
        
        <div class="booking-details">
          <h2>Informations sur le locataire</h2>
          <p><strong>Nom :</strong> ' || v_renter_info.first_name || ' ' || v_renter_info.last_name || '</p>
          <p><strong>Email :</strong> ' || v_renter_info.email || '</p>
          <p><strong>Téléphone :</strong> ' || v_renter_info.phone || '</p>
        </div>
        
        <p>Vous pouvez accepter ou refuser cette réservation en vous connectant à votre compte.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="https://rakeb.ma/dashboard/owner" class="button">Gérer cette réservation</a>
        </p>
      </div>
      <div class="footer">
        <p>© 2024 Rakeb. Tous droits réservés.</p>
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      </div>
    </div>
  </body>
  </html>
  ';
  
  -- Envoyer l'email via la fonction pg_notify
  PERFORM pg_notify(
    'send_email',
    json_build_object(
      'to', v_owner_email,
      'subject', v_email_subject,
      'html_content', v_email_content
    )::text
  );
  
  -- Enregistrer l'envoi de l'email dans une table de logs (optionnel)
  INSERT INTO public.email_logs (
    recipient_email,
    email_type,
    related_id,
    status,
    created_at
  ) VALUES (
    v_owner_email,
    'booking_notification',
    NEW.id,
    'sent',
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, enregistrer l'erreur mais ne pas bloquer la création de la réservation
    INSERT INTO public.email_logs (
      recipient_email,
      email_type,
      related_id,
      status,
      error_message,
      created_at
    ) VALUES (
      COALESCE(v_owner_email, 'unknown'),
      'booking_notification',
      NEW.id,
      'error',
      SQLERRM,
      now()
    );
    
    RETURN NEW;
END;
$$;

-- Créer la table de logs d'emails si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  related_id UUID,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Créer le déclencheur sur la table des réservations
DROP TRIGGER IF EXISTS trigger_notify_owner_on_booking ON public.bookings;
CREATE TRIGGER trigger_notify_owner_on_booking
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION notify_owner_on_booking(); 