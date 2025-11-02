// Mock vehicle statistics data
import { delay } from './mock-data';
import { mockBookingApi } from './mock-booking-data';
import { BookingStatus } from '@/types/booking';

export interface VehicleStats {
  vehicle_id: string;
  total_bookings: number;
  total_revenue: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  completed_bookings: number;
  average_booking_duration: number; // in days
  occupancy_rate: number; // percentage (0-100)
  revenue_by_period: {
    period: string; // '2024-01', '2024-02', etc.
    revenue: number;
    bookings: number;
  }[];
  bookings_by_status: {
    status: BookingStatus;
    count: number;
  }[];
}

export interface VehicleStatsParams {
  vehicleId: string;
  startDate?: string;
  endDate?: string;
}

export const mockVehicleStatsApi = {
  /**
   * Calcule les statistiques complètes d'un véhicule
   */
  async getVehicleStats(params: VehicleStatsParams): Promise<VehicleStats> {
    await delay(400);
    const { vehicleId, startDate, endDate } = params;

    // Récupérer toutes les réservations pour ce véhicule
    // Note: On utilise mockBookingApi mais il faudrait une méthode getVehicleBookings
    // Pour l'instant, on simule des données
    
    // Simuler des statistiques réalistes
    const totalBookings = Math.floor(Math.random() * 30) + 5;
    const confirmedBookings = Math.floor(totalBookings * 0.7);
    const completedBookings = Math.floor(totalBookings * 0.6);
    const cancelledBookings = Math.floor(totalBookings * 0.1);
    const pendingBookings = totalBookings - confirmedBookings - cancelledBookings;
    
    const averagePricePerDay = 500; // Prix moyen simulé
    const averageDuration = 3; // jours
    const totalRevenue = completedBookings * averagePricePerDay * averageDuration;
    
    // Calculer le taux d'occupation (pourcentage de jours réservés)
    const daysInPeriod = endDate && startDate 
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 365; // Par défaut, dernière année
    
    const bookedDays = completedBookings * averageDuration;
    const occupancyRate = Math.min((bookedDays / daysInPeriod) * 100, 100);

    // Générer des revenus par période (mensuels)
    const revenueByPeriod: VehicleStats['revenue_by_period'] = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate);
      monthDate.setMonth(currentDate.getMonth() - i);
      const period = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      revenueByPeriod.push({
        period,
        revenue: Math.floor(Math.random() * 10000) + 2000,
        bookings: Math.floor(Math.random() * 5) + 1
      });
    }

    // Bookings par statut
    const bookingsByStatus: VehicleStats['bookings_by_status'] = [
      { status: 'pending', count: pendingBookings },
      { status: 'confirmed', count: confirmedBookings - completedBookings },
      { status: 'completed', count: completedBookings },
      { status: 'cancelled', count: cancelledBookings },
      { status: 'rejected', count: 0 }
    ].filter(b => b.count > 0);

    return {
      vehicle_id: vehicleId,
      total_bookings: totalBookings,
      total_revenue: totalRevenue,
      confirmed_bookings: confirmedBookings,
      cancelled_bookings: cancelledBookings,
      pending_bookings: pendingBookings,
      completed_bookings: completedBookings,
      average_booking_duration: averageDuration,
      occupancy_rate: Math.round(occupancyRate * 100) / 100,
      revenue_by_period: revenueByPeriod,
      bookings_by_status: bookingsByStatus
    };
  },

  /**
   * Récupère les réservations d'un véhicule pour les statistiques
   */
  async getVehicleBookings(vehicleId: string): Promise<any[]> {
    await delay(300);
    // Dans un vrai système, on filtrerait les bookings par vehicle_id
    // Pour l'instant, on retourne un tableau vide et les stats sont simulées
    return [];
  }
};

