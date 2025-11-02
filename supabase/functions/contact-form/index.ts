// Supabase Edge Function pour gérer les soumissions du formulaire de contact
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuration manquante" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les données du formulaire
    const { name, email, subject, message }: ContactFormData = await req.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Tous les champs sont requis" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Adresse email invalide" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Enregistrer dans la base de données (table contact_submissions si elle existe, sinon utiliser email_queue)
    const adminEmail = Deno.env.get("CONTACT_EMAIL") || "admin@rakb.ma";
    
    // Créer le contenu HTML de l'email
    const emailContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          .field { margin: 15px 0; }
          .label { font-weight: bold; color: #4f46e5; }
          .value { margin-top: 5px; padding: 10px; background-color: white; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouveau message de contact</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Nom complet</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value">${email}</div>
            </div>
            <div class="field">
              <div class="label">Sujet</div>
              <div class="value">${subject}</div>
            </div>
            <div class="field">
              <div class="label">Message</div>
              <div class="value">${message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 RAKB. Tous droits réservés.</p>
            <p>Cet email a été envoyé depuis le formulaire de contact du site web.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email via Resend (si configuré)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "RAKB Contact <contact@rakb.ma>",
          to: adminEmail,
          reply_to: email,
          subject: `[RAKB Contact] ${subject}`,
          html: emailContent,
        }),
      });

      if (!emailResponse.ok) {
        const emailError = await emailResponse.json();
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        
        // Continuer quand même et enregistrer dans la base
      }
    }

    // Enregistrer dans email_queue pour traitement ultérieur
    const { error: queueError } = await supabaseClient
      .from("email_queue")
      .insert({
        recipient_email: adminEmail,
        subject: `[Contact] ${subject}`,
        html_content: emailContent,
        text_content: `Nom: ${name}\nEmail: ${email}\nSujet: ${subject}\n\nMessage:\n${message}`,
        related_type: "contact_form",
        status: resendApiKey ? "sent" : "pending",
      });

    if (queueError) {
      console.error("Erreur lors de l'enregistrement:", queueError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur dans la fonction contact-form:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur est survenue. Veuillez réessayer plus tard." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

