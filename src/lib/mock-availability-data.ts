// Mock availability data storage in localStorage
import { delay } from './mock-data';

export interface BlockedDate {
  id: string;
  vehicle_id: string;
  date: string; // ISO date string
  reason?: 'maintenance' | 'manual' | 'other';
  note?: string;
  created_at: string;
}

const getMockBlockedDates = (vehicleId: string): BlockedDate[] => {
  const stored = localStorage.getItem(`mock-blocked-dates-${vehicleId}`);
  return stored ? JSON.parse(stored) : [];
};

const saveMockBlockedDates = (vehicleId: string, dates: BlockedDate[]) => {
  localStorage.setItem(`mock-blocked-dates-${vehicleId}`, JSON.stringify(dates));
};

export const mockAvailabilityApi = {
  /**
   * Récupère toutes les dates bloquées pour un véhicule
   */
  async getBlockedDates(vehicleId: string): Promise<BlockedDate[]> {
    await delay(200);
    return getMockBlockedDates(vehicleId);
  },

  /**
   * Bloque une ou plusieurs dates pour un véhicule
   */
  async blockDates(
    vehicleId: string,
    dates: string[],
    reason?: 'maintenance' | 'manual' | 'other',
    note?: string
  ): Promise<BlockedDate[]> {
    await delay(300);
    const existing = getMockBlockedDates(vehicleId);
    const newDates: BlockedDate[] = dates.map(date => ({
      id: `blocked-${vehicleId}-${date}-${Date.now()}`,
      vehicle_id: vehicleId,
      date,
      reason: reason || 'manual',
      note,
      created_at: new Date().toISOString()
    }));

    // Éviter les doublons
    const existingDateStrings = new Set(existing.map(d => d.date));
    const uniqueNewDates = newDates.filter(d => !existingDateStrings.has(d.date));

    const updated = [...existing, ...uniqueNewDates];
    saveMockBlockedDates(vehicleId, updated);
    return uniqueNewDates;
  },

  /**
   * Débloque une ou plusieurs dates pour un véhicule
   */
  async unblockDates(vehicleId: string, dateIds: string[]): Promise<void> {
    await delay(300);
    const existing = getMockBlockedDates(vehicleId);
    const updated = existing.filter(d => !dateIds.includes(d.id));
    saveMockBlockedDates(vehicleId, updated);
  },

  /**
   * Vérifie si une date est disponible (non bloquée et sans réservation)
   */
  async isDateAvailable(vehicleId: string, date: string): Promise<boolean> {
    await delay(100);
    const blocked = getMockBlockedDates(vehicleId);
    const isBlocked = blocked.some(d => d.date === date);
    // Note: La vérification des réservations serait faite côté backend avec les bookings
    // Ici on vérifie seulement les dates bloquées manuellement
    return !isBlocked;
  },

  /**
   * Récupère toutes les dates occupées (bloquées + réservations) pour un véhicule
   */
  async getUnavailableDates(vehicleId: string): Promise<{
    blocked: string[];
    booked: string[];
  }> {
    await delay(200);
    const blocked = getMockBlockedDates(vehicleId);
    
    // Récupérer les réservations depuis mock-booking-data
    // Pour l'instant, on retourne juste les dates bloquées
    // Dans un vrai système, on interrogerait aussi les bookings
    
    return {
      blocked: blocked.map(d => d.date),
      booked: [] // Sera rempli par l'intégration avec les bookings
    };
  }
};

