// Comprehensive Email Service for All Events
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email event types
type EmailEventType =
  | "user_registered"
  | "user_verified"
  | "booking_created"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_completed"
  | "payment_received"
  | "payment_failed"
  | "message_received"
  | "review_received"
  | "password_reset"
  | "tenant_verification_approved"
  | "tenant_verification_rejected"
  | "host_verification_approved"
  | "host_verification_rejected"
  | "vehicle_listed"
  | "vehicle_updated";

interface EmailRequest {
  event_type: EmailEventType;
  recipient_email: string;
  recipient_name?: string;
  data: Record<string, any>;
}

// Email template generator
function generateEmailTemplate(eventType: EmailEventType, data: Record<string, any>): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = Deno.env.get("VITE_APP_URL") || "https://rakb.ma";
  const companyName = "RAKB";

  switch (eventType) {
    case "user_registered": {
      const subject = `Bienvenue sur ${companyName} !`;
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Bienvenue sur ${companyName} !</h1></div>
            <div class="content">
              <p>Bonjour ${data.first_name || "Utilisateur"},</p>
              <p>Nous sommes ravis de vous accueillir sur ${companyName}, votre plateforme de location de véhicules.</p>
              <p>Votre compte a été créé avec succès. Pour commencer à utiliser nos services, veuillez compléter votre profil et télécharger les documents nécessaires.</p>
              <p style="text-align: center;">
                <a href="${baseUrl}/dashboard" class="button">Accéder à mon compte</a>
              </p>
              <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Bienvenue sur ${companyName} !\n\nBonjour ${data.first_name || "Utilisateur"},\n\nVotre compte a été créé avec succès. Connectez-vous sur ${baseUrl}/dashboard`;
      return { subject, html, text };
    }

    case "booking_created": {
      const subject = `Nouvelle demande de réservation - ${data.vehicle_name || "Véhicule"}`;
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .booking-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Nouvelle demande de réservation</h1></div>
            <div class="content">
              <p>Bonjour ${data.owner_name || "Propriétaire"},</p>
              <p>Vous avez reçu une nouvelle demande de réservation pour votre véhicule.</p>
              <div class="booking-details">
                <h2>Détails de la réservation</h2>
                <p><strong>Véhicule :</strong> ${data.vehicle_name || "N/A"}</p>
                <p><strong>Dates :</strong> ${data.start_date || "N/A"} au ${data.end_date || "N/A"}</p>
                <p><strong>Locataire :</strong> ${data.renter_name || "N/A"}</p>
                <p><strong>Email :</strong> ${data.renter_email || "N/A"}</p>
                <p><strong>Téléphone :</strong> ${data.renter_phone || "Non renseigné"}</p>
                <p><strong>Prix total :</strong> ${data.total_price || 0} MAD</p>
              </div>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/dashboard/owner" class="button">Gérer cette réservation</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Nouvelle demande de réservation\n\n${data.owner_name || "Propriétaire"}, vous avez reçu une nouvelle demande pour ${data.vehicle_name || "votre véhicule"}.`;
      return { subject, html, text };
    }

    case "booking_confirmed": {
      const subject = `Réservation confirmée - ${data.vehicle_name || "Véhicule"}`;
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .booking-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>✅ Réservation confirmée</h1></div>
            <div class="content">
              <p>Bonjour ${data.renter_name || "Locataire"},</p>
              <p>Excellente nouvelle ! Votre demande de réservation a été confirmée.</p>
              <div class="booking-details">
                <h2>Détails de la réservation</h2>
                <p><strong>Véhicule :</strong> ${data.vehicle_name || "N/A"}</p>
                <p><strong>Dates :</strong> ${data.start_date || "N/A"} au ${data.end_date || "N/A"}</p>
                <p><strong>Lieu de prise en charge :</strong> ${data.pickup_location || "N/A"}</p>
                <p><strong>Prix total :</strong> ${data.total_price || 0} MAD</p>
              </div>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/bookings/${data.booking_id}" class="button">Voir les détails</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Réservation confirmée\n\nVotre réservation pour ${data.vehicle_name || "le véhicule"} a été confirmée.`;
      return { subject, html, text };
    }

    case "booking_rejected": {
      const subject = `Réservation refusée - ${data.vehicle_name || "Véhicule"}`;
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Réservation refusée</h1></div>
            <div class="content">
              <p>Bonjour ${data.renter_name || "Locataire"},</p>
              <p>Nous sommes désolés de vous informer que votre demande de réservation pour ${data.vehicle_name || "le véhicule"} a été refusée par le propriétaire.</p>
              <p>Raison : ${data.rejection_reason || "Non spécifiée"}</p>
              <p>Vous pouvez rechercher d'autres véhicules disponibles sur notre plateforme.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/search" class="button">Rechercher d'autres véhicules</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Réservation refusée\n\nVotre demande de réservation a été refusée.`;
      return { subject, html, text };
    }

    case "booking_cancelled": {
      const subject = `Réservation annulée - ${data.vehicle_name || "Véhicule"}`;
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Réservation annulée</h1></div>
            <div class="content">
              <p>Bonjour ${data.recipient_name || "Utilisateur"},</p>
              <p>La réservation pour ${data.vehicle_name || "le véhicule"} (${data.start_date || "N/A"}) a été annulée.</p>
              ${data.cancelled_by === "renter" ? "<p>Le locataire a annulé sa réservation.</p>" : "<p>Le propriétaire a annulé la réservation.</p>"}
              ${data.refund_amount ? `<p><strong>Remboursement :</strong> ${data.refund_amount} MAD sera effectué selon nos conditions.</p>` : ""}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Réservation annulée\n\nLa réservation a été annulée.`;
      return { subject, html, text };
    }

    case "payment_received": {
      const subject = `Paiement reçu - Réservation ${data.booking_id || ""}`;
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Paiement reçu</h1></div>
            <div class="content">
              <p>Bonjour ${data.recipient_name || "Utilisateur"},</p>
              <p>Nous avons bien reçu votre paiement de <strong>${data.amount || 0} MAD</strong>.</p>
              <p><strong>Référence :</strong> ${data.payment_id || "N/A"}</p>
              ${data.booking_id ? `<p>Votre réservation est maintenant confirmée.</p>` : ""}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Paiement reçu\n\nVotre paiement de ${data.amount || 0} MAD a été reçu.`;
      return { subject, html, text };
    }

    case "message_received": {
      const subject = `Nouveau message de ${data.sender_name || "Utilisateur"}`;
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .message { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Nouveau message</h1></div>
            <div class="content">
              <p>Bonjour ${data.recipient_name || "Utilisateur"},</p>
              <p>Vous avez reçu un nouveau message de ${data.sender_name || "un utilisateur"}.</p>
              <div class="message">
                <p>${data.message_content || ""}</p>
              </div>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/messages" class="button">Répondre</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Nouveau message de ${data.sender_name || "Utilisateur"}\n\n${data.message_content || ""}`;
      return { subject, html, text };
    }

    case "review_received": {
      const subject = `Nouvel avis reçu - ${data.vehicle_name || "Véhicule"}`;
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Nouvel avis reçu</h1></div>
            <div class="content">
              <p>Bonjour ${data.owner_name || "Propriétaire"},</p>
              <p>${data.reviewer_name || "Un utilisateur"} a laissé un avis ${data.rating || 0}/5 pour votre véhicule ${data.vehicle_name || ""}.</p>
              ${data.comment ? `<p><strong>Commentaire :</strong> "${data.comment}"</p>` : ""}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Nouvel avis reçu\n\nVous avez reçu un avis ${data.rating || 0}/5 pour ${data.vehicle_name || "votre véhicule"}.`;
      return { subject, html, text };
    }

    case "tenant_verification_approved": {
      const subject = "Vérification locataire approuvée";
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>✅ Vérification approuvée</h1></div>
            <div class="content">
              <p>Bonjour ${data.first_name || "Utilisateur"},</p>
              <p>Félicitations ! Votre compte locataire a été vérifié et approuvé.</p>
              <p>Vous pouvez maintenant réserver des véhicules sur notre plateforme.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/search" class="button">Rechercher des véhicules</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Vérification approuvée\n\nVotre compte locataire a été vérifié. Vous pouvez maintenant réserver des véhicules.`;
      return { subject, html, text };
    }

    case "host_verification_approved": {
      const subject = "Vérification propriétaire approuvée";
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>✅ Vérification approuvée</h1></div>
            <div class="content">
              <p>Bonjour ${data.first_name || "Utilisateur"},</p>
              <p>Félicitations ! Votre compte propriétaire a été vérifié et approuvé.</p>
              <p>Vous pouvez maintenant mettre en location vos véhicules sur notre plateforme.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/dashboard/owner/vehicles/new" class="button">Ajouter un véhicule</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Vérification approuvée\n\nVotre compte propriétaire a été vérifié. Vous pouvez maintenant mettre en location vos véhicules.`;
      return { subject, html, text };
    }

    case "password_reset": {
      const subject = "Réinitialisation de votre mot de passe";
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          .warning { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Réinitialisation de mot de passe</h1></div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
              <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${data.reset_link || "#"}" class="button">Réinitialiser le mot de passe</a>
              </p>
              <div class="warning">
                <p><strong>⚠️ Important :</strong> Ce lien est valable pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = `Réinitialisation de mot de passe\n\nCliquez sur ce lien : ${data.reset_link || "#"}`;
      return { subject, html, text };
    }

    default: {
      const subject = `Notification ${companyName}`;
      const html = `
        <html>
        <head><style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Notification</h1></div>
            <div class="content">
              <p>${data.message || "Vous avez reçu une nouvelle notification."}</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const text = data.message || "Vous avez reçu une nouvelle notification.";
      return { subject, html, text };
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const emailRequest: EmailRequest = await req.json();

    // Validate request
    if (!emailRequest.event_type || !emailRequest.recipient_email) {
      return new Response(
        JSON.stringify({ error: "event_type and recipient_email are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Generate email template
    const { subject, html, text } = generateEmailTemplate(
      emailRequest.event_type,
      emailRequest.data || {}
    );

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured, email not sent");
      // Log to database but don't send email
      await supabaseClient.from("email_logs").insert({
        recipient_email: emailRequest.recipient_email,
        email_type: emailRequest.event_type,
        status: "pending",
        error_message: "RESEND_API_KEY not configured",
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured",
          queued: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine sender email based on event type
    // Using Resend test domain for immediate testing (change to rakb.ma after domain verification)
    let fromEmail = "RAKB <onboarding@resend.dev>";
    if (emailRequest.event_type.includes("booking")) {
      fromEmail = "RAKB Réservations <onboarding@resend.dev>";
    } else if (emailRequest.event_type.includes("payment")) {
      fromEmail = "RAKB Paiements <onboarding@resend.dev>";
    } else if (emailRequest.event_type.includes("message")) {
      fromEmail = "RAKB Messages <onboarding@resend.dev>";
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: emailRequest.recipient_email,
        reply_to: emailRequest.event_type === "booking_created" 
          ? emailRequest.data?.renter_email || "onboarding@resend.dev"
          : "onboarding@resend.dev",
        subject,
        html,
        text,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      
      // Log error
      await supabaseClient.from("email_logs").insert({
        recipient_email: emailRequest.recipient_email,
        email_type: emailRequest.event_type,
        status: "error",
        error_message: JSON.stringify(emailResult),
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResult 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log success
    await supabaseClient.from("email_logs").insert({
      recipient_email: emailRequest.recipient_email,
      email_type: emailRequest.event_type,
      status: "sent",
      related_id: emailRequest.data?.booking_id || emailRequest.data?.user_id || null,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        email_id: emailResult.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-event-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

