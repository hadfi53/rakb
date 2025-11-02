import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Booking, CheckInOutPhoto, CheckInOutStatus } from '@/types/booking';
import { addHours, isAfter, isBefore, parseISO } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { OwnerBooking } from './use-owner-bookings';

interface UseCheckInOutProps {
  booking: OwnerBooking;
  role: 'owner' | 'renter';
}

interface BookedPeriod {
  startDate: Date;
  endDate: Date;
}

interface CheckInOutState {
  canCheckIn: boolean;
  canCheckOut: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseCheckInOutReturn {
  canCheckIn: boolean;
  canCheckOut: boolean;
}

export function useCheckInOut({ booking, role }: UseCheckInOutProps): UseCheckInOutReturn {
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [canCheckOut, setCanCheckOut] = useState(false);

  useEffect(() => {
    const checkAvailability = () => {
      const now = new Date();
      const startDate = parseISO(booking.startDate);
      const endDate = parseISO(booking.endDate);

      // Check-in window: 1 hour before to 1 hour after start time
      const checkInStart = addHours(startDate, -1);
      const checkInEnd = addHours(startDate, 1);

      // Check-out window: 1 hour before to 2 hours after end time
      const checkOutStart = addHours(endDate, -1);
      const checkOutEnd = addHours(endDate, 2);

      if (role === 'owner') {
        setCanCheckIn(
          booking.status === 'confirmed' &&
          booking.checkInOutStatus === null &&
          isAfter(now, checkInStart) &&
          isBefore(now, checkInEnd)
        );
      }

      if (role === 'renter') {
        setCanCheckOut(
          booking.status === 'confirmed' &&
          booking.checkInOutStatus === 'checked_in' &&
          isAfter(now, checkOutStart) &&
          isBefore(now, checkOutEnd)
        );
      }
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [booking, role]);

  return { canCheckIn, canCheckOut };
}

export function useCheckInOutOld({ booking, role }: UseCheckInOutProps) {
  const [state, setState] = useState<CheckInOutState>({
    canCheckIn: false,
    canCheckOut: false,
    isLoading: true,
    error: null,
  });

  const { toast } = useToast();

  // Vérifier la disponibilité des boutons check-in/out
  useEffect(() => {
    checkAvailability();
  }, [booking]);

  const checkAvailability = () => {
    try {
      const now = new Date();
      const startDate = parseISO(booking.startDate);
      const endDate = parseISO(booking.endDate);

      // Check-in window: 1 hour before to 1 hour after start time
      const checkInStart = addHours(startDate, -1);
      const checkInEnd = addHours(startDate, 1);

      // Check-out window: 1 hour before to 2 hours after end time
      const checkOutStart = addHours(endDate, -1);
      const checkOutEnd = addHours(endDate, 2);

      const canCheckIn =
        booking.status === 'confirmed' &&
        !booking.checkInOutStatus &&
        now >= checkInStart &&
        now <= checkInEnd;

      const canCheckOut =
        booking.status === 'in_progress' &&
        booking.checkInOutStatus === 'checked_in' &&
        now >= checkOutStart &&
        now <= checkOutEnd;

      setState({
        canCheckIn,
        canCheckOut,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Error checking availability",
      }));
    }
  };

  // Charger les photos existantes
  const [checkInPhotos, setCheckInPhotos] = useState<CheckInOutPhoto[]>([]);
  const [checkOutPhotos, setCheckOutPhotos] = useState<CheckInOutPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const { data: photos, error } = await supabase
          .from('check_in_out_photos')
          .select('*')
          .eq('booking_id', booking.id)
          .order('taken_at', { ascending: true });

        if (error) throw error;

        setCheckInPhotos(photos.filter(p => p.type === 'check-in'));
        setCheckOutPhotos(photos.filter(p => p.type === 'check-out'));
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [booking.id]);

  // Mettre à jour le statut de la réservation
  const updateBookingStatus = async (newStatus: CheckInOutStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ check_in_out_status: newStatus })
        .eq('id', booking.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  };

  // Ajouter de nouvelles photos
  const addPhotos = async (photos: CheckInOutPhoto[], type: 'check-in' | 'check-out') => {
    try {
      const { error } = await supabase
        .from('check_in_out_photos')
        .insert(photos);

      if (error) throw error;

      // Mettre à jour l'état local
      if (type === 'check-in') {
        setCheckInPhotos(prev => [...prev, ...photos]);
        await updateBookingStatus('check_in_completed');
      } else {
        setCheckOutPhotos(prev => [...prev, ...photos]);
        await updateBookingStatus('check_out_completed');
      }
    } catch (error) {
      console.error('Error adding photos:', error);
      throw error;
    }
  };

  const handleCheckIn = async (photos: CheckInOutPhoto[]) => {
    if (!state.canCheckIn) {
      toast({
        title: "Cannot check in",
        description: "Check-in is not available at this time",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement check-in logic with Supabase
    // - Update booking status to "in_progress"
    // - Set checkInOutStatus to "checked_in"
    // - Save photos to storage
    // - Update booking record with photo metadata
  };

  const handleCheckOut = async (photos: CheckInOutPhoto[]) => {
    if (!state.canCheckOut) {
      toast({
        title: "Cannot check out",
        description: "Check-out is not available at this time",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement check-out logic with Supabase
    // - Update booking status to "completed"
    // - Set checkInOutStatus to "checked_out"
    // - Save photos to storage
    // - Update booking record with photo metadata
  };

  return {
    ...state,
    checkInPhotos,
    checkOutPhotos,
    loading,
    addPhotos,
    handleCheckIn,
    handleCheckOut,
  };
} 