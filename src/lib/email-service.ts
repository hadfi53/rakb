/**
 * Email Service - Helper functions to send emails via Edge Function
 * This service provides easy-to-use functions to trigger emails for all events
 */

import { supabase } from '@/lib/supabase';

export type EmailEventType =
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

export interface SendEmailOptions {
  event_type: EmailEventType;
  recipient_email: string;
  recipient_name?: string;
  data?: Record<string, any>;
}

/**
 * Send an email for a specific event
 * This calls the send-event-email Edge Function
 */
export const sendEventEmail = async (
  options: SendEmailOptions
): Promise<{ success: boolean; message?: string; error?: any }> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-event-email", {
      body: {
        event_type: options.event_type,
        recipient_email: options.recipient_email,
        recipient_name: options.recipient_name,
        data: options.data || {},
      },
    });

    if (error) {
      throw error;
    }

    return {
      success: data?.success || false,
      message: data?.message,
      error: data?.error,
    };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
};

/**
 * Convenience functions for common email events
 */

// User Registration
export const sendUserRegisteredEmail = async (
  email: string,
  firstName: string,
  userId: string
) => {
  return sendEventEmail({
    event_type: "user_registered",
    recipient_email: email,
    recipient_name: firstName,
    data: {
      user_id: userId,
      first_name: firstName,
      email,
    },
  });
};

// Booking Created (to owner)
export const sendBookingCreatedEmail = async (
  ownerEmail: string,
  ownerName: string,
  bookingData: {
    booking_id: string;
    vehicle_name: string;
    renter_name: string;
    renter_email: string;
    renter_phone?: string;
    start_date: string;
    end_date: string;
    total_price: number;
    pickup_location?: string;
    return_location?: string;
  }
) => {
  return sendEventEmail({
    event_type: "booking_created",
    recipient_email: ownerEmail,
    recipient_name: ownerName,
    data: bookingData,
  });
};

// Booking Confirmed (to renter)
export const sendBookingConfirmedEmail = async (
  renterEmail: string,
  renterName: string,
  bookingData: {
    booking_id: string;
    vehicle_name: string;
    start_date: string;
    end_date: string;
    total_price: number;
    pickup_location?: string;
    return_location?: string;
  }
) => {
  return sendEventEmail({
    event_type: "booking_confirmed",
    recipient_email: renterEmail,
    recipient_name: renterName,
    data: bookingData,
  });
};

// Booking Rejected (to renter)
export const sendBookingRejectedEmail = async (
  renterEmail: string,
  renterName: string,
  bookingData: {
    booking_id: string;
    vehicle_name: string;
    rejection_reason?: string;
  }
) => {
  return sendEventEmail({
    event_type: "booking_rejected",
    recipient_email: renterEmail,
    recipient_name: renterName,
    data: bookingData,
  });
};

// Booking Cancelled
export const sendBookingCancelledEmail = async (
  recipientEmail: string,
  recipientName: string,
  bookingData: {
    booking_id: string;
    vehicle_name: string;
    start_date: string;
    cancelled_by: "renter" | "owner";
    refund_amount?: number;
  }
) => {
  return sendEventEmail({
    event_type: "booking_cancelled",
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    data: bookingData,
  });
};

// Message Received
export const sendMessageReceivedEmail = async (
  recipientEmail: string,
  recipientName: string,
  messageData: {
    message_id: string;
    sender_name: string;
    message_content: string;
  }
) => {
  return sendEventEmail({
    event_type: "message_received",
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    data: messageData,
  });
};

// Review Received
export const sendReviewReceivedEmail = async (
  ownerEmail: string,
  ownerName: string,
  reviewData: {
    review_id: string;
    vehicle_name: string;
    reviewer_name: string;
    rating: number;
    comment?: string;
  }
) => {
  return sendEventEmail({
    event_type: "review_received",
    recipient_email: ownerEmail,
    recipient_name: ownerName,
    data: reviewData,
  });
};

// Tenant Verification Approved
export const sendTenantVerificationApprovedEmail = async (
  email: string,
  firstName: string,
  userId: string
) => {
  return sendEventEmail({
    event_type: "tenant_verification_approved",
    recipient_email: email,
    recipient_name: firstName,
    data: {
      user_id: userId,
      first_name: firstName,
    },
  });
};

// Host Verification Approved
export const sendHostVerificationApprovedEmail = async (
  email: string,
  firstName: string,
  userId: string
) => {
  return sendEventEmail({
    event_type: "host_verification_approved",
    recipient_email: email,
    recipient_name: firstName,
    data: {
      user_id: userId,
      first_name: firstName,
    },
  });
};

// Payment Received
export const sendPaymentReceivedEmail = async (
  userEmail: string,
  userName: string,
  paymentData: {
    payment_id: string;
    amount: number;
    booking_id?: string;
  }
) => {
  return sendEventEmail({
    event_type: "payment_received",
    recipient_email: userEmail,
    recipient_name: userName,
    data: paymentData,
  });
};

