import { UserProfile } from './user';
import { Vehicle as VehicleType } from './vehicle';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

export interface BookingVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  images: string[];
  price_per_day: number;
  location: string;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface Booking {
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
  vehicle?: BookingVehicle;
  owner?: Profile;
}

export const BookingStatusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800'
};

export const BookingStatusLabels: Record<BookingStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  rejected: 'Refusée'
};

export type PaymentStatus = 
  | 'preauthorized' // Carte enregistrée, montant préautorisé
  | 'charged'       // Paiement effectué
  | 'refunded'      // Remboursé
  | 'failed'        // Échec du paiement
  | 'partial_refund'; // Remboursement partiel (dépôt)

export type InsuranceOption = 'basic' | 'standard' | 'premium';

export type CheckInOutStatus = 
  | 'not_started'
  | 'check_in_completed'
  | 'check_out_completed';

export type PhotoCategory = 
  | 'exterior'
  | 'interior'
  | 'odometer';

export interface CheckInOutPhoto {
  id: string;
  booking_id: string;
  category: PhotoCategory;
  url: string;
  taken_at: string;
  taken_by: 'owner' | 'renter';
  metadata?: {
    location?: string;
    device?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

// Type pour l'état des lieux d'un véhicule
export interface VehicleChecklist {
  // État général
  fuelLevel: number; // 0-100%
  odometerReading: number; // en km
  
  // État extérieur
  exterior: {
    body: boolean; // true = OK, false = problème
    paint: boolean;
    windows: boolean;
    lights: boolean;
    tires: boolean;
    // Autres éléments extérieurs
  };
  
  // État intérieur
  interior: {
    seats: boolean;
    dashboard: boolean;
    flooring: boolean;
    controls: boolean;
    // Autres éléments intérieurs
  };
  
  // État mécanique
  mechanical: {
    engine: boolean;
    transmission: boolean;
    brakes: boolean;
    steering: boolean;
    // Autres éléments mécaniques
  };
  
  // Accessoires
  accessories: {
    spareWheel: boolean;
    jackTools: boolean;
    firstAidKit: boolean;
    // Autres accessoires
  };
  
  // Documents
  documents: {
    registration: boolean;
    insurance: boolean;
    maintenanceRecords: boolean;
  };
  
  // Liste des dommages ou problèmes
  damages: DamageItem[];
  
  // Liste des objets manquants
  missing: string[];
  
  // Niveau de propreté (1 à 5)
  cleanlinessRating: number;
  
  // Commentaires généraux
  comments: string;
}

// Type pour un élément de dommage
export interface DamageItem {
  id: string;
  location: string; // ex: "Portière avant gauche"
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  photoUrls?: string[];
}

// Type pour les options de paiement
export interface PaymentOption {
  id: string;
  name: string;
  description: string;
  depositRequired: boolean;
  depositAmount: number;
  processingFee: number;
  isDefault: boolean;
}

export interface BookingRequest {
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  returnLocation: string;
  insuranceOption: InsuranceOption;
  paymentMethod?: string; // ID de la méthode de paiement
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  error?: string;
}

export interface BookingActionResponse {
  success: boolean;
  message?: string;
  error?: string;
} 