// Mock check-in/check-out data storage in localStorage
import { delay } from './mock-data';
import { v4 as uuidv4 } from 'uuid';
import { VehicleChecklist, DamageItem, CheckInOutPhoto } from '@/types/booking';

export interface MockCheckInOut {
  id: string;
  booking_id: string;
  type: 'check-in' | 'check-out';
  completed_by: string; // user_id
  completed_at: string;
  photos: CheckInOutPhoto[];
  checklist: VehicleChecklist;
  signature?: string; // URL de l'image de signature
  notes?: string;
  mileage?: number;
  fuel_level?: number; // 0-100
}

const getMockCheckInOuts = (bookingId: string): MockCheckInOut[] => {
  const stored = localStorage.getItem(`mock-checkinout-${bookingId}`);
  return stored ? JSON.parse(stored) : [];
};

const saveMockCheckInOut = (checkInOut: MockCheckInOut) => {
  const all = getMockCheckInOuts(checkInOut.booking_id);
  const index = all.findIndex(c => c.id === checkInOut.id);
  if (index >= 0) {
    all[index] = checkInOut;
  } else {
    all.push(checkInOut);
  }
  localStorage.setItem(`mock-checkinout-${checkInOut.booking_id}`, JSON.stringify(all));
};

export const mockCheckInOutApi = {
  /**
   * Récupère le check-in d'une réservation
   */
  async getCheckIn(bookingId: string): Promise<MockCheckInOut | null> {
    await delay(200);
    const all = getMockCheckInOuts(bookingId);
    return all.find(c => c.type === 'check-in') || null;
  },

  /**
   * Récupère le check-out d'une réservation
   */
  async getCheckOut(bookingId: string): Promise<MockCheckInOut | null> {
    await delay(200);
    const all = getMockCheckInOuts(bookingId);
    return all.find(c => c.type === 'check-out') || null;
  },

  /**
   * Soumet un check-in
   */
  async submitCheckIn(
    bookingId: string,
    userId: string,
    checklist: VehicleChecklist,
    photos: CheckInOutPhoto[],
    signature?: string,
    notes?: string
  ): Promise<MockCheckInOut> {
    await delay(500);
    
    const checkIn: MockCheckInOut = {
      id: uuidv4(),
      booking_id: bookingId,
      type: 'check-in',
      completed_by: userId,
      completed_at: new Date().toISOString(),
      photos,
      checklist,
      signature,
      notes,
      mileage: checklist.odometerReading,
      fuel_level: checklist.fuelLevel,
    };
    
    saveMockCheckInOut(checkIn);
    
    // Mettre à jour le statut de la réservation
    const { mockBookingApi } = await import('@/lib/mock-booking-data');
    await mockBookingApi.updateBookingStatus(bookingId, 'in_progress', userId, 'owner');
    
    return checkIn;
  },

  /**
   * Soumet un check-out
   */
  async submitCheckOut(
    bookingId: string,
    userId: string,
    checklist: VehicleChecklist,
    photos: CheckInOutPhoto[],
    signature?: string,
    notes?: string
  ): Promise<MockCheckInOut> {
    await delay(500);
    
    // Récupérer le check-in pour comparaison
    const checkIn = await this.getCheckIn(bookingId);
    
    const checkOut: MockCheckInOut = {
      id: uuidv4(),
      booking_id: bookingId,
      type: 'check-out',
      completed_by: userId,
      completed_at: new Date().toISOString(),
      photos,
      checklist,
      signature,
      notes,
      mileage: checklist.odometerReading,
      fuel_level: checklist.fuelLevel,
    };
    
    saveMockCheckInOut(checkOut);
    
    // Mettre à jour le statut de la réservation
    const { mockBookingApi } = await import('@/lib/mock-booking-data');
    await mockBookingApi.updateBookingStatus(bookingId, 'completed', userId, 'renter');
    
    return checkOut;
  },

  /**
   * Compare check-in et check-out pour détecter les différences
   */
  async compareCheckInOut(bookingId: string): Promise<{
    mileageDifference: number;
    fuelDifference: number;
    damages: DamageItem[];
    missingItems: string[];
    cleanlinessChange: number;
  }> {
    await delay(200);
    const checkIn = await this.getCheckIn(bookingId);
    const checkOut = await this.getCheckOut(bookingId);
    
    if (!checkIn || !checkOut) {
      return {
        mileageDifference: 0,
        fuelDifference: 0,
        damages: [],
        missingItems: [],
        cleanlinessChange: 0,
      };
    }
    
    const mileageDifference = (checkOut.checklist.odometerReading || 0) - (checkIn.checklist.odometerReading || 0);
    const fuelDifference = (checkOut.checklist.fuelLevel || 0) - (checkIn.checklist.fuelLevel || 0);
    const damages = checkOut.checklist.damages || [];
    const missingItems = checkOut.checklist.missing || [];
    const cleanlinessChange = (checkOut.checklist.cleanlinessRating || 0) - (checkIn.checklist.cleanlinessRating || 0);
    
    return {
      mileageDifference,
      fuelDifference,
      damages,
      missingItems,
      cleanlinessChange,
    };
  },
};

