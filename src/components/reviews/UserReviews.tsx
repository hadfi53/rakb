import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingStars } from '@/components/ratings/RatingStars';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rental_id: string;
}

interface UserReviewsProps {
  userId: string;
}

export const UserReviews = ({ userId }: UserReviewsProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_reviews', { p_user_id: userId });

        if (error) throw error;

        setReviews(data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les avis",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId, toast]);

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  if (loading) {
    return <div>Chargement des avis...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <span className="text-2xl font-bold">{calculateAverageRating()}</span>
        </div>
        <span className="text-muted-foreground">
          ({reviews.length} avis)
        </span>
      </div>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {review.reviewer_name}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <RatingStars
                  value={review.rating}
                  readOnly
                  size="sm"
                />
                {review.comment && (
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 