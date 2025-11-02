import { supabase } from '@/lib/supabase';

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  car_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { rating: number; count: number }[];
}

/**
 * Get all reviews for a specific vehicle
 */
export const getVehicleReviews = async (
  carId: string,
  limit?: number
): Promise<{ reviews: Review[]; error: any }> => {
  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!user_id(id, first_name, last_name, avatar_url)
      `)
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching vehicle reviews:', error);
      return { reviews: [], error };
    }

    const reviews: Review[] =
      data?.map((review: any) => ({
        id: review.id,
        booking_id: review.booking_id,
        user_id: review.user_id,
        car_id: review.car_id,
        rating: Number(review.rating),
        comment: review.comment,
        created_at: review.created_at,
        reviewer: review.reviewer
          ? {
              id: review.reviewer.id,
              first_name: review.reviewer.first_name || '',
              last_name: review.reviewer.last_name || '',
              avatar_url: review.reviewer.avatar_url || undefined,
            }
          : undefined,
      })) || [];

    return { reviews, error: null };
  } catch (error) {
    console.error('Get vehicle reviews error:', error);
    return { reviews: [], error };
  }
};

/**
 * Get review statistics for a vehicle
 */
export const getVehicleReviewStats = async (
  carId: string
): Promise<{ stats: ReviewStats; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('car_id', carId);

    if (error) {
      console.error('Error fetching review stats:', error);
      return {
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: [],
        },
        error,
      };
    }

    if (!data || data.length === 0) {
      return {
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: [],
        },
        error: null,
      };
    }

    // Calculate average rating
    const totalRating = data.reduce((sum, review) => sum + Number(review.rating), 0);
    const averageRating = totalRating / data.length;

    // Calculate rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: data.filter((review) => Number(review.rating) === rating).length,
    }));

    return {
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: data.length,
        ratingDistribution,
      },
      error: null,
    };
  } catch (error) {
    console.error('Get review stats error:', error);
    return {
      stats: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [],
      },
      error,
    };
  }
};

/**
 * Get booking count for a vehicle (number of completed/pending bookings)
 */
export const getVehicleBookingCount = async (
  carId: string
): Promise<{ count: number; error: any }> => {
  try {
    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId)
      .in('status', ['pending', 'confirmed', 'completed']);

    if (error) {
      console.error('Error fetching booking count:', error);
      return { count: 0, error };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Get booking count error:', error);
    return { count: 0, error };
  }
};

/**
 * Calculate and update vehicle statistics (rating and review_count)
 * This should be called when a review is created/updated/deleted
 */
export const updateVehicleStats = async (
  carId: string
): Promise<{ success: boolean; error: any }> => {
  try {
    // Get review stats
    const { stats } = await getVehicleReviewStats(carId);

    // Update vehicle in database
    const { error } = await supabase
      .from('cars')
      .update({
        rating: stats.averageRating,
        review_count: stats.totalReviews,
      })
      .eq('id', carId);

    if (error) {
      console.error('Error updating vehicle stats:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Update vehicle stats error:', error);
    return { success: false, error };
  }
};

