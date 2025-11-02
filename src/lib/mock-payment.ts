// Mock payment processing (à remplacer par Stripe dans production)
import { delay } from './mock-data';
import { PaymentData } from '@/components/booking/PaymentSheet';

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  bookingId?: string;
  error?: string;
  message?: string;
}

/**
 * Simule le processus de paiement avec Stripe
 * Dans production, cela ferait appel à:
 * 1. Backend API pour créer PaymentIntent
 * 2. Stripe pour confirmer le paiement
 * 3. RPC create_booking_with_payment pour finaliser
 */
export const mockPaymentApi = {
  async processPayment(
    paymentData: PaymentData,
    bookingData: {
      vehicleId: string;
      renterId: string;
      ownerId: string;
      startDate: string;
      endDate: string;
      totalAmount: number;
      pickupLocation: string;
    }
  ): Promise<PaymentResult> {
    await delay(2000); // Simule le temps de traitement

    // Simuler une validation de carte
    const cardNumber = paymentData.cardNumber;
    if (cardNumber.endsWith('0000')) {
      return {
        success: false,
        error: 'CARD_DECLINED',
        message: 'Paiement refusé. Vérifiez les informations de votre carte ou utilisez une autre carte.'
      };
    }

    if (cardNumber.endsWith('0001')) {
      return {
        success: false,
        error: 'INSUFFICIENT_FUNDS',
        message: 'Solde insuffisant. Vérifiez le solde de votre compte.'
      };
    }

    // Simuler un succès
    const paymentIntentId = `pi_mock_${Date.now()}`;
    const bookingId = `booking_${Date.now()}`;

    // TODO: Dans production, appeler:
    // await supabase.rpc('create_booking_with_payment', {
    //   vehicle_id: bookingData.vehicleId,
    //   renter_id: bookingData.renterId,
    //   owner_id: bookingData.ownerId,
    //   start_date: bookingData.startDate,
    //   end_date: bookingData.endDate,
    //   total_price: bookingData.totalAmount,
    //   pickup_location: bookingData.pickupLocation,
    //   payment_intent_id: paymentIntentId,
    // });

    return {
      success: true,
      paymentIntentId,
      bookingId,
      message: 'Paiement effectué avec succès'
    };
  },

  async createPaymentIntent(amount: number): Promise<{ clientSecret: string }> {
    await delay(500);
    // Dans production, cela appellerait votre backend qui créerait un PaymentIntent Stripe
    return {
      clientSecret: `pi_mock_secret_${Date.now()}`
    };
  }
};

