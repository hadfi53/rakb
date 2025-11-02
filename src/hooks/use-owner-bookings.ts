import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookingStatus } from '@/types';

export interface OwnerBooking {
  id: string;
  vehicleId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
  durationDays: number;
  checkInOutStatus: 'checked-in' | 'checked-out' | null;
  
  // Informations sur le véhicule
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    images: string[];
  };
  
  // Informations sur le locataire
  renter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
  };
}

export const useOwnerBookings = () => {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookings = async () => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('owner_id', user.id);

      if (vehiclesError) throw vehiclesError;
      if (!vehicles.length) {
        setBookings([]);
        return;
      }

      const vehicleIds = vehicles.map(v => v.id);
      
      const { data, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles(
            id,
            make,
            model,
            year,
            images
          ),
          renter:profiles!bookings_renter_id_fkey(
            id,
            first_name,
            last_name,
            email,
            avatar_url,
            phone
          )
        `)
        .in('vehicle_id', vehicleIds)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const formattedBookings: OwnerBooking[] = (data || []).map(booking => ({
        id: booking.id,
        vehicleId: booking.vehicle_id,
        renterId: booking.renter_id,
        ownerId: booking.owner_id,
        startDate: booking.start_date,
        endDate: booking.end_date,
        status: booking.status,
        totalAmount: booking.total_price,
        createdAt: booking.created_at,
        durationDays: booking.duration_days,
        checkInOutStatus: booking.check_in_out_status,
        vehicle: booking.vehicle,
        renter: booking.renter ? {
          id: booking.renter.id,
          firstName: booking.renter.first_name,
          lastName: booking.renter.last_name,
          email: booking.renter.email,
          avatarUrl: booking.renter.avatar_url,
          phone: booking.renter.phone
        } : undefined
      }));

      setBookings(formattedBookings);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching owner bookings:', error);
      setError(error);
      toast.error('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  return {
    bookings,
    isLoading,
    error,
    refetch: fetchBookings
  };
}; 