import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserReview } from '@/types/user';

interface UseReviewsProps {
  userId: string;
}

interface UseReviewsReturn {
  reviews: UserReview[];
  averageRating: number;
  totalReviews: number;
  loading: boolean;
  error: string | null;
  fetchReviews: () => Promise<void>;
  addReview: (review: Omit<UserReview, 'id' | 'created_at'>) => Promise<void>;
}

export const useReviews = ({ userId }: UseReviewsProps): UseReviewsReturn => {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Impossible de charger les avis');
    } finally {
      setLoading(false);
    }
  };

  const addReview = async (review: Omit<UserReview, 'id' | 'created_at'>) => {
    try {
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert([
          {
            ...review,
            user_id: userId,
          },
        ]);

      if (reviewError) throw reviewError;
      await fetchReviews();
    } catch (err) {
      console.error('Error adding review:', err);
      throw new Error('Impossible d\'ajouter l\'avis');
    }
  };

  const calculateAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / reviews.length).toFixed(2));
  };

  useEffect(() => {
    if (userId) {
      fetchReviews();
    }
  }, [userId]);

  return {
    reviews,
    averageRating: calculateAverageRating(),
    totalReviews: reviews.length,
    loading,
    error,
    fetchReviews,
    addReview,
  };
}; 