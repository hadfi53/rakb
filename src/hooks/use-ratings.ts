import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export type RatingType = 'owner_rating' | 'renter_rating' | 'car_rating';

export interface RatingInput {
  reservation_id: string;
  rated_user_id?: string;
  car_id?: string;
  rating_type: RatingType;
  rating: number;
  // Propriétaire
  communication_rating?: number;
  punctuality_rating?: number;
  car_condition_rating?: number;
  // Locataire
  reliability_rating?: number;
  car_care_rating?: number;
  return_condition_rating?: number;
  comment: string;
}

export interface Rating extends RatingInput {
  id: string;
  rater_id: string;
  created_at: string;
}

export interface RatingStats {
  average_rating: number;
  total_ratings: number;
  communication_avg?: number;
  punctuality_avg?: number;
  car_condition_avg?: number;
  reliability_avg?: number;
  car_care_avg?: number;
  return_condition_avg?: number;
}

export const useRatings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submitRating = async (input: RatingInput) => {
    try {
      setLoading(true);

      // Vérifier si l'utilisateur a déjà noté cette réservation
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('reservation_id', input.reservation_id)
        .eq('rating_type', input.rating_type)
        .single();

      if (existingRating) {
        toast({
          variant: "destructive",
          title: "Évaluation déjà soumise",
          description: "Vous avez déjà évalué cette réservation"
        });
        return null;
      }

      const { data, error } = await supabase
        .from('ratings')
        .insert(input)
        .select()
        .single();

      if (error) {
        console.error('Error submitting rating:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de soumettre l'évaluation. Veuillez réessayer."
        });
        return null;
      }

      toast({
        title: "Merci pour votre avis !",
        description: "Votre évaluation a été enregistrée avec succès."
      });

      return data;
    } catch (error) {
      console.error('Error in submitRating:', error);
      toast({
        variant: "destructive",
        title: "Erreur inattendue",
        description: "Une erreur est survenue. Veuillez réessayer."
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserRatingStats = async (userId: string, type: 'owner' | 'renter'): Promise<RatingStats | null> => {
    try {
      const { data, error } = await supabase
        .rpc(type === 'owner' ? 'get_owner_rating_stats' : 'get_renter_rating_stats', {
          user_id_param: userId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching ${type} rating stats:`, error);
      return null;
    }
  };

  const getRatingsByReservation = async (reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          rater:rater_id(
            id,
            email,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('reservation_id', reservationId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching reservation ratings:', error);
      return [];
    }
  };

  const canUserRate = async (
    reservationId: string,
    userId: string,
    ratingType: RatingType
  ): Promise<boolean> => {
    try {
      // Vérifier si la réservation existe et est terminée
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .eq('status', 'completed')
        .single();

      if (resError || !reservation) return false;

      // Vérifier si l'utilisateur est autorisé à noter
      const isRenter = reservation.user_id === userId;
      const isOwner = reservation.car_owner_id === userId;

      if (!isRenter && !isOwner) return false;

      // Vérifier le type d'évaluation
      if (
        (isRenter && !['owner_rating', 'car_rating'].includes(ratingType)) ||
        (isOwner && ratingType !== 'renter_rating')
      ) {
        return false;
      }

      // Vérifier si l'utilisateur n'a pas déjà noté
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('reservation_id', reservationId)
        .eq('rater_id', userId)
        .eq('rating_type', ratingType)
        .single();

      return !existingRating;
    } catch (error) {
      console.error('Error in canUserRate:', error);
      return false;
    }
  };

  return {
    submitRating,
    getUserRatingStats,
    getRatingsByReservation,
    canUserRate,
    loading
  };
}; 