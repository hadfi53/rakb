export interface CheckInOutPhoto {
  id: string;
  bookingId: string;
  url: string;
  type: 'check-in' | 'check-out';
  takenAt: string;
  metadata?: {
    location?: {
      latitude: number;
      longitude: number;
    };
  };
} 