import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRatings, RatingType } from '@/hooks/use-ratings';
import { RatingForm } from '@/components/ratings/RatingForm';
import { RatingDisplay } from '@/components/ratings/RatingDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReservationRatingProps {
  reservationId: string;
  carId: string;
  carOwnerId: string;
  renterId: string;
  className?: string;
}

export const ReservationRating = ({
  reservationId,
  carId,
  carOwnerId,
  renterId,
  className
}: ReservationRatingProps) => {
  const { user } = useAuth();
  const { canUserRate } = useRatings();
  const [loading, setLoading] = useState(true);
  const [canRateOwner, setCanRateOwner] = useState(false);
  const [canRateRenter, setCanRateRenter] = useState(false);
  const [canRateCar, setCanRateCar] = useState(false);

  useEffect(() => {
    const checkRatingPermissions = async () => {
      if (!user) return;

      const [ownerRating, renterRating, carRating] = await Promise.all([
        canUserRate(reservationId, user.id, 'owner_rating'),
        canUserRate(reservationId, user.id, 'renter_rating'),
        canUserRate(reservationId, user.id, 'car_rating')
      ]);

      setCanRateOwner(ownerRating);
      setCanRateRenter(renterRating);
      setCanRateCar(carRating);
      setLoading(false);
    };

    checkRatingPermissions();
  }, [user, reservationId]);

  if (loading || !user) return null;

  const isOwner = user.id === carOwnerId;
  const isRenter = user.id === renterId;

  if (!isOwner && !isRenter) return null;

  if (isRenter) {
    return (
      <div className={className}>
        <Tabs defaultValue="owner">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="owner">Propriétaire</TabsTrigger>
            <TabsTrigger value="car">Véhicule</TabsTrigger>
          </TabsList>
          <TabsContent value="owner">
            {canRateOwner ? (
              <RatingForm
                reservationId={reservationId}
                ratedUserId={carOwnerId}
                ratingType="owner_rating"
                onSuccess={() => setCanRateOwner(false)}
              />
            ) : (
              <RatingDisplay
                userId={carOwnerId}
                type="owner"
              />
            )}
          </TabsContent>
          <TabsContent value="car">
            {canRateCar ? (
              <RatingForm
                reservationId={reservationId}
                carId={carId}
                ratingType="car_rating"
                onSuccess={() => setCanRateCar(false)}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  Vous avez déjà évalué ce véhicule
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className={className}>
      {canRateRenter ? (
        <RatingForm
          reservationId={reservationId}
          ratedUserId={renterId}
          ratingType="renter_rating"
          onSuccess={() => setCanRateRenter(false)}
        />
      ) : (
        <RatingDisplay
          userId={renterId}
          type="renter"
        />
      )}
    </div>
  );
}; 