// Mock favorites data storage in localStorage
import { delay } from './mock-data';
import { mockVehicles } from './mock-data';

export interface MockFavorite {
  id: string;
  user_id: string;
  vehicle_id: string;
  created_at: string;
}

const getMockFavorites = (userId: string): MockFavorite[] => {
  const stored = localStorage.getItem(`mock-favorites-${userId}`);
  return stored ? JSON.parse(stored) : [];
};

const saveMockFavorites = (userId: string, favorites: MockFavorite[]) => {
  localStorage.setItem(`mock-favorites-${userId}`, JSON.stringify(favorites));
};

export const mockFavoritesApi = {
  async getFavorites(userId: string) {
    await delay(200);
    const favorites = getMockFavorites(userId);
    
    return favorites.map(fav => {
      const vehicle = mockVehicles.find(v => v.id === fav.vehicle_id);
      if (!vehicle) return null;
      
      return {
        id: fav.id,
        vehicleId: fav.vehicle_id,
        car: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
        location: vehicle.location,
        price: vehicle.price_per_day,
        rating: vehicle.rating || 4.5,
        disponible: vehicle.status === 'available'
      };
    }).filter(Boolean);
  },

  async toggleFavorite(userId: string, vehicleId: string): Promise<boolean> {
    await delay(300);
    const favorites = getMockFavorites(userId);
    const existingIndex = favorites.findIndex(f => f.vehicle_id === vehicleId);
    
    if (existingIndex >= 0) {
      // Remove from favorites
      favorites.splice(existingIndex, 1);
    } else {
      // Add to favorites
      favorites.push({
        id: `fav-${Date.now()}`,
        user_id: userId,
        vehicle_id: vehicleId,
        created_at: new Date().toISOString()
      });
    }
    
    saveMockFavorites(userId, favorites);
    return existingIndex < 0; // Return true if added, false if removed
  }
};

