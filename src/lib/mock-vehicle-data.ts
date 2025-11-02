// Mock vehicle data storage in localStorage
import { delay } from './mock-data';
import { Vehicle, VehicleFormData, VehiclePublicationStatus } from '@/types/vehicle';
import { mockVehicles } from './mock-data';
import { v4 as uuidv4 } from 'uuid';

const getMockVehicles = (): Vehicle[] => {
  const stored = localStorage.getItem('mock-vehicles');
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with default mock vehicles
  // Note: owner_id "owner1", "owner2", etc. sont des IDs différents de "mock-user-id"
  // Pour permettre aux utilisateurs de tester, on peut créer des véhicules avec n'importe quel owner_id
  localStorage.setItem('mock-vehicles', JSON.stringify(mockVehicles));
  return [...mockVehicles];
};

const saveMockVehicles = (vehicles: Vehicle[]) => {
  localStorage.setItem('mock-vehicles', JSON.stringify(vehicles));
};

export const mockVehicleApi = {
  /**
   * Récupère tous les véhicules
   */
  async getVehicles(): Promise<Vehicle[]> {
    await delay(300);
    return getMockVehicles();
  },

  /**
   * Récupère un véhicule par ID
   */
  async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
    await delay(200);
    const vehicles = getMockVehicles();
    return vehicles.find(v => v.id === vehicleId) || null;
  },

  /**
   * Récupère les véhicules d'un propriétaire
   */
  async getOwnerVehicles(ownerId: string): Promise<Vehicle[]> {
    await delay(300);
    const vehicles = getMockVehicles();
    return vehicles.filter(v => v.owner_id === ownerId);
  },

  /**
   * Crée un nouveau véhicule
   */
  async createVehicle(ownerId: string, vehicleData: VehicleFormData & { publication_status?: VehiclePublicationStatus }): Promise<Vehicle> {
    await delay(500);
    const vehicles = getMockVehicles();
    const newVehicle: Vehicle = {
      id: uuidv4(),
      owner_id: ownerId,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      price_per_day: vehicleData.price_per_day,
      location: vehicleData.location,
      description: vehicleData.description,
      images: vehicleData.images || [],
      status: 'available',
      publication_status: vehicleData.publication_status || 'pending_review',
      fuel_type: vehicleData.fuel_type,
      luggage: vehicleData.luggage,
      mileage: vehicleData.mileage,
      color: vehicleData.color,
      transmission: vehicleData.transmission,
      seats: vehicleData.seats,
      features: vehicleData.features || [],
      category: vehicleData.category,
      latitude: vehicleData.latitude,
      longitude: vehicleData.longitude,
      is_premium: vehicleData.is_premium || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Aliases
      brand: vehicleData.make,
      price: vehicleData.price_per_day,
      name: `${vehicleData.make} ${vehicleData.model} ${vehicleData.year}`,
      image_url: vehicleData.images && vehicleData.images.length > 0 ? vehicleData.images[0] : undefined,
    };
    
    vehicles.push(newVehicle);
    saveMockVehicles(vehicles);
    return newVehicle;
  },

  /**
   * Met à jour un véhicule
   */
  async updateVehicle(vehicleId: string, updates: Partial<VehicleFormData> & { publication_status?: VehiclePublicationStatus }): Promise<Vehicle | null> {
    await delay(400);
    const vehicles = getMockVehicles();
    const index = vehicles.findIndex(v => v.id === vehicleId);
    
    if (index === -1) {
      throw new Error("Véhicule non trouvé");
    }

    const vehicle = vehicles[index];
    const updatedVehicle: Vehicle = {
      ...vehicle,
      ...(updates.make && { make: updates.make, brand: updates.make }),
      ...(updates.model && { model: updates.model }),
      ...(updates.year && { year: updates.year }),
      ...(updates.price_per_day && { price_per_day: updates.price_per_day, price: updates.price_per_day }),
      ...(updates.location && { location: updates.location }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.images && { images: updates.images, image_url: updates.images[0] }),
      ...(updates.fuel_type && { fuel_type: updates.fuel_type }),
      ...(updates.luggage !== undefined && { luggage: updates.luggage }),
      ...(updates.mileage !== undefined && { mileage: updates.mileage }),
      ...(updates.color && { color: updates.color }),
      ...(updates.transmission && { transmission: updates.transmission }),
      ...(updates.seats !== undefined && { seats: updates.seats }),
      ...(updates.features && { features: updates.features }),
      ...(updates.category && { category: updates.category }),
      ...(updates.latitude !== undefined && { latitude: updates.latitude }),
      ...(updates.longitude !== undefined && { longitude: updates.longitude }),
      ...(updates.is_premium !== undefined && { is_premium: updates.is_premium }),
      ...(updates.publication_status && { publication_status: updates.publication_status }),
      updated_at: new Date().toISOString(),
      // Rebuild aliases
      name: `${updates.make || vehicle.make} ${updates.model || vehicle.model} ${updates.year || vehicle.year}`,
    };

    vehicles[index] = updatedVehicle;
    saveMockVehicles(vehicles);
    return updatedVehicle;
  },

  /**
   * Supprime un véhicule
   */
  async deleteVehicle(vehicleId: string): Promise<void> {
    await delay(300);
    const vehicles = getMockVehicles();
    const filtered = vehicles.filter(v => v.id !== vehicleId);
    saveMockVehicles(filtered);
  },
};

