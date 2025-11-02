import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { RatingStars } from './RatingStars';
import { useRatings, Rating } from '@/hooks/use-ratings';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RatingsListProps {
  type: 'car' | 'user';
  id: string;
  className?: string;
}

interface RatingWithUser extends Rating {
  rater: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export const RatingsList = ({ type, id, className }: RatingsListProps) => {
  const { getRatingsForCar, getRatingsForUser, getAverageRating } = useRatings();
  const [ratings, setRatings] = useState<RatingWithUser[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      setLoading(true);
      try {
        const [ratingsData, avgRating] = await Promise.all([
          type === 'car' ? getRatingsForCar(id) : getRatingsForUser(id),
          getAverageRating(type, id)
        ]);
        setRatings(ratingsData as RatingWithUser[]);
        setAverageRating(avgRating);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [type, id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gray-100">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center text-gray-500">
          Aucun avis pour le moment
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-4 mb-6">
        <RatingStars value={averageRating} onChange={() => {}} readOnly size="lg" />
        <span className="text-2xl font-semibold">{averageRating.toFixed(1)}</span>
        <span className="text-gray-500">({ratings.length} avis)</span>
      </div>

      <div className="space-y-4">
        {ratings.map((rating) => (
          <Card key={rating.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={rating.rater.avatar_url} />
                  <AvatarFallback>
                    {rating.rater.first_name[0]}
                    {rating.rater.last_name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {rating.rater.first_name} {rating.rater.last_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      • {formatDistanceToNow(new Date(rating.created_at), { 
                        addSuffix: true,
                        locale: fr 
                      })}
                    </span>
                  </div>

                  <RatingStars
                    value={rating.rating}
                    onChange={() => {}}
                    readOnly
                    size="sm"
                    className="mb-2"
                  />

                  <p className="text-gray-700 whitespace-pre-wrap">
                    {rating.comment}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 