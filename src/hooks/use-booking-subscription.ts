import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useBookingSubscription = (onBookingUpdate?: () => void) => {
  const { user } = useAuth();

  // Callback pour rafraîchir les données
  const handleBookingUpdate = useCallback(() => {
    if (onBookingUpdate) {
      onBookingUpdate();
    }
  }, [onBookingUpdate]);

  useEffect(() => {
    if (!user) return;

    console.log('Configuration de la souscription aux réservations pour le locataire:', user.id);

    // Subscribe to booking changes for the current user
    const subscription = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `renter_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Changement détecté dans les réservations:', payload);
          
          // Rafraîchir les données immédiatement
          handleBookingUpdate();
          
          // Handle different types of changes
          switch (payload.eventType) {
            case 'INSERT':
              toast.success('Nouvelle réservation créée');
              break;
            case 'UPDATE':
              const newStatus = payload.new.status;
              const oldStatus = payload.old.status;
              
              // Ne notifier que si le statut a changé
              if (newStatus !== oldStatus) {
                switch (newStatus) {
                  case 'confirmed':
                    toast.success('Votre réservation a été confirmée par le propriétaire');
                    break;
                  case 'rejected':
                    toast.error('Votre réservation a été refusée par le propriétaire');
                    break;
                  case 'cancelled':
                    if (payload.new.cancelled_by === 'owner') {
                      toast.info('Votre réservation a été annulée par le propriétaire');
                    } else {
                      toast.info('Votre réservation a été annulée');
                    }
                    break;
                  case 'in_progress':
                    toast.success('Votre location a commencé');
                    break;
                  case 'completed':
                    toast.success('Votre location est terminée');
                    break;
                }
              }
              break;
            case 'DELETE':
              toast.error('Une réservation a été supprimée');
              break;
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('Nettoyage de la souscription aux réservations');
      subscription.unsubscribe();
    };
  }, [user, handleBookingUpdate]);
}; 