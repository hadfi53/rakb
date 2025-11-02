import { Vehicle } from './types';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingRequest, BookingResponse, BookingActionResponse } from '@/types/booking';
import * as vehiclesBackend from './backend/vehicles';
import * as bookingsBackend from './backend/bookings';

export const vehiclesApi = {
  async getVehicles() {
    const { vehicles, error } = await vehiclesBackend.getAvailableVehicles();
    if (error) {
      console.error('Error getting vehicles:', error);
      throw new Error(error.message || 'Failed to fetch vehicles');
    }
    return vehicles;
  },

  async searchVehicles(params: {
    location?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    transmission?: string;
    fuelType?: string;
    minSeats?: number;
    isPremium?: boolean;
  }) {
    if (import.meta.env.DEV) {
    console.log("Recherche de véhicules avec les paramètres:", params);
    }
    
    const { vehicles, error } = await vehiclesBackend.getAvailableVehicles(params);
    
    if (error) {
      if (import.meta.env.DEV) {
      console.error('Error searching vehicles:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }
      throw new Error(error.message || 'Failed to search vehicles');
    }
    
    if (import.meta.env.DEV) {
      console.log(`${vehicles.length} véhicules récupérés depuis Supabase`);
    }

    // Apply client-side filters that might not be supported by RPC
    let filtered = [...vehicles];
    
    if (params.transmission && params.transmission !== 'all') {
      filtered = filtered.filter(v => v.transmission === params.transmission);
    }
    
    if (params.fuelType && params.fuelType !== 'all') {
      filtered = filtered.filter(v => v.fuel_type === params.fuelType);
    }
    
    if (params.minSeats !== undefined) {
      filtered = filtered.filter(v => (v.seats || 0) >= params.minSeats!);
    }
    
    if (params.isPremium !== undefined) {
      filtered = filtered.filter(v => v.is_premium === params.isPremium);
    }
    
    if (import.meta.env.DEV) {
      console.log(`${filtered.length} véhicules après filtrage client-side`);
      if (filtered.length === 0 && vehicles.length > 0) {
        console.warn('⚠️ Des véhicules ont été récupérés mais filtrés par les filtres client-side');
      }
    }
    return filtered;
  },

  async getVehicle(id: string) {
    console.log("Tentative de récupération du véhicule avec l'ID:", id);

    const { vehicle, error } = await vehiclesBackend.getVehicleById(id);
    
    if (error || !vehicle) {
      console.error("Aucun véhicule trouvé avec l'ID:", id, error);
      throw new Error(error?.message || "Véhicule non trouvé");
    }

    console.log("Véhicule formaté:", vehicle);
    return vehicle;
  },

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'owner_id'>, ownerId: string) {
    const vehicleData = {
      make: vehicle.make || vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      price_per_day: vehicle.price_per_day || vehicle.price || 0,
      location: vehicle.location || '',
      description: vehicle.description,
      images: vehicle.images || [],
      fuel_type: vehicle.fuel_type || vehicle.fuel,
      transmission: vehicle.transmission,
      seats: vehicle.seats,
      luggage: vehicle.luggage,
      mileage: vehicle.mileage,
      color: vehicle.color,
      features: vehicle.features || [],
      category: vehicle.category,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      is_premium: vehicle.is_premium || vehicle.isPremium,
      publication_status: vehicle.publication_status || 'pending_review' as const,
    };

    const { vehicle: newVehicle, error } = await vehiclesBackend.createVehicle(ownerId, vehicleData);
    
    if (error || !newVehicle) {
      console.error("Erreur lors de la création du véhicule:", error);
      throw new Error(error?.message || "Impossible de créer le véhicule");
    }
    
    console.log("Véhicule créé avec succès:", newVehicle);
    return newVehicle;
  },

  async updateVehicle(id: string, vehicle: Partial<Vehicle>, ownerId: string) {
    const updateData: any = {};
    
    if (vehicle.make) updateData.make = vehicle.make;
    if (vehicle.brand) updateData.make = vehicle.brand;
    if (vehicle.model) updateData.model = vehicle.model;
    if (vehicle.year) updateData.year = vehicle.year;
    if (vehicle.price_per_day) updateData.price_per_day = vehicle.price_per_day;
    if (vehicle.price) updateData.price_per_day = vehicle.price;
    if (vehicle.location) updateData.location = vehicle.location;
    if (vehicle.description !== undefined) updateData.description = vehicle.description;
    if (vehicle.images) updateData.images = vehicle.images;
    if (vehicle.fuel_type) updateData.fuel_type = vehicle.fuel_type;
    if (vehicle.fuel) updateData.fuel_type = vehicle.fuel;
    if (vehicle.transmission) updateData.transmission = vehicle.transmission;
    if (vehicle.seats) updateData.seats = vehicle.seats;
    if (vehicle.luggage) updateData.luggage = vehicle.luggage;
    if (vehicle.mileage) updateData.mileage = vehicle.mileage;
    if (vehicle.color) updateData.color = vehicle.color;
    if (vehicle.features) updateData.features = vehicle.features;
    if (vehicle.category) updateData.category = vehicle.category;
    if (vehicle.latitude !== undefined) updateData.latitude = vehicle.latitude;
    if (vehicle.longitude !== undefined) updateData.longitude = vehicle.longitude;
    if (vehicle.is_premium !== undefined) updateData.is_premium = vehicle.is_premium;
    if (vehicle.isPremium !== undefined) updateData.is_premium = vehicle.isPremium;
    if (vehicle.publication_status) updateData.publication_status = vehicle.publication_status;

    const { vehicle: updatedVehicle, error } = await vehiclesBackend.updateVehicle(id, ownerId, updateData);
    
    if (error || !updatedVehicle) {
      console.error("Erreur lors de la mise à jour du véhicule:", error);
      throw new Error(error?.message || "Impossible de mettre à jour le véhicule");
    }
    
    return updatedVehicle;
  },

  async deleteVehicle(id: string, ownerId: string) {
    const { error } = await vehiclesBackend.deleteVehicle(id, ownerId);
    
    if (error) {
      console.error("Erreur lors de la suppression du véhicule:", error);
      throw new Error(error.message || "Impossible de supprimer le véhicule");
    }
  }
};

export const bookingsApi = {
  // Récupérer les réservations d'un locataire
  async getRenterBookings(renterId: string) {
    const { bookings, error } = await bookingsBackend.getRenterBookings(renterId);
    return { data: bookings, error };
  },

  // Créer une nouvelle réservation
  async createBooking(request: BookingRequest & {
    renterId: string;
    ownerId: string;
    basePrice: number;
    insuranceFee: number;
    serviceFee: number;
    totalPrice: number;
    depositAmount: number;
    durationDays: number;
  }): Promise<BookingResponse> {
    const { booking, error } = await bookingsBackend.createBooking(request);
    
    if (error || !booking) {
      return {
        success: false,
        error: error?.message || 'Failed to create booking'
      };
    }

    return {
      success: true,
      bookingId: booking.id
    };
  },

  // Annuler une réservation
  async cancelBooking(bookingId: string, userId: string): Promise<BookingActionResponse> {
    const { booking, error } = await bookingsBackend.cancelBooking(bookingId, userId);
    
    if (error || !booking) {
      return {
        success: false,
        error: error?.message || 'Failed to cancel booking'
      };
    }

    return {
      success: true,
      message: 'Réservation annulée avec succès'
    };
  },

  // Mettre à jour le statut d'une réservation
  async updateBookingStatus(bookingId: string, status: string, userId: string): Promise<BookingActionResponse> {
    const { booking, error } = await bookingsBackend.updateBookingStatus(
      bookingId,
      status as any,
      userId
    );
    
    if (error || !booking) {
      return {
        success: false,
        error: error?.message || 'Failed to update booking status'
      };
    }

    return {
      success: true,
      message: 'Statut mis à jour avec succès'
    };
  },

  // Get booking by ID
  async getBookingById(bookingId: string) {
    const { booking, error } = await bookingsBackend.getBookingById(bookingId);
    return { data: booking, error };
  },

  // Get owner bookings
  async getOwnerBookings(ownerId: string) {
    const { bookings, error } = await bookingsBackend.getOwnerBookings(ownerId);
    return { data: bookings, error };
  }
};
