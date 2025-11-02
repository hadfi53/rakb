import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { useUser } from '@/hooks/use-user';

export function useBookingNotifications() {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Souscrire aux notifications de réservation
    const notificationsChannel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const notification = payload.new;
          
          // Afficher la notification
          toast({
            title: notification.title,
            description: notification.message,
            duration: 5000
          });

          // Marquer comme lu après un délai
          setTimeout(async () => {
            await supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('id', notification.id);
          }, 5000);
        }
      )
      .subscribe();

    // Souscrire aux changements de réservation
    const bookingsChannel = supabase
      .channel('booking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `owner_id=eq.${user.id}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const booking = payload.new;
            // Récupérer les informations détaillées de la réservation
            const { data: bookingDetails } = await supabase
              .from('bookings')
              .select(`
                *,
                vehicle:vehicles(*),
                renter:profiles!renter_id(*)
              `)
              .eq('id', booking.id)
              .single();

            if (bookingDetails) {
              toast({
                title: 'Nouvelle réservation',
                description: `${bookingDetails.renter.first_name} souhaite louer votre ${bookingDetails.vehicle.make} ${bookingDetails.vehicle.model}`,
                duration: 5000
              });
            }
          }
        }
      )
      .subscribe();

    // Nettoyage des souscriptions
    return () => {
      notificationsChannel.unsubscribe();
      bookingsChannel.unsubscribe();
    };
  }, [user, supabase, toast]);
} 