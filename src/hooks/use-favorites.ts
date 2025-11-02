import { useState, useCallback, useEffect } from 'react';
import * as favoritesBackend from '@/lib/backend/favorites';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  vehicleId: string;
  car: string;
  location: string;
  price: number;
  rating: number;
  disponible: boolean;
}

interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  location: string;
  price_per_day: number;
  rating: number;
  status: string;
}

interface FavoriteRecord {
  id: string;
  vehicle_id: string;
  vehicles: VehicleData | null;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const getFavorites = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { favorites: favoritesData, error } = await favoritesBackend.getFavorites(user.id);
      if (error) {
        // Only show error if it's not a missing table/permission/relation issue
        if (error.code !== '42P01' && error.code !== 'PGRST301' && error.code !== 'PGRST116' && error.code !== 'PGRST200') {
          console.error('Error fetching favorites:', error);
          // Don't show toast for expected errors (missing table, RLS issues, relation errors)
          if (!error.message?.includes('table') && !error.message?.includes('permission') && !error.message?.includes('relationship')) {
            toast.error('Erreur lors du chargement des favoris');
          }
        }
        // Return empty array for missing table/permission/relation errors
        setFavorites([]);
        return;
      }
      setFavorites(favoritesData.map(fav => ({
        id: `${fav.user_id}_${fav.car_id}`, // Generate composite ID for UI
        vehicleId: fav.car_id, // Use car_id as vehicleId
        car: fav.vehicle ? `${fav.vehicle.brand || fav.vehicle.make} ${fav.vehicle.model}` : '',
        location: fav.vehicle?.location || '',
        price: fav.vehicle?.price_per_day || 0,
        rating: fav.vehicle?.rating || 0,
        disponible: fav.vehicle?.status === 'available',
      })) as Favorite[]);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger les favoris au montage et quand l'utilisateur change
  useEffect(() => {
    if (user) {
      getFavorites();
    } else {
      setFavorites([]);
    }
  }, [user, getFavorites]);

  const toggleFavorite = useCallback(async (vehicleId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour gérer vos favoris');
      return false;
    }

    try {
      const { added, error } = await favoritesBackend.toggleFavorite(user.id, vehicleId);
      
      if (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Impossible de modifier vos favoris');
        return false;
      }

      if (added) {
        toast.success('Ajouté aux favoris');
      } else {
        toast.success('Retiré des favoris');
      }

      // Rafraîchir la liste des favoris
      await getFavorites();
      return true;
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      toast.error('Impossible de modifier vos favoris');
      return false;
    }
  }, [user, getFavorites]);

  const isFavorite = useCallback((vehicleId: string) => {
    return favorites.some(f => f.vehicleId === vehicleId);
  }, [favorites]);

  return {
    favorites,
    loading,
    getFavorites,
    toggleFavorite,
    isFavorite
  };
}; 