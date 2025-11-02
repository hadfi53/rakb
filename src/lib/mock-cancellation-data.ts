// Mock cancellation data storage in localStorage
import { delay } from './mock-data';
import { v4 as uuidv4 } from 'uuid';
import { mockBookingApi } from './mock-booking-data';

export interface CancellationPolicy {
  id: string;
  name: string;
  description: string;
  rules: Array<{
    days_before: number;
    refund_percentage: number;
    fee_percentage: number;
  }>;
}

export interface Cancellation {
  id: string;
  booking_id: string;
  owner_id: string;
  renter_id: string;
  cancelled_by: 'owner' | 'renter';
  cancellation_date: string;
  reason: string;
  refund_amount: number;
  fee_amount: number;
  policy_applied: string;
  status: 'processing' | 'completed' | 'disputed';
}

export interface CancellationCalculation {
  cancellation_date: string;
  booking_start_date: string;
  booking_total_amount: number;
  days_before: number;
  refund_percentage: number;
  fee_percentage: number;
  refund_amount: number;
  fee_amount: number;
  net_refund: number;
}

const defaultCancellationPolicy: CancellationPolicy = {
  id: 'default',
  name: 'Politique Standard',
  description: 'Politique d\'annulation standard pour toutes les réservations',
  rules: [
    { days_before: 7, refund_percentage: 100, fee_percentage: 0 },
    { days_before: 3, refund_percentage: 50, fee_percentage: 50 },
    { days_before: 1, refund_percentage: 0, fee_percentage: 100 },
    { days_before: 0, refund_percentage: 0, fee_percentage: 100 }
  ]
};

const getMockCancellations = (userId: string, role: 'owner' | 'renter'): Cancellation[] => {
  const key = role === 'owner' ? `mock-cancellations-owner-${userId}` : `mock-cancellations-renter-${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

const saveMockCancellation = (userId: string, role: 'owner' | 'renter', cancellation: Cancellation) => {
  const key = role === 'owner' ? `mock-cancellations-owner-${userId}` : `mock-cancellations-renter-${userId}`;
  const cancellations = getMockCancellations(userId, role);
  cancellations.push(cancellation);
  localStorage.setItem(key, JSON.stringify(cancellations));
};

export const mockCancellationApi = {
  async getCancellationPolicy(): Promise<CancellationPolicy> {
    await delay(200);
    return defaultCancellationPolicy;
  },

  async calculateCancellation(bookingId: string): Promise<CancellationCalculation> {
    await delay(300);
    const booking = await mockBookingApi.getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    const cancellationDate = new Date();
    const bookingStartDate = new Date(booking.start_date);
    const daysBefore = Math.ceil((bookingStartDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const policy = defaultCancellationPolicy;
    let refundPercentage = 0;
    let feePercentage = 100;
    
    for (const rule of policy.rules) {
      if (daysBefore >= rule.days_before) {
        refundPercentage = rule.refund_percentage;
        feePercentage = rule.fee_percentage;
        break;
      }
    }
    
    const totalAmount = booking.total_price || booking.totalAmount || 0;
    const refundAmount = (totalAmount * refundPercentage) / 100;
    const feeAmount = (totalAmount * feePercentage) / 100;
    const netRefund = refundAmount;
    
    return {
      cancellation_date: cancellationDate.toISOString(),
      booking_start_date: booking.start_date,
      booking_total_amount: totalAmount,
      days_before: Math.max(0, daysBefore),
      refund_percentage: refundPercentage,
      fee_percentage: feePercentage,
      refund_amount: refundAmount,
      fee_amount: feeAmount,
      net_refund: netRefund
    };
  },

  async cancelBooking(
    bookingId: string,
    userId: string,
    role: 'owner' | 'renter',
    reason: string
  ): Promise<Cancellation> {
    await delay(500);
    const booking = await mockBookingApi.getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    const calculation = await this.calculateCancellation(bookingId);
    
    const cancellation: Cancellation = {
      id: uuidv4(),
      booking_id: bookingId,
      owner_id: booking.owner_id,
      renter_id: booking.renter_id,
      cancelled_by: role,
      cancellation_date: calculation.cancellation_date,
      reason,
      refund_amount: calculation.refund_amount,
      fee_amount: calculation.fee_amount,
      policy_applied: defaultCancellationPolicy.id,
      status: 'processing'
    };
    
    saveMockCancellation(userId, role, cancellation);
    
    // Update booking status
    await mockBookingApi.updateBookingStatus(bookingId, 'cancelled', userId, role);
    
    // Simulate refund processing
    if (calculation.refund_amount > 0) {
      setTimeout(async () => {
        cancellation.status = 'completed';
        const key = role === 'owner' ? `mock-cancellations-owner-${userId}` : `mock-cancellations-renter-${userId}`;
        const cancellations = getMockCancellations(userId, role);
        const index = cancellations.findIndex(c => c.id === cancellation.id);
        if (index >= 0) {
          cancellations[index] = cancellation;
          localStorage.setItem(key, JSON.stringify(cancellations));
        }
      }, 2000);
    }
    
    return cancellation;
  },

  async getCancellations(userId: string, role: 'owner' | 'renter'): Promise<Cancellation[]> {
    await delay(300);
    return getMockCancellations(userId, role);
  },

  async getCancellationById(cancellationId: string, userId: string, role: 'owner' | 'renter'): Promise<Cancellation | null> {
    await delay(200);
    const cancellations = getMockCancellations(userId, role);
    return cancellations.find(c => c.id === cancellationId) || null;
  }
};

