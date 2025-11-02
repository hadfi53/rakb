// Mock reviews data storage in localStorage
import { delay } from './mock-data';
import { v4 as uuidv4 } from 'uuid';

export interface MockReview {
  id: string;
  vehicle_id: string;
  booking_id?: string;
  reviewer_id: string;
  reviewed_user_id?: string; // Pour les reviews d'agence
  rating: number; // 1-5
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  photos?: string[]; // URLs des photos
  created_at: string;
  updated_at: string;
  // Réponse de l'agence (optionnel)
  agency_response?: {
    response: string;
    responded_at: string;
  };
  // Ratings détaillés
  vehicle_rating?: number;
  agency_rating?: number;
  communication_rating?: number;
}

export interface ReviewFilters {
  minRating?: number;
  maxRating?: number;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
  hasPhotos?: boolean;
}

const getMockReviews = (vehicleId?: string, bookingId?: string): MockReview[] => {
  const key = vehicleId ? `mock-reviews-vehicle-${vehicleId}` : 
              bookingId ? `mock-reviews-booking-${bookingId}` : 
              'mock-reviews-all';
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

const saveMockReviews = (reviews: MockReview[], vehicleId?: string, bookingId?: string) => {
  const key = vehicleId ? `mock-reviews-vehicle-${vehicleId}` : 
              bookingId ? `mock-reviews-booking-${bookingId}` : 
              'mock-reviews-all';
  localStorage.setItem(key, JSON.stringify(reviews));
  
  // Également sauvegarder dans la liste globale pour faciliter les requêtes
  const allKey = 'mock-reviews-all';
  const allReviews = getMockReviews();
  reviews.forEach(review => {
    const existingIndex = allReviews.findIndex(r => r.id === review.id);
    if (existingIndex >= 0) {
      allReviews[existingIndex] = review;
    } else {
      allReviews.push(review);
    }
  });
  localStorage.setItem(allKey, JSON.stringify(allReviews));
};

export const mockReviewsApi = {
  /**
   * Récupère les reviews d'un véhicule
   */
  async getVehicleReviews(vehicleId: string, filters?: ReviewFilters): Promise<MockReview[]> {
    await delay(300);
    let reviews = getMockReviews(vehicleId);
    
    // Appliquer les filtres
    if (filters) {
      if (filters.minRating) {
        reviews = reviews.filter(r => r.rating >= filters.minRating!);
      }
      if (filters.maxRating) {
        reviews = reviews.filter(r => r.rating <= filters.maxRating!);
      }
      if (filters.hasPhotos) {
        reviews = reviews.filter(r => r.photos && r.photos.length > 0);
      }
      
      // Trier
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'newest':
            reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
          case 'oldest':
            reviews.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
          case 'highest':
            reviews.sort((a, b) => b.rating - a.rating);
            break;
          case 'lowest':
            reviews.sort((a, b) => a.rating - b.rating);
            break;
        }
      }
    }
    
    // Ne retourner que les reviews approuvées
    return reviews.filter(r => r.status === 'approved');
  },

  /**
   * Récupère les reviews reçues par une agence
   */
  async getAgencyReviews(agencyId: string): Promise<MockReview[]> {
    await delay(300);
    const allReviews = getMockReviews();
    return allReviews.filter(r => r.reviewed_user_id === agencyId);
  },

  /**
   * Crée une nouvelle review
   */
  async createReview(review: Omit<MockReview, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<MockReview> {
    await delay(500);
    const newReview: MockReview = {
      ...review,
      id: uuidv4(),
      status: 'pending', // Nécessite modération
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const reviews = getMockReviews(review.vehicle_id);
    reviews.push(newReview);
    saveMockReviews(reviews, review.vehicle_id);
    
    return newReview;
  },

  /**
   * Répond à une review (agence uniquement)
   */
  async respondToReview(reviewId: string, response: string): Promise<MockReview> {
    await delay(300);
    const allReviews = getMockReviews();
    const review = allReviews.find(r => r.id === reviewId);
    
    if (!review) {
      throw new Error("Review non trouvée");
    }
    
    review.agency_response = {
      response,
      responded_at: new Date().toISOString(),
    };
    review.updated_at = new Date().toISOString();
    
    saveMockReviews(allReviews, review.vehicle_id);
    return review;
  },

  /**
   * Calcule les statistiques de reviews pour un véhicule
   */
  async getVehicleReviewStats(vehicleId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { rating: number; count: number }[];
    withPhotos: number;
    responseRate: number;
  }> {
    await delay(200);
    const reviews = getMockReviews(vehicleId).filter(r => r.status === 'approved');
    
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [],
        withPhotos: 0,
        responseRate: 0,
      };
    }
    
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
    }));
    
    const withPhotos = reviews.filter(r => r.photos && r.photos.length > 0).length;
    const withResponse = reviews.filter(r => r.agency_response).length;
    const responseRate = reviews.length > 0 ? (withResponse / reviews.length) * 100 : 0;
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
      withPhotos,
      responseRate: Math.round(responseRate * 10) / 10,
    };
  },

  /**
   * Signale une review comme inappropriée
   */
  async reportReview(reviewId: string, reason: string): Promise<void> {
    await delay(300);
    // Dans un vrai système, cela créerait un signalement pour modération
    // Pour l'instant, on log juste
    console.log(`Review ${reviewId} signalée: ${reason}`);
  },
};

