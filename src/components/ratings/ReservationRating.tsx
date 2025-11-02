import { useEffect, useState } from 'react';
import { RatingForm } from './RatingForm';
import { useRatings } from '@/hooks/use-ratings';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ReservationRatingProps {
  reservationId: string;
  carId: string;
  carOwnerId: string;
  renterId: string;
  endDate: string;
  className?: string;
}

export const ReservationRating = ({
  reservationId,
  carId,
  carOwnerId,
  renterId,
  endDate,
  className
}: ReservationRatingProps) => {
  const { user } = useAuth();
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRatingStatus = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Vérifier si la réservation est terminée
        const isEnded = new Date(endDate) < new Date();
        if (!isEnded) {
          setCanRate(false);
          return;
        }

        // Vérifier si l'utilisateur a déjà laissé un avis
        const { data: existingRating } = await supabase
          .from('ratings')
          .select('id')
          .eq('reservation_id', reservationId)
          .eq('rater_id', user.id)
          .single();

        setHasRated(!!existingRating);
        setCanRate(!existingRating);
      } finally {
        setLoading(false);
      }
    };

    checkRatingStatus();
  }, [user, reservationId, endDate]);

  if (loading || !user || !canRate) {
    return null;
  }

  // Déterminer si l'utilisateur est le propriétaire ou le locataire
  const isOwner = user.id === carOwnerId;
  const targetUserId = isOwner ? renterId : undefined;
  const targetCarId = !isOwner ? carId : undefined;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">
        {isOwner
          ? "Évaluez votre locataire"
          : "Évaluez votre expérience avec ce véhicule"
        }
      </h3>

      <RatingForm
        reservationId={reservationId}
        ratedUserId={targetUserId}
        carId={targetCarId}
        onSuccess={() => setHasRated(true)}
      />
    </div>
  );
}; 