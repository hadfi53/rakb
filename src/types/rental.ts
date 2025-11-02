export interface RentalHistoryItem {
  id: number;
  car: string;
  date: string;
  duration: string;
  price: number;
  rating: number;
  location: string;
}

export interface Reservation {
  id: number;
  car: string;
  startDate: string;
  endDate: string;
  status: string;
  price: number;
  location: string;
}

export interface Favorite {
  id: number;
  car: string;
  location: string;
  price: number;
  rating: number;
  disponible: boolean;
  vehicleId?: string;
} 