import { useState, useEffect, useCallback } from 'react';
import * as notificationsBackend from '@/lib/backend/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'booking_confirmed' | 'booking_rejected' | 'booking_cancelled' | 'booking_request' | 'message' | 'system' | 'review';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  related_id?: string;
  user_id: string;
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

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<FormattedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fonction pour récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { notifications: formattedNotifications, error } = await notificationsBackend.getNotifications(user.id);

      if (error) {
        throw error;
      }

      setNotifications(formattedNotifications);
      
      // Calculer le nombre de notifications non lues
      const unread = formattedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fonction pour marquer une notification comme lue
  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await notificationsBackend.markAsRead(user.id, id);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );

      // Recalculer le nombre de notifications non lues
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
      toast.error('Impossible de marquer la notification comme lue');
    }
  }, [user]);

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await notificationsBackend.markAllAsRead(user.id);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );

      // Mettre à jour le compteur
      setUnreadCount(0);
      
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', err);
      toast.error('Impossible de marquer toutes les notifications comme lues');
    }
  }, [user]);

  // Charger les notifications au montage
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();
  }, [user, fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };
};
