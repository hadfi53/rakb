import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabase";
import type { PaymentData } from "@/components/booking/PaymentSheet";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Initialize Stripe with publishable key
 * Returns a Promise for use with Stripe Elements
 */
export const getStripe = (): Promise<Stripe | null> => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error("Stripe publishable key not found in environment variables");
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Create a Stripe Payment Intent via Edge Function
 */
export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResponse> => {
  const { data, error } = await supabase.functions.invoke("create-payment-intent", {
    body: {
      amount: params.amount,
      currency: params.currency || "mad",
      metadata: params.metadata || {},
      customerEmail: params.customerEmail,
      customerName: params.customerName,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to create payment intent");
  }

  if (!data || !data.clientSecret || !data.paymentIntentId) {
    throw new Error("Invalid response from payment intent creation");
  }

  return {
    clientSecret: data.clientSecret,
    paymentIntentId: data.paymentIntentId,
  };
};

/**
 * Confirm payment and create booking
 * Note: For production, we should use Stripe Elements to securely collect card data
 * This function sends card data to Edge Function which handles payment confirmation securely
 */
export const confirmPaymentAndCreateBooking = async (
  paymentIntentId: string,
  paymentData: PaymentData,
  bookingData: {
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
): Promise<{ success: boolean; booking?: any; error?: string }> => {
  try {
    // Extract card details
    const cardNumber = paymentData.cardNumber.replace(/\s/g, '');
    const [expMonth, expYear] = paymentData.expiryDate.split('/');
    const expYearFull = `20${expYear}`; // Convert YY to YYYY

    // Send to Edge Function which will create payment method and confirm
    if (import.meta.env.DEV) {
      console.log("Calling capture-payment with:", {
        paymentIntentId,
        bookingData: {
          car_id: bookingData.car_id,
          user_id: bookingData.user_id,
          host_id: bookingData.host_id,
          start_date: bookingData.start_date,
          end_date: bookingData.end_date,
          total_amount: bookingData.total_amount,
        },
      });
    }

    // Use direct fetch to get detailed error messages
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured");
    }

    const functionUrl = `${supabaseUrl}/functions/v1/capture-payment`;
    
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          paymentIntentId,
          cardData: {
            number: cardNumber,
            exp_month: parseInt(expMonth, 10),
            exp_year: parseInt(expYearFull, 10),
            cvc: paymentData.cvv,
          },
          bookingData,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = responseData?.error || responseData?.details || responseData?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        if (import.meta.env.DEV) {
          console.error("Edge Function error response:", {
            status: response.status,
            statusText: response.statusText,
            body: responseData,
          });
        }
        
        throw new Error(errorMessage);
      }

      if (!responseData) {
        throw new Error("No response from capture-payment function");
      }

      if (!responseData.success) {
        const errorMsg = responseData.error || responseData.details || "Payment capture failed";
        if (import.meta.env.DEV) {
          console.error("Payment capture failed:", responseData);
        }
        throw new Error(errorMsg);
      }

      return {
        success: true,
        booking: responseData.booking,
      };
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error confirming payment:", error);
      }
      throw error;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error confirming payment:", error);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment confirmation failed",
    };
  }
};

/**
 * Confirm payment with PaymentMethod ID and create booking
 * This is the secure way using Stripe Elements (PaymentMethod instead of raw card data)
 */
export const confirmPaymentWithMethodAndCreateBooking = async (
  paymentIntentId: string,
  paymentMethodId: string,
  bookingData: {
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
): Promise<{ success: boolean; booking?: any; error?: string }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured");
    }

    const functionUrl = `${supabaseUrl}/functions/v1/capture-payment`;

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        paymentIntentId,
        paymentMethodId, // Use PaymentMethod ID instead of raw card data
        bookingData,
      }),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        responseData?.error ||
        responseData?.details ||
        responseData?.message ||
        `HTTP ${response.status}: ${response.statusText}`;

      if (import.meta.env.DEV) {
        console.error("Edge Function error response:", {
          status: response.status,
          statusText: response.statusText,
          body: responseData,
        });
      }

      throw new Error(errorMessage);
    }

    if (!responseData) {
      throw new Error("No response from capture-payment function");
    }

    if (!responseData.success) {
      const errorMsg =
        responseData.error || responseData.details || "Payment capture failed";
      if (import.meta.env.DEV) {
        console.error("Payment capture failed:", responseData);
      }
      throw new Error(errorMsg);
    }

    return {
      success: true,
      booking: responseData.booking,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error confirming payment:", error);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment confirmation failed",
    };
  }
};

/**
 * Process payment with card details
 * This is a simplified version - in production, use Stripe Elements for security
 */
export const processPaymentWithCard = async (
  paymentData: PaymentData,
  amount: number,
  bookingData: {
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
  },
  userInfo?: {
    email?: string;
    name?: string;
    phone?: string;
  }
): Promise<{ success: boolean; booking?: any; paymentIntentId?: string; error?: string }> => {
  try {
    // Step 1: Create Payment Intent with customer info
    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      amount,
      currency: "mad",
      metadata: {
        booking_id: bookingData.car_id,
        user_id: bookingData.user_id,
        host_id: bookingData.host_id,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        total_amount: bookingData.total_amount.toString(),
      },
      customerEmail: userInfo?.email,
      customerName: userInfo?.name,
    });

    if (!clientSecret || !paymentIntentId) {
      throw new Error("Failed to create payment intent");
    }

    const stripe = await getStripe();

    if (!stripe) {
      throw new Error("Stripe not initialized");
    }

    // Step 2: Confirm the payment intent with card details
    // Note: In production, this should be done using Stripe Elements
    // For now, we'll use the capture-payment Edge Function which handles the confirmation
    // The Edge Function will verify the payment on the server side

    // Step 3: Capture payment and create booking
    const result = await confirmPaymentAndCreateBooking(
      paymentIntentId,
      paymentData,
      bookingData
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Payment failed",
        paymentIntentId,
      };
    }

    return {
      success: true,
      booking: result.booking,
      paymentIntentId,
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment processing failed",
    };
  }
};

