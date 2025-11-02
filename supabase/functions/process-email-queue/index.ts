// Process Email Queue - Sends queued emails via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get pending emails from queue (limit 50 per run)
    const { data: queuedEmails, error: fetchError } = await supabaseClient
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No pending emails to process",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RESEND_API_KEY not configured" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let processed = 0;
    let failed = 0;

    // Process each email
    for (const email of queuedEmails) {
      try {
        // Update status to processing
        await supabaseClient
          .from("email_queue")
          .update({ status: "processing", updated_at: new Date().toISOString() })
          .eq("id", email.id);

        // Extract event type and data from metadata if available
        const metadata = email.metadata || {};
        const eventType = metadata.event_type || email.related_type || "notification";
        const recipientName = metadata.recipient_name || null;

        // Determine sender email
        let fromEmail = "RAKB <noreply@rakb.ma>";
        if (eventType.includes("booking")) {
          fromEmail = "RAKB Réservations <reservations@rakb.ma>";
        } else if (eventType.includes("payment")) {
          fromEmail = "RAKB Paiements <payments@rakb.ma>";
        } else if (eventType.includes("message")) {
          fromEmail = "RAKB Messages <messages@rakb.ma>";
        }

        // Send via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: email.recipient_email,
            subject: email.subject,
            html: email.html_content || email.text_content,
            text: email.text_content,
            reply_to: metadata.data?.renter_email || "contact@rakb.ma",
          }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
          throw new Error(JSON.stringify(emailResult));
        }

        // Update status to sent
        await supabaseClient
          .from("email_queue")
          .update({ 
            status: "sent", 
            updated_at: new Date().toISOString(),
            sent_at: new Date().toISOString()
          })
          .eq("id", email.id);

        // Log in email_logs
        await supabaseClient.from("email_logs").insert({
          recipient_email: email.recipient_email,
          email_type: eventType,
          related_id: email.related_id,
          status: "sent",
        });

        processed++;
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        
        // Update status to error
        await supabaseClient
          .from("email_queue")
          .update({ 
            status: "error", 
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq("id", email.id);

        // Log error in email_logs
        await supabaseClient.from("email_logs").insert({
          recipient_email: email.recipient_email,
          email_type: email.related_type || "unknown",
          related_id: email.related_id,
          status: "error",
          error_message: error.message,
        });

        failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed,
        failed,
        total: queuedEmails.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-email-queue:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

