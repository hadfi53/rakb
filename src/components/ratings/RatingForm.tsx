import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from './RatingStars';
import { useRatings, RatingType } from '@/hooks/use-ratings';
import { cn } from '@/lib/utils';

interface RatingFormProps {
  reservationId: string;
  ratedUserId?: string;
  carId?: string;
  ratingType: RatingType;
  onSuccess?: () => void;
  className?: string;
}

export const RatingForm = ({
  reservationId,
  ratedUserId,
  carId,
  ratingType,
  onSuccess,
  className
}: RatingFormProps) => {
  const { submitRating, loading } = useRatings();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Critères spécifiques pour les propriétaires
  const [communicationRating, setCommunicationRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [carConditionRating, setCarConditionRating] = useState(0);

  // Critères spécifiques pour les locataires
  const [reliabilityRating, setReliabilityRating] = useState(0);
  const [carCareRating, setCarCareRating] = useState(0);
  const [returnConditionRating, setReturnConditionRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Veuillez donner une note globale');
      return;
    }

    if (comment.length < 20) {
      setError('Le commentaire doit faire au moins 20 caractères');
      return;
    }

    // Vérifier les critères spécifiques selon le type d'évaluation
    if (ratingType === 'owner_rating') {
      if (communicationRating === 0 || punctualityRating === 0 || carConditionRating === 0) {
        setError('Veuillez noter tous les critères');
        return;
      }
    } else if (ratingType === 'renter_rating') {
      if (reliabilityRating === 0 || carCareRating === 0 || returnConditionRating === 0) {
        setError('Veuillez noter tous les critères');
        return;
      }
    }

    const ratingData = {
      reservation_id: reservationId,
      rated_user_id: ratedUserId,
      car_id: carId,
      rating_type: ratingType,
      rating,
      comment,
      ...(ratingType === 'owner_rating' && {
        communication_rating: communicationRating,
        punctuality_rating: punctualityRating,
        car_condition_rating: carConditionRating
      }),
      ...(ratingType === 'renter_rating' && {
        reliability_rating: reliabilityRating,
        car_care_rating: carCareRating,
        return_condition_rating: returnConditionRating
      })
    };

    const result = await submitRating(ratingData);
    if (result) {
      setRating(0);
      setComment('');
      onSuccess?.();
    }
  };

  return (
    <Card className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Note globale
            </label>
            <RatingStars
              value={rating}
              onChange={setRating}
              size="lg"
            />
          </div>

          {ratingType === 'owner_rating' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Communication
                </label>
                <RatingStars
                  value={communicationRating}
                  onChange={setCommunicationRating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ponctualité
                </label>
                <RatingStars
                  value={punctualityRating}
                  onChange={setPunctualityRating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  État du véhicule
                </label>
                <RatingStars
                  value={carConditionRating}
                  onChange={setCarConditionRating}
                />
              </div>
            </>
          )}

          {ratingType === 'renter_rating' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fiabilité
                </label>
                <RatingStars
                  value={reliabilityRating}
                  onChange={setReliabilityRating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Soin du véhicule
                </label>
                <RatingStars
                  value={carCareRating}
                  onChange={setCarCareRating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  État au retour
                </label>
                <RatingStars
                  value={returnConditionRating}
                  onChange={setReturnConditionRating}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Commentaire
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience en détail (minimum 20 caractères)"
              className="h-32"
            />
            <p className="text-sm text-gray-500 mt-1">
              {comment.length}/20 caractères minimum
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Envoi en cours...' : 'Envoyer mon avis'}
        </Button>
      </form>
    </Card>
  );
}; 