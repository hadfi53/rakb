import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useNotificationBadge = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer le nombre de notifications non lues
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Configurer la souscription aux changements de notifications
  useEffect(() => {
    if (!user) return;

    // Récupérer le nombre de notifications non lues au chargement
    fetchUnreadCount();

    // S'abonner aux changements de notifications
    const subscription = supabase
      .channel('notification-badge-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Rafraîchir le compteur à chaque changement
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    fetchUnreadCount
  };
}; 