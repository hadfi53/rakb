import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '@/lib/api';
import { Vehicle } from '@/lib/types';

interface UseVehicleSearchProps {
  location?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  minSeats?: number;
  isPremium?: boolean;
  brand?: string;
  minRating?: number;
}

export const useVehicleSearch = (props: UseVehicleSearchProps = {}) => {
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  
  // Extract search parameters
  const {
    location,
    startDate,
    endDate,
    category,
    minPrice,
    maxPrice,
    transmission,
    fuelType,
    minSeats,
    isPremium,
    brand,
    minRating = 0
  } = props;
  
  // Fetch vehicles from Supabase
  const { data: vehicles, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicles', location, startDate, endDate, category, minPrice, maxPrice, transmission, fuelType, minSeats, isPremium],
    queryFn: () => vehiclesApi.searchVehicles({
      location,
      startDate,
      endDate,
      category: category !== "Toutes" ? category : undefined,
      minPrice,
      maxPrice,
      transmission: transmission !== "all" ? transmission : undefined,
      fuelType: fuelType !== "all" ? fuelType : undefined,
      minSeats,
      isPremium
    }),
  });
  
  // Apply client-side filters
  useEffect(() => {
    if (vehicles) {
      let filtered = [...vehicles];
      
      // Apply brand filter (client-side)
      if (brand && brand !== "all") {
        filtered = filtered.filter(v => v.brand === brand || v.make === brand);
      }
      
      // Apply rating filter (client-side)
      if (minRating > 0) {
        filtered = filtered.filter(v => (v.rating || 0) >= minRating);
      }
      
      setFilteredVehicles(filtered);
    }
  }, [vehicles, brand, minRating]);
  
  // Get available brands from the fetched vehicles
  const availableBrands = vehicles ? Array.from(new Set(vehicles.map(v => v.brand || v.make))) : [];
  
  return {
    vehicles: filteredVehicles,
    isLoading,
    error,
    refetch,
    availableBrands,
    totalCount: vehicles?.length || 0,
    filteredCount: filteredVehicles.length
  };
}; 