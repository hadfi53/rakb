-- 1. Créer la table de logs d'emails si elle n'existe pas
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

-- 2. Créer une table pour stocker les emails à envoyer
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  related_id UUID,
  related_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE
);

-- 3. Créer un index sur le statut pour faciliter les requêtes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);

-- 4. Fonction pour mettre en file d'attente un email de notification de réservation
CREATE OR REPLACE FUNCTION queue_booking_notification_email()
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
  
  -- Ajouter l'email à la file d'attente
  INSERT INTO public.email_queue (
    recipient_email,
    subject,
    html_content,
    related_id,
    related_type,
    status
  ) VALUES (
    v_owner_email,
    v_email_subject,
    v_email_content,
    NEW.id,
    'booking_notification',
    'pending'
  );
  
  -- Enregistrer dans les logs
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
    'queued',
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

-- 5. Créer le déclencheur sur la table des réservations
DROP TRIGGER IF EXISTS trigger_queue_booking_notification_email ON public.bookings;
CREATE TRIGGER trigger_queue_booking_notification_email
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION queue_booking_notification_email();

-- 6. Créer une fonction pour envoyer les emails en attente (à appeler depuis votre application)
CREATE OR REPLACE FUNCTION process_email_queue(max_emails INTEGER DEFAULT 10)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_emails_processed INTEGER := 0;
  v_email RECORD;
BEGIN
  -- Récupérer les emails en attente
  FOR v_email IN 
    SELECT id, recipient_email, subject, html_content, related_id
    FROM public.email_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT max_emails
  LOOP
    -- Mettre à jour le statut de l'email
    UPDATE public.email_queue
    SET status = 'processing', updated_at = now()
    WHERE id = v_email.id;
    
    -- Ici, vous devriez appeler votre service d'email externe
    -- Pour l'instant, nous allons simplement marquer l'email comme envoyé
    
    -- Mettre à jour le statut de l'email
    UPDATE public.email_queue
    SET status = 'sent', sent_at = now(), updated_at = now()
    WHERE id = v_email.id;
    
    -- Enregistrer dans les logs
    INSERT INTO public.email_logs (
      recipient_email,
      email_type,
      related_id,
      status,
      created_at
    ) VALUES (
      v_email.recipient_email,
      'email_sent',
      v_email.related_id,
      'sent',
      now()
    );
    
    v_emails_processed := v_emails_processed + 1;
  END LOOP;
  
  RETURN v_emails_processed;
END;
$$;

-- 7. Accorder les permissions nécessaires
GRANT SELECT, INSERT, UPDATE ON public.email_queue TO authenticated;
GRANT SELECT, INSERT ON public.email_logs TO authenticated;
GRANT EXECUTE ON FUNCTION process_email_queue TO authenticated;
GRANT EXECUTE ON FUNCTION queue_booking_notification_email TO authenticated; 