import { supabase } from '@/lib/supabase';

export type NotificationType = 
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'booking_status_changed'
  | 'message'
  | 'review'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FormattedNotification {
  id: string;
  type: 'booking' | 'message' | 'system' | 'review';
  subtype?: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
  relatedId?: string;
  actionText?: string;
  actionLink?: string;
}

/**
 * Get all notifications for a user
 */
export const getNotifications = async (
  userId: string
): Promise<{ notifications: FormattedNotification[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { notifications: [], error };
    }

    // Format notifications with enhanced details
    const formattedNotifications: FormattedNotification[] = await Promise.all(
      (data || []).map(async (notif: any) => {
        // Determine notification category
        let category: 'booking' | 'message' | 'system' | 'review' = 'system';
        let link: string | undefined;
        let actionText: string | undefined;
        let actionLink: string | undefined;
        let enhancedMessage = notif.message || '';

        // Extract details from data field if it's JSONB
        let notificationData: any = null;
        try {
          if (notif.data && typeof notif.data === 'object') {
            notificationData = notif.data;
          } else if (typeof notif.data === 'string') {
            notificationData = JSON.parse(notif.data);
          }
        } catch (e) {
          // Data is not JSON, ignore
        }

        // Extraire related_id du champ data si disponible, sinon utiliser car_id ou autre identifiant
        const relatedId = notificationData?.booking_id || notificationData?.related_id || notif.car_id;

        if (notif.type.startsWith('booking_')) {
          category = 'booking';
          if (relatedId) {
            // Si c'est un car_id, on pourrait avoir besoin de trouver le booking correspondant
            // Pour l'instant, on utilise car_id comme fallback
            if (notificationData?.booking_id) {
              link = `/bookings/${notificationData.booking_id}`;
              actionLink = `/bookings/${notificationData.booking_id}`;
            } else if (notif.car_id) {
              // Chercher le booking le plus récent pour ce car_id et cet utilisateur
              try {
                const { data: bookingData } = await supabase
                  .from('bookings')
                  .select('id')
                  .eq('car_id', notif.car_id)
                  .eq('user_id', userId)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                
                if (bookingData) {
                  link = `/bookings/${bookingData.id}`;
                  actionLink = `/bookings/${bookingData.id}`;
                }
              } catch (e) {
                // Ignore errors
              }
            }
          }

          // Enhance message based on type
          switch (notif.type) {
            case 'booking_request':
              actionText = 'Voir la demande';
              if (!enhancedMessage || enhancedMessage === 'Vous avez une nouvelle demande de réservation') {
                enhancedMessage = 'Une nouvelle demande de réservation vous a été envoyée.';
                // Utiliser les colonnes directes de la table si disponibles
                if (notif.renter_name) {
                  enhancedMessage = `${notif.renter_name} a fait une demande de réservation.`;
                }
                if (notificationData?.car_name || notificationData?.vehicle_name) {
                  enhancedMessage += ` Véhicule: ${notificationData.car_name || notificationData.vehicle_name}`;
                }
                if (notif.start_date && notif.end_date) {
                  enhancedMessage += ` Du ${new Date(notif.start_date).toLocaleDateString('fr-FR')} au ${new Date(notif.end_date).toLocaleDateString('fr-FR')}`;
                } else if (notificationData?.start_date && notificationData?.end_date) {
                  enhancedMessage += ` Du ${new Date(notificationData.start_date).toLocaleDateString('fr-FR')} au ${new Date(notificationData.end_date).toLocaleDateString('fr-FR')}`;
                }
                if (notif.total_amount) {
                  enhancedMessage += ` Montant: ${notif.total_amount} MAD`;
                }
              }
              break;
            case 'booking_confirmed':
              actionText = 'Voir la réservation';
              if (!enhancedMessage || enhancedMessage.includes('confirmée')) {
                enhancedMessage = 'Votre réservation a été confirmée !';
                if (notificationData?.car_name) {
                  enhancedMessage += ` Véhicule: ${notificationData.car_name}`;
                }
              }
              break;
            case 'booking_rejected':
              actionText = 'Voir les détails';
              if (!enhancedMessage || enhancedMessage.includes('rejetée')) {
                enhancedMessage = 'Votre demande de réservation a été rejetée.';
                if (notificationData?.reason) {
                  enhancedMessage += ` Raison: ${notificationData.reason}`;
                }
              }
              break;
            case 'booking_cancelled':
              actionText = 'Voir les détails';
              if (!enhancedMessage || enhancedMessage.includes('annulée')) {
                enhancedMessage = 'Une réservation a été annulée.';
                if (notificationData?.car_name) {
                  enhancedMessage += ` Véhicule: ${notificationData.car_name}`;
                }
              }
              break;
            case 'booking_status_changed':
              actionText = 'Voir la réservation';
              if (!enhancedMessage) {
                enhancedMessage = 'Le statut de votre réservation a changé.';
                if (notificationData?.new_status) {
                  enhancedMessage += ` Nouveau statut: ${notificationData.new_status}`;
                }
              }
              break;
          }

          // Try to get car name from car_id if available
          if (notif.car_id && !enhancedMessage.includes('Véhicule:')) {
            try {
              const { data: carData } = await supabase
                .from('cars')
                .select('brand, model, make')
                .eq('id', notif.car_id)
                .single();
              
              if (carData) {
                const carName = carData.make || carData.brand || '';
                const carModel = carData.model || '';
                if (carName || carModel) {
                  enhancedMessage += ` Véhicule: ${carName} ${carModel}`.trim();
                }
              }
            } catch (e) {
              // Ignore errors
            }
          }
        } else if (notif.type === 'message') {
          category = 'message';
          if (relatedId || notificationData?.thread_id || notificationData?.chat_id) {
            const threadId = relatedId || notificationData?.thread_id || notificationData?.chat_id;
            link = `/messages/${threadId}`;
            actionLink = `/messages/${threadId}`;
            actionText = 'Ouvrir la conversation';
          }
          if (!enhancedMessage || enhancedMessage.includes('nouveau message')) {
            enhancedMessage = 'Vous avez reçu un nouveau message.';
            if (notificationData?.sender_name) {
              enhancedMessage = `${notificationData.sender_name} vous a envoyé un message.`;
            }
            if (notificationData?.preview) {
              enhancedMessage += ` ${notificationData.preview}`;
            }
          }
        } else if (notif.type === 'review') {
          category = 'review';
          if (relatedId) {
            link = `/bookings/${relatedId}/review`;
            actionLink = `/bookings/${relatedId}/review`;
            actionText = 'Voir l\'avis';
          }
          if (!enhancedMessage) {
            enhancedMessage = 'Vous avez reçu un nouvel avis sur votre réservation.';
            if (notificationData?.rating) {
              enhancedMessage += ` Note: ${notificationData.rating}/5`;
            }
          }
        } else if (notif.type === 'verification_approved' || notif.type === 'verification_rejected') {
          category = 'system';
          if (!enhancedMessage) {
            if (notif.type === 'verification_approved') {
              enhancedMessage = 'Votre demande de vérification a été approuvée.';
              if (notificationData?.verification_type) {
                enhancedMessage += ` Type: ${notificationData.verification_type}`;
              }
            } else {
              enhancedMessage = 'Votre demande de vérification a été rejetée.';
              if (notificationData?.reason) {
                enhancedMessage += ` Raison: ${notificationData.reason}`;
              }
            }
          }
        } else {
          // Generic system notification
          if (!enhancedMessage && notif.title) {
            // Use title as fallback if message is null
            enhancedMessage = notif.title;
          }
        }

        return {
          id: notif.id,
          type: category,
          subtype: notif.type,
          title: notif.title,
          message: enhancedMessage || notif.message || notif.title || 'Nouvelle notification',
          date: notif.created_at,
          read: notif.is_read,
          link,
          relatedId: relatedId,
          actionText,
          actionLink,
        };
      })
    );

    return { notifications: formattedNotifications, error: null };
  } catch (error) {
    console.error('Get notifications error:', error);
    return { notifications: [], error };
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (userId: string): Promise<{ count: number; error: any }> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return { count: 0, error };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Get unread count error:', error);
    return { count: 0, error };
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (
  userId: string,
  notificationId: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    return { error };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { error };
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { error };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return { error };
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  userId: string,
  notificationId: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    return { error };
  } catch (error) {
    console.error('Delete notification error:', error);
    return { error };
  }
};

/**
 * Create a notification
 */
export const createNotification = async (
  notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>
): Promise<{ notification: Notification | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
      })
      .select()
      .single();

    if (error) {
      return { notification: null, error };
    }

    return { notification: data as Notification, error: null };
  } catch (error) {
    console.error('Create notification error:', error);
    return { notification: null, error };
  }
};

