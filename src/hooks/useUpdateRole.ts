import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useUpdateRole = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshUser } = useAuth();

  const updateRole = async (newRole: 'owner' | 'renter' | 'admin') => {
    if (!user) {
      toast.error('Vous devez être connecté pour effectuer cette action');
      return false;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('update_user_role', {
        user_id: user.id,
        new_role: newRole
      });

      if (error) throw error;

      // Rafraîchir les informations de l'utilisateur
      await refreshUser();
      
      toast.success('Votre rôle a été mis à jour avec succès');
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      toast.error(error.message || 'Une erreur est survenue lors de la mise à jour du rôle');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateRole,
    isLoading
  };
}; 