import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getVehicleReviews } from "@/lib/backend/reviews";
import type { Review } from "@/lib/backend/reviews";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileReviewsProps {
  rating?: number;
  reviewsCount?: number;
  vehicleId?: string;
}

const MobileReviews = ({ rating = 0, reviewsCount = 0, vehicleId }: MobileReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      if (!vehicleId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { reviews: vehicleReviews } = await getVehicleReviews(vehicleId, 2); // Get latest 2 reviews for mobile
        setReviews(vehicleReviews);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [vehicleId]);

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return "Récemment";
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Avis des locataires</h2>
          {vehicleId && (
            <Link to={`/cars/${vehicleId}/reviews`}>
              <Button variant="ghost" size="sm" className="text-primary text-xs h-7">
                Voir tous
              </Button>
            </Link>
          )}
        </div>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : reviewsCount > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
              <span className="text-gray-600 text-xs">({reviewsCount})</span>
            </div>
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        {review.reviewer?.avatar_url && (
                          <AvatarImage src={review.reviewer.avatar_url} alt={`${review.reviewer.first_name} ${review.reviewer.last_name}`} />
                        )}
                        <AvatarFallback>
                          {review.reviewer
                            ? `${review.reviewer.first_name?.[0] || ''}${review.reviewer.last_name?.[0] || ''}`
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm">
                            {review.reviewer
                              ? `${review.reviewer.first_name} ${review.reviewer.last_name}`
                              : "Utilisateur anonyme"}
                          </h3>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="ml-1 text-xs">{review.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-600 text-xs">{review.comment}</p>
                        )}
                        <p className="text-gray-400 text-xs mt-1">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-4 text-sm">Aucun avis disponible.</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-600 text-center py-4 text-sm">Aucun avis pour le moment.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileReviews;
