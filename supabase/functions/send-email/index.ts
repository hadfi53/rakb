// Supabase Edge Function pour envoyer des emails
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Créer un client Supabase avec les clés d'API de l'environnement
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les données de la requête
    const { record, type } = await req.json();

    // Si c'est une notification de nouvelle réservation
    if (type === "INSERT" && record?.id) {
      // Récupérer les détails de la réservation
      const { data: booking, error: bookingError } = await supabaseClient
        .from("bookings")
        .select(`
          id,
          vehicle_id,
          renter_id,
          owner_id,
          start_date,
          end_date,
          pickup_location,
          return_location,
          total_price,
          status
        `)
        .eq("id", record.id)
        .single();

      if (bookingError) {
        console.error("Erreur lors de la récupération de la réservation:", bookingError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la récupération de la réservation" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Récupérer les informations du véhicule et du propriétaire
      const { data: vehicle, error: vehicleError } = await supabaseClient
        .from("vehicles")
        .select(`
          id,
          make,
          model,
          year,
          owner_id,
          profiles:owner_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq("id", booking.vehicle_id)
        .single();

      if (vehicleError) {
        console.error("Erreur lors de la récupération du véhicule:", vehicleError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la récupération du véhicule" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Récupérer les informations du locataire
      const { data: renter, error: renterError } = await supabaseClient
        .from("profiles")
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone
        `)
        .eq("id", booking.renter_id)
        .single();

      if (renterError) {
        console.error("Erreur lors de la récupération du locataire:", renterError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la récupération du locataire" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Formater les dates
      const startDate = new Date(booking.start_date).toLocaleDateString("fr-FR");
      const endDate = new Date(booking.end_date).toLocaleDateString("fr-FR");
      
      // Calculer le nombre de jours
      const startDateObj = new Date(booking.start_date);
      const endDateObj = new Date(booking.end_date);
      const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Créer le contenu de l'email
      const emailContent = `
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
            <p>Bonjour ${vehicle.profiles.first_name},</p>
            <p>Bonne nouvelle ! Un locataire souhaite réserver votre véhicule.</p>
            
            <div class="booking-details">
              <h2>Détails de la réservation</h2>
              <p><strong>Véhicule :</strong> ${vehicle.make} ${vehicle.model} ${vehicle.year}</p>
              <p><strong>Dates :</strong> Du ${startDate} au ${endDate} (${diffDays} jours)</p>
              <p><strong>Lieu de prise en charge :</strong> ${booking.pickup_location}</p>
              <p><strong>Lieu de retour :</strong> ${booking.return_location}</p>
              <p><strong>Prix total :</strong> <span class="price">${booking.total_price} MAD</span></p>
            </div>
            
            <div class="booking-details">
              <h2>Informations sur le locataire</h2>
              <p><strong>Nom :</strong> ${renter.first_name} ${renter.last_name}</p>
              <p><strong>Email :</strong> ${renter.email}</p>
              <p><strong>Téléphone :</strong> ${renter.phone || 'Non renseigné'}</p>
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
      `;

      // Envoyer l'email via un service d'email (exemple avec Resend)
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        },
        body: JSON.stringify({
          from: "Rakeb <reservations@rakeb.ma>",
          to: vehicle.profiles.email,
          subject: `Nouvelle réservation pour votre ${vehicle.make} ${vehicle.model}`,
          html: emailContent,
        }),
      });

      if (!emailResponse.ok) {
        const emailError = await emailResponse.json();
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        
        // Enregistrer l'erreur dans la table de logs
        await supabaseClient
          .from("email_logs")
          .insert({
            recipient_email: vehicle.profiles.email,
            email_type: "booking_notification",
            related_id: booking.id,
            status: "error",
            error_message: JSON.stringify(emailError),
          });
          
        return new Response(
          JSON.stringify({ error: "Erreur lors de l'envoi de l'email" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Enregistrer le succès dans la table de logs
      await supabaseClient
        .from("email_logs")
        .insert({
          recipient_email: vehicle.profiles.email,
          email_type: "booking_notification",
          related_id: booking.id,
          status: "sent",
        });

      return new Response(
        JSON.stringify({ success: true, message: "Email envoyé avec succès" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Aucune action requise" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur dans la fonction Edge:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}); 