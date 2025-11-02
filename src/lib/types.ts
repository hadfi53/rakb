export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'unavailable';
export type VehicleTransmission = 'automatic' | 'manual' | 'semi-automatic';
export type VehicleFuelType = 'diesel' | 'essence' | 'hybrid' | 'electric';
export type VehicleCategory = 'SUV' | 'Berline' | 'Sportive' | 'Luxe' | 'Électrique' | 'Familiale';

export type Vehicle = {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  location: string;
  description?: string;
  images: string[];
  status: VehicleStatus;
  fuel_type?: VehicleFuelType;
  luggage?: number;
  mileage?: number;
  color?: string;
  transmission?: VehicleTransmission;
  seats?: number;
  features?: string[];
  category?: VehicleCategory;
  latitude?: number;
  longitude?: number;
  is_premium?: boolean;
  created_at: string;
  updated_at: string;
  rating?: number;
  reviews_count?: number;
  
  // Propriétés pour la compatibilité
  brand?: string; // Alias pour make
  price?: number; // Alias pour price_per_day
  name?: string;  // Généralement make + model + year
  image_url?: string; // Premier élément de images
  fuel?: VehicleFuelType; // Alias pour fuel_type
  isPremium?: boolean; // Alias pour is_premium
};
