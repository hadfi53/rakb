// Supabase Edge Function to capture and confirm Stripe payment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingData {
  car_id: string;
  user_id: string;
  host_id: string;
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location?: string;
  total_amount: number;
  caution_amount: number;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    let requestData: any;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", details: parseError instanceof Error ? parseError.message : "Unknown error" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { paymentIntentId, cardData, paymentMethodId, bookingData } = requestData;

    if (!paymentIntentId || !bookingData) {
      console.error("Missing required fields:", {
        hasPaymentIntentId: !!paymentIntentId,
        hasBookingData: !!bookingData,
        bookingDataKeys: bookingData ? Object.keys(bookingData) : null,
      });
      return new Response(
        JSON.stringify({ 
          error: "Missing payment intent ID or booking data",
          received: {
            hasPaymentIntentId: !!paymentIntentId,
            hasBookingData: !!bookingData,
            bookingDataKeys: bookingData ? Object.keys(bookingData) : null,
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Retrieve the payment intent
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    console.log("Payment Intent status:", paymentIntent.status);
    console.log("Payment Intent customer:", paymentIntent.customer);

    // If payment not already confirmed, confirm it
    // Priority: Use PaymentMethod ID (from Stripe Elements) if available, otherwise use cardData (legacy)
    if (paymentIntent.status !== "succeeded") {
      if (paymentMethodId) {
        // Payment was confirmed on frontend with Stripe Elements
        // Just verify the payment intent status
        try {
          paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          if (paymentIntent.status !== "succeeded") {
            // Payment was confirmed on frontend but status might not be updated yet
            // Wait a moment and check again
            await new Promise(resolve => setTimeout(resolve, 1000));
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          }

          if (paymentIntent.status !== "succeeded") {
            return new Response(
              JSON.stringify({
                error: "Payment not confirmed",
                status: paymentIntent.status,
                details: paymentIntent.last_payment_error?.message || "Payment could not be confirmed",
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
              }
            );
          }
        } catch (verifyError: any) {
          console.error("Error verifying payment:", verifyError);
          return new Response(
            JSON.stringify({
              error: "Failed to verify payment",
              details: verifyError.message || "Unknown error",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      } else if (cardData) {
        // Legacy: Create payment method from raw card data
      try {
        // For testing: Stripe requires "Enable access to raw card data APIs" in Dashboard
        // Settings → API → Payment Methods → Enable access to raw card data APIs
        // In production, use Stripe Elements instead
        
        // Create payment method from card data
        const paymentMethod = await stripe.paymentMethods.create({
          type: "card",
          card: {
            number: cardData.number,
            exp_month: cardData.exp_month,
            exp_year: cardData.exp_year,
            cvc: cardData.cvc,
          },
        });

        console.log("Payment method created:", paymentMethod.id);

        // Update payment intent with payment method
        paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
          payment_method: paymentMethod.id,
        });

        console.log("Payment Intent updated, status:", paymentIntent.status);

        // Confirm payment intent
        paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

        console.log("Payment Intent confirmed, status:", paymentIntent.status);

        if (paymentIntent.status !== "succeeded") {
          console.error("Payment not succeeded:", {
            status: paymentIntent.status,
            last_payment_error: paymentIntent.last_payment_error,
          });
          
          return new Response(
            JSON.stringify({
              error: "Payment not confirmed",
              status: paymentIntent.status,
              details: paymentIntent.last_payment_error?.message || "Payment could not be confirmed",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      } catch (confirmError: any) {
        console.error("Error confirming payment:", confirmError);
        
        // Provide helpful error message
        let errorMessage = "Failed to confirm payment";
        if (confirmError.message?.includes("raw card data") || confirmError.message?.includes("unsafe")) {
          errorMessage = "Stripe ne permet pas l'envoi direct des numéros de carte. Activez 'Enable access to raw card data APIs' dans Stripe Dashboard (Settings → API → Payment Methods) pour les tests, ou utilisez Stripe Elements en production.";
        } else if (confirmError.message) {
          errorMessage = confirmError.message;
        }
        
        return new Response(
          JSON.stringify({
            error: errorMessage,
            details: confirmError.message || "Unknown error",
            code: confirmError.code,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      } else {
        // No payment method or card data provided
        return new Response(
          JSON.stringify({
            error: "Payment not confirmed and no payment method provided",
            status: paymentIntent.status,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }

    // Check vehicle availability before creating booking
    let conflictingBookings: any[] | null = null;
    let checkError: any = null;
    
    // Try vehicle_id (standard schema)
    const availabilityCheck = await supabaseClient
      .from("bookings")
      .select("id")
      .eq("vehicle_id", bookingData.car_id)
      .in("status", ["pending", "confirmed", "active", "in_progress"])
      .lte("start_date", bookingData.end_date)
      .gte("end_date", bookingData.start_date);
    
    if (availabilityCheck.error) {
      // If vehicle_id doesn't work, try car_id (legacy)
      if (availabilityCheck.error.code === '42703' || availabilityCheck.error.message?.includes('column') || availabilityCheck.error.message?.includes('does not exist')) {
        const legacyCheck = await supabaseClient
          .from("bookings")
          .select("id")
          .eq("car_id", bookingData.car_id)
          .in("status", ["pending", "confirmed", "active", "in_progress"])
          .lte("start_date", bookingData.end_date)
          .gte("end_date", bookingData.start_date);
        
        if (legacyCheck.error) {
          checkError = legacyCheck.error;
        } else {
          conflictingBookings = legacyCheck.data;
        }
      } else {
        checkError = availabilityCheck.error;
      }
    } else {
      conflictingBookings = availabilityCheck.data;
    }

    if (checkError) {
      return new Response(
        JSON.stringify({ error: "Failed to check availability" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (conflictingBookings && conflictingBookings.length > 0) {
      // Refund the payment if vehicle is not available
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: "requested_by_customer",
        });
      } catch (refundError) {
        console.error("Failed to refund:", refundError);
      }

      return new Response(
        JSON.stringify({ error: "Vehicle is not available for the selected dates" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create booking in database
    // Parse dates - bookings table uses TIMESTAMPTZ
    // Handle both ISO string and date-only string formats
    let startDate: Date;
    let endDate: Date;
    
    if (typeof bookingData.start_date === 'string' && bookingData.start_date.includes('T')) {
      startDate = new Date(bookingData.start_date);
    } else if (typeof bookingData.start_date === 'string') {
      // If it's just a date string like "2026-04-03", add time
      startDate = new Date(bookingData.start_date + 'T00:00:00.000Z');
    } else {
      startDate = new Date(bookingData.start_date);
    }
    
    if (typeof bookingData.end_date === 'string' && bookingData.end_date.includes('T')) {
      endDate = new Date(bookingData.end_date);
    } else if (typeof bookingData.end_date === 'string') {
      // If it's just a date string like "2026-04-10", add time
      endDate = new Date(bookingData.end_date + 'T23:59:59.999Z');
    } else {
      endDate = new Date(bookingData.end_date);
    }
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid date format");
    }
    
    // Generate reference number (format: RAKB-XXXX)
    const referenceNumber = `RAKB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // CRITICAL: Ensure caution_amount is ALWAYS an integer (some schemas use INTEGER type)
    // Parse and round immediately, ensure it's a number type, not string
    let cautionAmountRaw = bookingData.caution_amount;
    if (typeof cautionAmountRaw === 'string') {
      cautionAmountRaw = parseFloat(cautionAmountRaw);
    }
    const cautionAmount = Math.round(Number(cautionAmountRaw) || 0);
    
    // Ensure total_amount is a number
    let totalAmountRaw = bookingData.total_amount;
    if (typeof totalAmountRaw === 'string') {
      totalAmountRaw = parseFloat(totalAmountRaw);
    }
    const totalAmount = Number(totalAmountRaw) || 0;
    
    // Log for debugging
    console.log("🔍 Data transformation:", {
      caution_amount_incoming: bookingData.caution_amount,
      caution_amount_type_incoming: typeof bookingData.caution_amount,
      caution_amount_final: cautionAmount,
      caution_amount_type_final: typeof cautionAmount,
      isInteger: Number.isInteger(cautionAmount),
      total_amount_incoming: bookingData.total_amount,
      total_amount_final: totalAmount,
    });
    
    console.log("Booking data received:", {
      caution_amount_original: bookingData.caution_amount,
      caution_amount_rounded: cautionAmount,
      total_amount: totalAmount,
      start_date_original: bookingData.start_date,
      start_date_iso: startDate.toISOString(),
      end_date_original: bookingData.end_date,
      end_date_iso: endDate.toISOString(),
    });
    
    // Try standard schema first (vehicle_id, renter_id, owner_id, total_price, return_location)
    // Some schemas require base_price, insurance_fee, service_fee separately
    // IMPORTANT: Ensure all numeric values are numbers, not strings
    let bookingPayload: any = {
      vehicle_id: bookingData.car_id,
      renter_id: bookingData.user_id,
      owner_id: bookingData.host_id,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      pickup_location: bookingData.pickup_location,
      return_location: bookingData.return_location || bookingData.pickup_location,
      total_price: totalAmount, // Ensure it's a number
      total_amount: totalAmount, // Some schemas use total_amount
      base_price: totalAmount, // If base_price is required, use total as base
      insurance_fee: 0,
      service_fee: 0,
      deposit_amount: cautionAmount, // Rounded to integer
      status: "pending", // Payment succeeded but waiting for owner confirmation
      payment_status: "completed",
      payment_id: paymentIntentId,
      payment_intent_id: paymentIntentId, // Some schemas use payment_intent_id
    };

    // Insert booking with standard schema
    // Use service role client which bypasses RLS
    let booking: any = null;
    let bookingError: any = null;
    
    console.log("Attempting to insert booking with payload:", JSON.stringify(bookingPayload, null, 2));
    
    const insertResult = await supabaseClient
      .from("bookings")
      .insert(bookingPayload)
      .select()
      .single();

    booking = insertResult.data;
    bookingError = insertResult.error;
    
    // If standard schema fails, try legacy schema (car_id, user_id, host_id, total_amount, dropoff_location)
    if (bookingError && (bookingError.code === '42703' || bookingError.message?.includes('column') || bookingError.message?.includes('does not exist'))) {
      console.log("Standard schema failed, trying legacy schema...");
      console.log("Error was:", bookingError.message);
      
      // Use pre-calculated rounded values - IMPORTANT: Remove any fields that don't exist
      // Also ensure dates are ISO strings, not date-only strings
      bookingPayload = {
        car_id: bookingData.car_id,
        user_id: bookingData.user_id,
        host_id: bookingData.host_id,
        start_date: startDate.toISOString(), // Use ISO string for TIMESTAMPTZ
        end_date: endDate.toISOString(), // Use ISO string for TIMESTAMPTZ
        pickup_location: bookingData.pickup_location,
        dropoff_location: bookingData.return_location || bookingData.pickup_location,
        total_amount: totalAmount, // Already converted to number
        caution_amount: cautionAmount, // Already rounded to integer - MUST be integer
        status: "pending", // Payment succeeded but waiting for owner confirmation
        payment_status: "completed",
        reference_number: referenceNumber,
        payment_intent_id: paymentIntentId,
      };
      
      // Verify the value is actually an integer before sending
      if (!Number.isInteger(bookingPayload.caution_amount)) {
        console.error("ERROR: caution_amount is not an integer!", bookingPayload.caution_amount);
        bookingPayload.caution_amount = Math.round(Number(bookingPayload.caution_amount));
        console.error("Corrected to:", bookingPayload.caution_amount);
      }
      
      console.log("Legacy schema payload - caution_amount type and value:", {
        type: typeof bookingPayload.caution_amount,
        value: bookingPayload.caution_amount,
        isInteger: Number.isInteger(bookingPayload.caution_amount)
      });
      
      console.log("Attempting legacy schema with payload:", JSON.stringify(bookingPayload, null, 2));
      
      const legacyInsertResult = await supabaseClient
        .from("bookings")
        .insert(bookingPayload)
        .select()
        .single();
      
      booking = legacyInsertResult.data;
      bookingError = legacyInsertResult.error;
    }
    
    // If there's still an error, try using raw SQL as last resort
    if (bookingError) {
      console.error("=== BOOKING INSERTION ERROR ===");
      console.error("Error message:", bookingError.message);
      console.error("Error code:", bookingError.code);
      console.error("Error details:", bookingError.details);
      console.error("Error hint:", bookingError.hint);
      
      // Try minimal payload to identify missing required fields
      console.log("Attempting with minimal required fields...");
      try {
        const minimalPayload: any = {
          vehicle_id: bookingPayload.vehicle_id || bookingPayload.car_id,
          renter_id: bookingPayload.renter_id || bookingPayload.user_id,
          owner_id: bookingPayload.owner_id || bookingPayload.host_id,
          start_date: bookingPayload.start_date,
          end_date: bookingPayload.end_date,
          pickup_location: bookingPayload.pickup_location,
        };
        
        // Add return_location if it exists in either form
        if (bookingPayload.return_location) {
          minimalPayload.return_location = bookingPayload.return_location;
        } else if (bookingPayload.dropoff_location) {
          minimalPayload.dropoff_location = bookingPayload.dropoff_location;
        } else {
          minimalPayload.return_location = bookingPayload.pickup_location;
        }
        
        // Add price field (try both)
        if (bookingPayload.total_price) {
          minimalPayload.total_price = bookingPayload.total_price;
        } else if (bookingPayload.total_amount) {
          minimalPayload.total_amount = bookingPayload.total_amount;
        }
        
        const minimalResult = await supabaseClient
          .from("bookings")
          .insert(minimalPayload)
          .select()
          .single();
        
        if (minimalResult.data && !minimalResult.error) {
          booking = minimalResult.data;
          bookingError = null;
          console.log("✅ Booking created with minimal payload:", booking?.id);
          
          // Update with additional fields if needed
          if (bookingPayload.status || bookingPayload.payment_status) {
            await supabaseClient
              .from("bookings")
              .update({
                status: bookingPayload.status || "confirmed",
                payment_status: bookingPayload.payment_status || "completed",
                payment_id: bookingPayload.payment_id,
                payment_intent_id: bookingPayload.payment_intent_id,
              })
              .eq("id", booking.id);
          }
        } else {
          console.error("Minimal payload also failed:", minimalResult.error?.message);
        }
      } catch (minimalError: any) {
        console.error("Minimal payload attempt failed:", minimalError.message);
      }
      
      if (bookingError) {
        console.error("Full error object:", JSON.stringify(bookingError, null, 2));
        console.error("Attempted payload:", JSON.stringify(bookingPayload, null, 2));
        console.error("Payment Intent ID:", paymentIntentId);
        console.error("Payment Intent Status:", paymentIntent.status);
        console.error("=== END ERROR LOG ===");
      }
    } else {
      console.log("✅ Booking created successfully:", booking?.id);
    }

    if (bookingError) {
      console.error("❌ Booking creation failed - refunding payment");
      
      // Only refund if payment actually succeeded
      if (paymentIntent.status === "succeeded") {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: "requested_by_customer",
          });
          console.log("✅ Refund created:", refund.id);
        } catch (refundError: any) {
          console.error("❌ Failed to create refund:", refundError.message);
          // Don't fail the response if refund fails - payment still succeeded
        }
      }

      // Return detailed error for debugging
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create booking",
          details: bookingError.message,
          code: bookingError.code,
          hint: bookingError.hint,
          errorDetails: bookingError.details,
          // Include the attempted payload for debugging (remove sensitive data in production)
          attemptedSchema: bookingPayload.vehicle_id ? "standard" : "legacy",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Create payment record
    try {
      // Try with provider_payment_id first (new schema)
      const paymentInsert = {
        booking_id: booking.id,
        user_id: bookingData.user_id,
        amount: Math.round(bookingData.total_amount * 100), // Convert to cents
        currency: "MAD",
        status: "completed" as const,
        provider_payment_id: paymentIntentId,
        provider_payment_data: {
          stripe_payment_intent_id: paymentIntentId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
      };

      const { data: paymentData, error: paymentError } = await supabaseClient
        .from("payments")
        .insert(paymentInsert)
        .select()
        .single();

      if (paymentError) {
        // If that fails, try with provider/provider_ref (old schema)
        console.log("Failed with provider_payment_id, trying provider/provider_ref:", paymentError.message);
        const { error: legacyError } = await supabaseClient
          .from("payments")
          .insert({
            booking_id: booking.id,
            user_id: bookingData.user_id,
            amount: Math.round(bookingData.total_amount * 100),
            currency: "MAD",
            status: "completed",
            provider: "stripe",
            provider_ref: paymentIntentId,
          });

        if (legacyError) {
          console.error("Failed to create payment record with both schemas:", legacyError);
        } else {
          console.log("✅ Payment record created with legacy schema");
        }
      } else {
        console.log("✅ Payment record created:", paymentData?.id);
      }
    } catch (paymentRecordError: any) {
      // Payment succeeded and booking created, so this is non-critical
      console.error("Failed to create payment record:", paymentRecordError?.message || paymentRecordError);
    }

    // Create notifications
    try {
      await Promise.all([
        supabaseClient.from("notifications").insert({
          user_id: bookingData.host_id,
          type: "booking_request",
          title: "Nouvelle réservation confirmée",
          message: `Une nouvelle réservation confirmée pour votre véhicule`,
          related_id: booking.id,
          is_read: false,
        }),
        supabaseClient.from("notifications").insert({
          user_id: bookingData.user_id,
          type: "booking_created",
          title: "Réservation confirmée",
          message: `Votre réservation a été confirmée et le paiement a été effectué`,
          related_id: booking.id,
          is_read: false,
        }),
      ]);
    } catch (notifError) {
      // Non-critical, continue
      console.error("Failed to create notifications:", notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: booking,
        paymentIntentId: paymentIntentId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error capturing payment:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to capture payment",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

