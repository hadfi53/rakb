import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookingStatus } from '@/types/booking';

export interface RenterBooking {
  id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price: number;
  base_price: number;
  service_fee: number;
  pickup_location: string;
  return_location: string;
  duration_days: number;
  created_at: string;
  
  // Vehicle details
  vehicle?: {
    make: string;
    model: string;
    year: number;
    images: string[];
    owner_id: string;
  };
  
  // Owner details
  owner?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export const useRenterBookings = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Requête pour récupérer les réservations
  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['renterBookings', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles(
            id,
            make,
            model,
            year,
            images,
            owner_id
          ),
          profiles!inner(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RenterBooking[];
    },
    enabled: !!user
  });

  const refresh = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles(
            id,
            make,
            model,
            year,
            images,
            owner_id
          ),
          profiles!inner(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RenterBooking[];
    } catch (error) {
      console.error('Error refreshing bookings:', error);
      toast.error('Failed to refresh bookings');
      return [];
    }
  };

  return {
    bookings,
    isLoading,
    error,
    refresh
  };
}; 