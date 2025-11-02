import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { calculateInsuranceFee } from '@/utils/booking';
import * as bookingsBackend from '@/lib/backend/bookings';
import {
  Booking,
  BookingRequest,
  BookingResponse,
  BookingActionResponse,
  VehicleChecklist,
  BookingStatus
} from '@/types';

// Calculate the number of days between two dates
const calculateDurationDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

interface UseBookingProps {
  onSuccess?: (booking: Booking) => void;
  onError?: (error: string) => void;
}

export const useBooking = (props?: UseBookingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  /**
   * Récupérer une réservation par son ID
   */
  const getBookingById = useCallback(async (id: string): Promise<Booking | null> => {
    try {
      setLoading(true);
      
      const { booking, error } = await bookingsBackend.getBookingById(id);
      
      if (error || !booking) {
        throw error || new Error('Booking not found');
      }
      
      // Map to internal Booking format if needed
      const formattedBooking: Booking = {
        id: booking.id,
        vehicle_id: booking.vehicle_id,
        renter_id: booking.renter_id,
        owner_id: booking.owner_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        status: booking.status,
        total_price: booking.total_price,
        pickup_location: booking.pickup_location,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        vehicle: booking.vehicle,
        owner: booking.owner,
      };
      
      setBooking(formattedBooking);
      return formattedBooking;
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch booking details"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  /**
   * Récupérer toutes les réservations d'un propriétaire (via ses véhicules)
   */
  const getOwnerBookings = useCallback(async (
    status?: BookingStatus
  ): Promise<Booking[]> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Use backend module
      const { bookings, error } = await bookingsBackend.getOwnerBookings(user.id, status);
      
      if (error) {
        throw error;
      }
      
      setBookings(bookings);
      return bookings;
    } catch (error: any) {
      console.error("[getOwnerBookings] Erreur lors de la récupération des réservations:", error.message);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer vos réservations."
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Récupérer toutes les réservations d'un utilisateur (en tant que locataire ou propriétaire)
   */
  const getUserBookings = useCallback(async (
    role: 'renter' | 'owner' = 'renter',
    status?: BookingStatus
  ): Promise<Booking[]> => {
    try {
      setLoading(true);
      console.log(`[getUserBookings] Début de la récupération des réservations (rôle: ${role})`);
      
      if (!user) {
        console.error("[getUserBookings] Erreur: Utilisateur non authentifié");
        throw new Error("Utilisateur non authentifié");
      }
      
      console.log(`[getUserBookings] Récupération des réservations en tant que ${role} pour l'utilisateur:`, user.id);
      
      // Utiliser la fonction appropriée selon le rôle
      if (role === 'owner') {
        // Pour les propriétaires, utiliser getOwnerBookings
        console.log("[getUserBookings] Délégation à getOwnerBookings pour les réservations du propriétaire");
        const ownerBookings = await getOwnerBookings(status);
        console.log(`[getUserBookings] ${ownerBookings.length} réservations récupérées pour le propriétaire`);
        return ownerBookings;
      } else {
        // Pour les locataires, utiliser le backend module
        console.log("[getUserBookings] Récupération directe des réservations du locataire:", user.id);
        const { bookings: renterBookings, error } = await bookingsBackend.getRenterBookings(user.id, status);
        
        if (error) {
          console.error("[getUserBookings] Erreur:", error);
          throw error;
        }
        
        console.log("[getUserBookings] Nombre de réservations récupérées pour le locataire:", renterBookings?.length || 0);
        
        if (!renterBookings || renterBookings.length === 0) {
          console.log(`[getUserBookings] Aucune réservation trouvée pour le locataire ${user.id}`);
          setBookings([]);
          return [];
        }
        
        console.log(`[getUserBookings] ${renterBookings.length} réservations formatées pour le locataire`);
        setBookings(renterBookings);
        return renterBookings;
      }
    } catch (error: any) {
      console.error("[getUserBookings] Erreur lors de la récupération des réservations:", error.message);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer vos réservations."
      });
      return [];
    } finally {
      console.log("[getUserBookings] Fin de la récupération des réservations, loading = false");
      setLoading(false);
    }
  }, [user, toast, getOwnerBookings]);
  
  /**
   * Fonction pour vérifier la disponibilité d'un véhicule
   */
  const checkVehicleAvailability = async (vehicleId: string, startDate: string, endDate: string): Promise<boolean> => {
    try {
      // Vérifier les réservations existantes qui se chevauchent
      const { data: existingBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .or(
          `and(start_date.lte.${endDate},end_date.gte.${startDate}),` + // Chevauchement complet
          `and(start_date.gte.${startDate},start_date.lte.${endDate}),` + // Début pendant la période
          `and(end_date.gte.${startDate},end_date.lte.${endDate})` // Fin pendant la période
        );

      if (error) {
        console.error("Erreur lors de la vérification de la disponibilité:", error);
        throw error;
      }

      // Si des réservations existent pour cette période, le véhicule n'est pas disponible
      if (existingBookings && existingBookings.length > 0) {
        console.log("Réservations existantes trouvées:", existingBookings);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la vérification de la disponibilité:", error);
      return false;
    }
  };
  
  /**
   * Fonction pour créer une réservation qui vérifie la disponibilité du véhicule
   */
  const createBookingRequest = useCallback(async (
    request: BookingRequest
  ): Promise<BookingResponse> => {
    try {
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      // Récupérer les informations du véhicule et du propriétaire
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*, owner:profiles!owner_id(*)')
        .eq('id', request.vehicleId)
        .single();

      if (vehicleError || !vehicleData) {
        console.error("Erreur lors de la récupération du véhicule:", vehicleError);
        throw vehicleError || new Error('Vehicle not found');
      }

      const ownerId = vehicleData.owner_id;
      const durationDays = calculateDurationDays(request.startDate, request.endDate);
      const basePrice = vehicleData.price_per_day * durationDays;
      const insuranceFee = calculateInsuranceFee(basePrice, request.insuranceOption);
      const serviceFee = Math.round(basePrice * 0.1); // 10% de frais de service
      const totalPrice = basePrice + insuranceFee + serviceFee;
      const depositAmount = vehicleData.security_deposit || Math.round(basePrice * 0.3);

      // Use backend module (it handles availability check and notification creation)
      const { booking, error: bookingError } = await bookingsBackend.createBooking({
        ...request,
        renterId: user.id,
        ownerId,
        basePrice,
        insuranceFee,
        serviceFee,
        totalPrice,
        depositAmount,
        durationDays,
      });

      if (bookingError || !booking) {
        throw bookingError || new Error('Failed to create booking');
      }

      toast({
        title: "Demande envoyée",
        description: "Votre demande de réservation a bien été envoyée au propriétaire."
      });

      return {
        success: true,
        bookingId: booking.id
      };
    } catch (error: any) {
      console.error("Erreur lors de la création de la réservation:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer la réservation."
      });
      return {
        success: false,
        error: error.message
      };
    }
  }, [user, toast]);
  
  /**
   * Accepter une demande de réservation (pour les propriétaires)
   */
  const acceptBookingRequest = useCallback(async (
    bookingId: string
  ): Promise<BookingActionResponse> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Appel à la fonction RPC pour accepter la réservation
      const { data, error } = await supabase.rpc('accept_booking_request', {
        p_booking_id: bookingId
      });
      
      if (error) throw error;
      
      if (data) {
        // Mise à jour de la réservation locale
        await getBookingById(bookingId);
        
        toast({
          title: "Demande acceptée",
          description: "Vous avez accepté la demande de réservation."
        });
        
        return {
          success: true,
          message: "Réservation acceptée"
        };
      }
      
      throw new Error("La demande n'a pas pu être acceptée");
    } catch (error: any) {
      console.error("Erreur lors de l'acceptation de la réservation:", error.message);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'accepter cette demande de réservation."
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [user, getBookingById, toast]);
  
  /**
   * Refuser une demande de réservation (pour les propriétaires)
   */
  const rejectBookingRequest = useCallback(async (
    bookingId: string,
    reason?: string
  ): Promise<BookingActionResponse> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Appel à la fonction RPC pour refuser la réservation
      const { data, error } = await supabase.rpc('reject_booking_request', {
        p_booking_id: bookingId,
        p_reason: reason
      });
      
      if (error) throw error;
      
      if (data) {
        // Mise à jour de la réservation locale
        await getBookingById(bookingId);
        
        toast({
          title: "Demande refusée",
          description: "Vous avez refusé la demande de réservation."
        });
        
        return {
          success: true,
          message: "Réservation refusée"
        };
      }
      
      throw new Error("La demande n'a pas pu être refusée");
    } catch (error: any) {
      console.error("Erreur lors du refus de la réservation:", error.message);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de refuser cette demande de réservation."
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [user, getBookingById, toast]);
  
  /**
   * Confirmer le paiement d'une réservation (simulation pour le moment)
   */
  const confirmBookingPayment = useCallback(async (
    bookingId: string
  ): Promise<BookingActionResponse> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Mise à jour de la réservation
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'charged',
          payment_id: `pmt_${Date.now()}`, // Simuler un ID de paiement
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('renter_id', user.id)
        .eq('status', 'accepted');
      
      if (error) throw error;
      
      // Mise à jour de la réservation locale
      await getBookingById(bookingId);
      
      toast({
        title: "Paiement confirmé",
        description: "Votre paiement a été confirmé et la réservation est validée."
      });
      
      return {
        success: true,
        message: "Paiement confirmé"
      };
    } catch (error: any) {
      console.error("Erreur lors de la confirmation du paiement:", error.message);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de confirmer le paiement de cette réservation."
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [user, getBookingById, toast]);
  
  /**
   * Partager les coordonnées de contact entre le propriétaire et le locataire
   */
  const shareContactDetails = useCallback(async (
    bookingId: string
  ): Promise<BookingActionResponse> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Vérifier que l'utilisateur est bien le propriétaire ou le locataire
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!booking) {
        throw new Error("Réservation non trouvée");
      }
      
      // Vérifier que la réservation est bien confirmée
      if (booking.status !== 'confirmed') {
        throw new Error("La réservation doit être confirmée pour partager les coordonnées");
      }
      
      // Mettre à jour la réservation
      const { error } = await supabase
        .from('bookings')
        .update({
          contact_shared: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      // Mise à jour de la réservation locale
      await getBookingById(bookingId);
      
      toast({
        title: "Coordonnées partagées",
        description: "Les coordonnées de contact ont été partagées."
      });
      
      return {
        success: true,
        message: "Coordonnées partagées"
      };
    } catch (error: any) {
      console.error("Erreur lors du partage des coordonnées:", error.message);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de partager les coordonnées."
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [user, getBookingById, toast]);
  
  /**
   * Enregistrer l'état des lieux lors du retrait du véhicule
   */
  const savePickupChecklist = useCallback(async (
    bookingId: string,
    checklist: VehicleChecklist,
    photos: string[]
  ): Promise<BookingActionResponse> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Mise à jour de la réservation
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'in_progress',
          pickup_checklist: checklist,
          pickup_photos: photos,
          pickup_contract_signed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
        .eq('status', 'confirmed');
      
      if (error) throw error;
      
      // Mise à jour de la réservation locale
      await getBookingById(bookingId);
      
      toast({
        title: "État des lieux enregistré",
        description: "L'état des lieux de départ a été enregistré avec succès."
      });
      
      return {
        success: true,
        message: "État des lieux enregistré"
      };
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de l'état des lieux:", error.message);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer l'état des lieux."
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [user, getBookingById, toast]);
  
  /**
   * Enregistrer l'état des lieux lors du retour du véhicule
   */
  const saveReturnChecklist = useCallback(async (
    bookingId: string,
    checklist: VehicleChecklist,
    photos: string[]
  ): Promise<BookingActionResponse> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Mise à jour de la réservation
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          return_checklist: checklist,
          return_photos: photos,
          return_contract_signed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
        .eq('status', 'in_progress');
      
      if (error) throw error;
      
      // Mise à jour de la réservation locale
      await getBookingById(bookingId);
      
      toast({
        title: "État des lieux enregistré",
        description: "L'état des lieux de retour a été enregistré avec succès."
      });
      
      return {
        success: true,
        message: "État des lieux enregistré"
      };
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de l'état des lieux:", error.message);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer l'état des lieux."
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [user, getBookingById, toast]);
  
  /**
   * Annuler une réservation (en tant que locataire, uniquement à l'état pending)
   */
  const cancelBooking = useCallback(async (
    bookingId: string
  ): Promise<BookingActionResponse> => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }
      
      // Use backend module
      const { booking, error } = await bookingsBackend.cancelBooking(bookingId, user.id);
      
      if (error || !booking) {
        throw error || new Error('Failed to cancel booking');
      }
      
      // Mise à jour de la réservation locale
      await getBookingById(bookingId);
      
      toast({
        title: "Réservation annulée",
        description: "Votre réservation a été annulée avec succès."
      });
      
      return {
        success: true,
        message: "Réservation annulée"
      };
    } catch (error: any) {
      console.error("Erreur lors de l'annulation de la réservation:", error.message);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'annuler cette réservation."
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [user, getBookingById, toast]);
  
  return {
    loading,
    booking,
    bookings,
    getBookingById,
    getOwnerBookings,
    getUserBookings,
    createBookingRequest,
    acceptBookingRequest,
    rejectBookingRequest,
    confirmBookingPayment,
    shareContactDetails,
    savePickupChecklist,
    saveReturnChecklist,
    cancelBooking
  };
}; 