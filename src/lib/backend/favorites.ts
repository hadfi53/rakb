import { supabase } from '@/lib/supabase';
import type { Vehicle } from '@/types/vehicle';

export interface Favorite {
  user_id: string; // Part of composite primary key
  car_id: string; // Part of composite primary key (not vehicle_id!)
  created_at: string;
  vehicle?: Vehicle; // Mapped from car data
}

/**
 * Get all favorites for a user
 */
export const getFavorites = async (userId: string): Promise<{ favorites: Favorite[]; error: any }> => {
  try {
    // Get favorites with car data join
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select(`
        *,
        cars(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      // If table doesn't exist or RLS issue, return empty array
      if (favoritesError.code === '42P01' || favoritesError.code === 'PGRST301' || favoritesError.code === 'PGRST200') {
        console.warn('Favorites table does not exist or is not accessible:', favoritesError.message);
        return { favorites: [], error: null };
      }
      console.error('Error fetching favorites:', favoritesError);
      return { favorites: [], error: favoritesError };
    }

    if (!favoritesData || favoritesData.length === 0) {
      return { favorites: [], error: null };
    }

    // Format favorites with car data from join
    const formattedFavorites: Favorite[] = (favoritesData || []).map((favorite: any) => {
      const car = favorite.cars || favorite.car;
      
      // Handle JSONB images and features from cars table
      let imagesArray: string[] = [];
      if (car?.images) {
        if (Array.isArray(car.images)) {
          imagesArray = car.images;
        } else if (typeof car.images === 'string') {
          try {
            imagesArray = JSON.parse(car.images);
          } catch {
            imagesArray = [];
          }
        }
      }
      
      let featuresArray: string[] = [];
      if (car?.features) {
        if (Array.isArray(car.features)) {
          featuresArray = car.features;
        } else if (typeof car.features === 'string') {
          try {
            featuresArray = JSON.parse(car.features);
          } catch {
            featuresArray = [];
          }
        }
      }
      
      return {
        user_id: favorite.user_id,
        car_id: favorite.car_id, // Use car_id
        created_at: favorite.created_at,
        vehicle: car
          ? {
              ...car,
              id: car.id,
              brand: car.brand || car.make,
              make: car.make || car.brand,
              price: car.price_per_day,
              price_per_day: car.price_per_day,
              name: `${car.brand || car.make} ${car.model} ${car.year}`,
              image_url: imagesArray.length > 0 ? imagesArray[0] : undefined,
              images: imagesArray,
              fuel: car.fuel_type,
              fuel_type: car.fuel_type,
              isPremium: car.is_premium || false,
              is_premium: car.is_premium || false,
              features: featuresArray,
              status: car.is_available === false ? 'unavailable' : 'available',
              publication_status: car.is_approved ? 'active' : 'pending_review',
              rating: car.rating || 0,
              reviews_count: car.review_count || 0,
              owner_id: car.host_id, // Map host_id to owner_id
            } as Vehicle
          : undefined,
      };
    });

    return { favorites: formattedFavorites, error: null };
  } catch (error) {
    console.error('Get favorites error:', error);
    return { favorites: [], error };
  }
};

/**
 * Check if a vehicle is in user's favorites
 */
export const isFavorite = async (
  userId: string,
  vehicleId: string
): Promise<{ isFavorite: boolean; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('user_id, car_id')
      .eq('user_id', userId)
      .eq('car_id', vehicleId) // Use car_id, not vehicle_id
      .single();

    if (error) {
      // Not found is not an error, just means not favorited
      if (error.code === 'PGRST116') {
        return { isFavorite: false, error: null };
      }
      return { isFavorite: false, error };
    }

    return { isFavorite: !!data, error: null };
  } catch (error) {
    console.error('Check favorite error:', error);
    return { isFavorite: false, error };
  }
};

/**
 * Add a vehicle to favorites
 */
export const addFavorite = async (
  userId: string,
  vehicleId: string
): Promise<{ favorite: Favorite | null; error: any }> => {
  try {
    // First check if already favorited
    const { isFavorite: alreadyFavorited } = await isFavorite(userId, vehicleId);
    if (alreadyFavorited) {
      return { favorite: null, error: { message: 'Vehicle already in favorites' } };
    }

    // Insert favorite
    const { data: favoriteData, error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        car_id: vehicleId, // Use car_id
      })
      .select(`
        *,
        cars(*)
      `)
      .single();

    if (insertError) {
      return { favorite: null, error: insertError };
    }

    const car = favoriteData.cars || favoriteData.car;
    
    // Handle JSONB images and features
    let imagesArray: string[] = [];
    if (car?.images) {
      if (Array.isArray(car.images)) {
        imagesArray = car.images;
      } else if (typeof car.images === 'string') {
        try {
          imagesArray = JSON.parse(car.images);
        } catch {
          imagesArray = [];
        }
      }
    }
    
    let featuresArray: string[] = [];
    if (car?.features) {
      if (Array.isArray(car.features)) {
        featuresArray = car.features;
      } else if (typeof car.features === 'string') {
        try {
          featuresArray = JSON.parse(car.features);
        } catch {
          featuresArray = [];
        }
      }
    }
    
    const formattedFavorite: Favorite = {
      user_id: favoriteData.user_id,
      car_id: favoriteData.car_id, // Use car_id
      created_at: favoriteData.created_at,
      vehicle: car
        ? {
            ...car,
            id: car.id,
            brand: car.brand || car.make,
            make: car.make || car.brand,
            price: car.price_per_day,
            price_per_day: car.price_per_day,
            name: `${car.brand || car.make} ${car.model} ${car.year}`,
            image_url: imagesArray.length > 0 ? imagesArray[0] : undefined,
            images: imagesArray,
            fuel: car.fuel_type,
            fuel_type: car.fuel_type,
            isPremium: car.is_premium || false,
            is_premium: car.is_premium || false,
            features: featuresArray,
            status: car.is_available === false ? 'unavailable' : 'available',
            publication_status: car.is_approved ? 'active' : 'pending_review',
            rating: car.rating || 0,
            reviews_count: car.review_count || 0,
            owner_id: car.host_id, // Map host_id to owner_id
          } as Vehicle
        : undefined,
    };

    return { favorite: formattedFavorite, error: null };
  } catch (error) {
    console.error('Add favorite error:', error);
    return { favorite: null, error };
  }
};

/**
 * Remove a vehicle from favorites
 */
export const removeFavorite = async (
  userId: string,
  vehicleId: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('car_id', vehicleId); // Use car_id, not vehicle_id

    return { error };
  } catch (error) {
    console.error('Remove favorite error:', error);
    return { error };
  }
};

/**
 * Toggle favorite (add if not exists, remove if exists)
 */
export const toggleFavorite = async (
  userId: string,
  vehicleId: string
): Promise<{ added: boolean; error: any }> => {
  try {
    const { isFavorite: isFav } = await isFavorite(userId, vehicleId);

    if (isFav) {
      const { error } = await removeFavorite(userId, vehicleId);
      if (error) {
        return { added: false, error };
      }
      return { added: false, error: null };
    } else {
      const { favorite, error } = await addFavorite(userId, vehicleId);
      if (error) {
        return { added: false, error };
      }
      return { added: true, error: null };
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return { added: false, error };
  }
};

