// Mock booking data storage in localStorage
import { delay } from './mock-data';
import { Booking, BookingStatus } from '@/types/booking';
import { mockVehicles } from './mock-data';

// Mock user profiles for bookings
const mockRenter = {
  id: 'mock-user-id',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+212 6 12 34 56 78',
  avatar_url: undefined
};

const mockOwner = {
  id: 'owner1',
  first_name: 'Ahmed',
  last_name: 'Alami',
  email: 'ahmed.alami@example.com',
  phone: '+212 6 98 76 54 32',
  avatar_url: undefined
};

// Fonction pour récupérer un propriétaire mock par ID
const getMockOwner = (ownerId: string) => {
  // Si l'ID correspond au mockOwner par défaut
  if (ownerId === 'owner1' || ownerId === 'owner2') {
    return {
      ...mockOwner,
      id: ownerId,
      first_name: ownerId === 'owner1' ? 'Ahmed' : 'Fatima',
      last_name: ownerId === 'owner1' ? 'Alami' : 'Benali',
      email: ownerId === 'owner1' ? 'ahmed.alami@example.com' : 'fatima.benali@example.com'
    };
  }
  
  // Sinon, retourner un propriétaire générique
  return {
    id: ownerId,
    first_name: 'Propriétaire',
    last_name: 'Test',
    email: `owner-${ownerId}@example.com`,
    phone: '+212 6 00 00 00 00',
    avatar_url: undefined
  };
};

// Fonction pour récupérer un locataire mock par ID
const getMockRenter = (renterId: string) => {
  // Si l'ID correspond au mockRenter par défaut
  if (renterId === 'mock-user-id' || renterId === 'mock-renter-1') {
    return {
      ...mockRenter,
      id: renterId,
      first_name: renterId === 'mock-user-id' ? 'John' : 'Marie',
      last_name: renterId === 'mock-user-id' ? 'Doe' : 'Dupont',
      email: renterId === 'mock-user-id' ? 'john.doe@example.com' : 'marie.dupont@example.com'
    };
  }
  
  // Sinon, retourner un locataire générique
  return {
    id: renterId,
    first_name: 'Locataire',
    last_name: 'Test',
    email: `renter-${renterId}@example.com`,
    phone: '+212 6 11 11 11 11',
    avatar_url: undefined
  };
};

export interface MockBooking {
  id: string;
  vehicle_id: string;
  renter_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price: number;
  pickup_location: string;
  created_at: string;
  updated_at: string;
}

const getMockBookings = (userId: string, role: 'renter' | 'owner'): MockBooking[] => {
  const key = role === 'renter' ? `mock-bookings-renter-${userId}` : `mock-bookings-owner-${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Créer quelques réservations d'exemple si aucune n'existe pour n'importe quel utilisateur
  if (role === 'renter') {
    const sampleBookings: MockBooking[] = [
      {
        id: `booking-${userId}-1`,
        vehicle_id: '1',
        renter_id: userId,
        owner_id: 'owner1',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        total_price: 2670,
        pickup_location: 'Casablanca Centre',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `booking-${userId}-2`,
        vehicle_id: '2',
        renter_id: userId,
        owner_id: 'owner2',
        start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'confirmed',
        total_price: 2850,
        pickup_location: 'Marrakech Guéliz',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem(key, JSON.stringify(sampleBookings));
    return sampleBookings;
  }
  
  if (role === 'owner') {
    // Pour les propriétaires, créer des réservations avec un locataire fictif
    const sampleBookings: MockBooking[] = [
      {
        id: `booking-${userId}-1`,
        vehicle_id: '1',
        renter_id: 'mock-renter-1',
        owner_id: userId,
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        total_price: 2670,
        pickup_location: 'Casablanca Centre',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(key, JSON.stringify(sampleBookings));
    return sampleBookings;
  }
  
  return [];
};

const saveMockBooking = (booking: MockBooking, userId: string, role: 'renter' | 'owner') => {
  const bookings = getMockBookings(userId, role);
  const index = bookings.findIndex(b => b.id === booking.id);
  if (index >= 0) {
    bookings[index] = booking;
  } else {
    bookings.push(booking);
  }
  const key = role === 'renter' ? `mock-bookings-renter-${userId}` : `mock-bookings-owner-${userId}`;
  localStorage.setItem(key, JSON.stringify(bookings));
};

export const mockBookingApi = {
  async getRenterBookings(userId: string): Promise<Booking[]> {
    await delay(300);
    const bookings = getMockBookings(userId, 'renter');
    
    return bookings.map(booking => {
      const vehicle = mockVehicles.find(v => v.id === booking.vehicle_id);
      const owner = getMockOwner(booking.owner_id);
      const renter = getMockRenter(booking.renter_id);
      return {
        id: booking.id,
        vehicle_id: booking.vehicle_id,
        renter_id: booking.renter_id,
        owner_id: booking.owner_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        status: booking.status,
        total_price: booking.total_price,
        pickup_location: booking.pickup_location || 'Non spécifié',
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        vehicle: vehicle,
        renter: renter,
        owner: owner,
        startDate: booking.start_date,
        endDate: booking.end_date,
        totalAmount: booking.total_price,
        durationDays: Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))
      } as Booking;
    });
  },

  async getOwnerBookings(userId: string): Promise<Booking[]> {
    await delay(300);
    const bookings = getMockBookings(userId, 'owner');
    
    return bookings.map(booking => {
      const vehicle = mockVehicles.find(v => v.id === booking.vehicle_id);
      const renter = getMockRenter(booking.renter_id);
      const owner = getMockOwner(booking.owner_id);
      return {
        id: booking.id,
        vehicle_id: booking.vehicle_id,
        renter_id: booking.renter_id,
        owner_id: booking.owner_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        status: booking.status,
        total_price: booking.total_price,
        pickup_location: booking.pickup_location || 'Non spécifié',
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        vehicle: vehicle,
        renter: renter,
        owner: owner,
        startDate: booking.start_date,
        endDate: booking.end_date,
        totalAmount: booking.total_price,
        durationDays: Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))
      } as Booking;
    });
  },

  async updateBookingStatus(bookingId: string, status: BookingStatus, userId: string, role: 'renter' | 'owner'): Promise<void> {
    await delay(300);
    const bookings = getMockBookings(userId, role);
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = status;
      booking.updated_at = new Date().toISOString();
      saveMockBooking(booking, userId, role);
    }
  },

  async createBooking(booking: Omit<MockBooking, 'id' | 'created_at' | 'updated_at'>): Promise<MockBooking> {
    await delay(500);
    const newBooking: MockBooking = {
      ...booking,
      id: `booking-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveMockBooking(newBooking, booking.renter_id, 'renter');
    saveMockBooking(newBooking, booking.owner_id, 'owner');
    return newBooking;
  },

  async getBookingById(bookingId: string): Promise<Booking | null> {
    await delay(300);
    
    // Chercher dans les bookings de tous les utilisateurs potentiels
    // On va chercher dans localStorage pour tous les bookings
    const allKeys = Object.keys(localStorage);
    const bookingKeys = allKeys.filter(key => key.startsWith('mock-bookings-'));
    
    for (const key of bookingKeys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const bookings: MockBooking[] = JSON.parse(stored);
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          const vehicle = mockVehicles.find(v => v.id === booking.vehicle_id);
          const renter = getMockRenter(booking.renter_id);
          const owner = getMockOwner(booking.owner_id);
          return {
            id: booking.id,
            vehicle_id: booking.vehicle_id,
            renter_id: booking.renter_id,
            owner_id: booking.owner_id,
            start_date: booking.start_date,
            end_date: booking.end_date,
            status: booking.status,
            total_price: booking.total_price,
            pickup_location: booking.pickup_location || 'Non spécifié',
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            vehicle: vehicle,
            renter: renter,
            owner: owner,
            startDate: booking.start_date,
            endDate: booking.end_date,
            totalAmount: booking.total_price,
            durationDays: Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))
          } as Booking;
        }
      }
    }
    
    return null;
  }
};

