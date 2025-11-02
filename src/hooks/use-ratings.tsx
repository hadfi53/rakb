import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export interface Rating {
  id: string;
  reservation_id: string;
  rater_id: string;
  rated_user_id?: string;
  car_id?: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface RatingInput {
  reservation_id: string;
  rated_user_id?: string;
  car_id?: string;
  rating: number;
  comment: string;
}

export const useRatings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submitRating = async (input: RatingInput) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Non autorisé",
        description: "Vous devez être connecté pour laisser un avis"
      });
      return null;
    }

    try {
      setLoading(true);

      // Vérifier si l'utilisateur a déjà laissé un avis pour cette réservation
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('reservation_id', input.reservation_id)
        .eq('rater_id', user.id)
        .single();

      if (existingRating) {
        toast({
          variant: "destructive",
          title: "Avis déjà soumis",
          description: "Vous avez déjà laissé un avis pour cette réservation"
        });
        return null;
      }

      // Soumettre le nouvel avis
      const { data, error } = await supabase
        .from('ratings')
        .insert({
          ...input,
          rater_id: user.id
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('check')) {
          toast({
            variant: "destructive",
            title: "Erreur de validation",
            description: "Veuillez vérifier que tous les champs sont correctement remplis"
          });
        } else {
          throw error;
        }
        return null;
      }

      toast({
        title: "Merci pour votre avis !",
        description: "Votre évaluation a été enregistrée avec succès"
      });

      return data;
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de soumettre votre avis. Veuillez réessayer."
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRatingsForCar = async (carId: string) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          rater:rater_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('car_id', carId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching car ratings:', error);
      return [];
    }
  };

  const getRatingsForUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          rater:rater_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      return [];
    }
  };

  const getAverageRating = async (type: 'car' | 'user', id: string) => {
    try {
      const { data, error } = await supabase
        .rpc(type === 'car' ? 'get_car_average_rating' : 'get_user_average_rating', {
          [type === 'car' ? 'car_id_param' : 'user_id_param']: id
        });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error(`Error fetching ${type} average rating:`, error);
      return 0;
    }
  };

  return {
    submitRating,
    getRatingsForCar,
    getRatingsForUser,
    getAverageRating,
    loading
  };
}; 