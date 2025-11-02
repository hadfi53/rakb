import { supabase } from '@/lib/supabase';
import type { Vehicle } from '@/types/vehicle';
import { getVehicleReviewStats, getVehicleBookingCount } from './reviews';

export interface VehicleSearchParams {
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
}

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  location: string;
  description?: string;
  images?: string[];
  fuel_type?: string;
  luggage?: number;
  mileage?: number;
  color?: string;
  transmission?: string;
  seats?: number;
  features?: string[];
  category?: string;
  latitude?: number;
  longitude?: number;
  is_premium?: boolean;
  status?: 'available' | 'rented' | 'maintenance' | 'unavailable';
  publication_status?: 'draft' | 'pending_review' | 'active' | 'rejected';
}

/**
 * Check which vehicles table exists in the database
 */
const checkVehiclesTable = async (): Promise<'vehicles' | 'cars' | null> => {
  try {
    // Try vehicles table first
    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1);
    
    if (!vehiclesError || vehiclesError.code !== '42P01') {
      return 'vehicles';
    }

    // Try cars table
    const { error: carsError } = await supabase
      .from('cars')
      .select('id')
      .limit(1);
    
    if (!carsError || carsError.code !== '42P01') {
      return 'cars';
    }

    return null;
  } catch (error) {
    console.error('Error checking vehicles table:', error);
    return null;
  }
};

// Cache the table name
let cachedTableName: 'vehicles' | 'cars' | null = null;

/**
 * Get the vehicles table name (with caching)
 */
const getTableName = async (): Promise<'vehicles' | 'cars' | null> => {
  if (cachedTableName) {
    return cachedTableName;
  }
  cachedTableName = await checkVehiclesTable();
  return cachedTableName;
};

/**
 * Get all available vehicles with optional filters
 */
export const getAvailableVehicles = async (
  searchParams?: VehicleSearchParams
): Promise<{ vehicles: Vehicle[]; error: any }> => {
  try {
    const tableName = await getTableName();
    
    if (!tableName) {
      console.error('Neither vehicles nor cars table found in database');
      return { 
        vehicles: [], 
        error: { 
          message: 'Table des véhicules introuvable. Veuillez contacter le support.',
          code: 'TABLE_NOT_FOUND'
        } 
      };
    }

    // Build parameters for RPC function
    const params: Record<string, any> = {};

    if (searchParams) {
      if (searchParams.location) params.location_filter = searchParams.location;
      if (searchParams.minPrice) params.min_price = searchParams.minPrice;
      if (searchParams.maxPrice) params.max_price = searchParams.maxPrice;
      if (searchParams.category) params.category_filter = searchParams.category;
      if (searchParams.startDate) params.start_date = searchParams.startDate;
      if (searchParams.endDate) params.end_date = searchParams.endDate;
    }

    // Call RPC function if it exists, otherwise use direct query
    let data, error;

    if (Object.keys(params).length > 0) {
      // Map parameters to match search_vehicles function signature
      const rpcParams: Record<string, any> = {};
      if (params.location_filter) rpcParams.location_text = params.location_filter;
      if (params.start_date) rpcParams.start_date = params.start_date;
      if (params.end_date) rpcParams.end_date = params.end_date;
      if (params.min_price) rpcParams.min_price = params.min_price;
      if (params.max_price) rpcParams.max_price = params.max_price;
      if (params.category_filter) rpcParams.category_text = params.category_filter;

      // Try search_vehicles RPC function first
      const rpcResult = await supabase.rpc('search_vehicles', rpcParams);
      
      // Handle cases where RPC function doesn't exist or returns error
      // PGRST202 = function not found, 42883 = undefined function (PostgreSQL)
      if (rpcResult.error && (
        rpcResult.error.code === 'PGRST202' || 
        rpcResult.error.code === '42883' ||
        rpcResult.error.message?.includes('could not find a function') ||
        rpcResult.error.message?.includes('function') && rpcResult.error.message?.includes('does not exist')
      )) {
        // RPC function doesn't exist, fallback to direct query with filters
        let query = supabase
          .from(tableName)
          .select('*');
        
        // For 'cars' table, use 'is_available' boolean, for 'vehicles' use 'status' string
        if (tableName === 'cars') {
          query = query.eq('is_available', true);
        } else {
          query = query.eq('status', 'available');
          // Note: publication_status filter removed - will show all vehicles with status='available'
          // If you want to filter by publication_status, uncomment below and ensure column exists
          // query = query.or('publication_status.eq.active,publication_status.eq.published,publication_status.is.null');
        }

        if (params.location_filter) {
          // cars table uses location as TEXT field
          // Use case-insensitive search for location
          const locationSearch = params.location_filter.trim();
          query = query.ilike('location', `%${locationSearch}%`);
          
          if (import.meta.env.DEV) {
            console.log(`🔍 Filtrage par localisation: "${locationSearch}"`);
          }
        }
        if (params.min_price) {
          query = query.gte('price_per_day', params.min_price);
        }
        if (params.max_price) {
          query = query.lte('price_per_day', params.max_price);
        }
        if (params.category_filter && tableName === 'vehicles') {
          // category only exists in vehicles table
          query = query.eq('category', params.category_filter);
        }

        // Note: Date availability check is done client-side in this fallback
        // RPC function would handle it server-side, but we skip it here for simplicity
        // Vehicles will be filtered by availability after being fetched

        const queryResult = await query.order('created_at', { ascending: false });
        data = queryResult.data;
        error = queryResult.error;
        
        // If we have dates, filter out vehicles with conflicting bookings
        if (!error && data && params.start_date && params.end_date && tableName === 'vehicles') {
          if (import.meta.env.DEV) {
            console.log(`📅 Filtrage par disponibilité: ${params.start_date} - ${params.end_date}`);
          }
          
          // Filter vehicles that have conflicting bookings
          // Try both car_id and vehicle_id as the schema might use either
          const availableVehicles = [];
          for (const vehicle of data) {
            // Try vehicle_id first (newer schema)
            let { data: conflictingBookings, error: bookingsError } = await supabase
              .from('bookings')
              .select('id')
              .eq('vehicle_id', vehicle.id)
              .in('status', ['pending', 'confirmed', 'active', 'in_progress'])
              .lte('start_date', params.end_date)
              .gte('end_date', params.start_date)
              .limit(1);
            
            // If vehicle_id doesn't exist, try car_id (older schema)
            if (bookingsError && (bookingsError.code === '42703' || bookingsError.message?.includes('column') && bookingsError.message?.includes('does not exist'))) {
              const { data: carBookings, error: carError } = await supabase
                .from('bookings')
                .select('id')
                .eq('car_id', vehicle.id)
                .in('status', ['pending', 'confirmed', 'active', 'in_progress'])
                .lte('start_date', params.end_date)
                .gte('end_date', params.start_date)
                .limit(1);
              conflictingBookings = carBookings;
              bookingsError = carError;
            }
            
            if (!conflictingBookings || conflictingBookings.length === 0) {
              availableVehicles.push(vehicle);
            }
          }
          
          if (import.meta.env.DEV) {
            console.log(`✅ ${availableVehicles.length} véhicules disponibles après vérification des dates (sur ${data.length} total)`);
          }
          
          data = availableVehicles;
        }
      } else {
        data = rpcResult.data;
        error = rpcResult.error;
      }
    } else {
      // Direct query for all available vehicles
      // For 'cars' table, use 'available' boolean, for 'vehicles' use 'status' string
      let query = supabase
        .from(tableName)
        .select('*');
      
      if (tableName === 'cars') {
        query = query.eq('is_available', true);
      } else {
        query = query.eq('status', 'available');
        // Note: publication_status filter removed - will show all vehicles with status='available'
        // If you want to filter by publication_status, uncomment below and ensure column exists
        // query = query.or('publication_status.eq.active,publication_status.eq.published,publication_status.is.null');
      }
      
      const result = await query.order('created_at', { ascending: false });
      data = result.data;
      error = result.error;
    }

    if (error) {
      if (import.meta.env.DEV) {
      console.error('Error fetching vehicles:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }
      // If it's a table not found error, reset cache
      if (error.code === '42P01') {
        cachedTableName = null;
      }
      return { vehicles: [], error };
    }
    
    if (import.meta.env.DEV) {
      console.log(`✅ ${data?.length || 0} véhicules récupérés depuis ${tableName}`);
      if (data && data.length > 0) {
        console.log('Exemples de véhicules:', data.slice(0, 3).map((v: any) => ({
          id: v.id,
          make: v.make,
          model: v.model,
          location: v.location,
          status: v.status,
          publication_status: v.publication_status
        })));
      } else {
        console.warn('⚠️ Aucun véhicule récupéré. Paramètres de recherche:', searchParams);
      }
    }

    // Format vehicles to match Vehicle type
    const formattedVehicles = (data || []).map((vehicle: any) => {
      // Determine if this is from 'cars' or 'vehicles' table
      const isCarsTable = tableName === 'cars';
      
      // Location is already a text field in cars table
      const locationStr = vehicle.location || '';
      
      // Map is_available boolean to status string
      const status = isCarsTable 
        ? (vehicle.is_available === false ? 'unavailable' : 'available')
        : (vehicle.status || 'available');
      
      // Handle JSONB images - could be array or JSON string
      let imagesArray: string[] = [];
      if (vehicle.images) {
        if (Array.isArray(vehicle.images)) {
          imagesArray = vehicle.images;
        } else if (typeof vehicle.images === 'string') {
          try {
            imagesArray = JSON.parse(vehicle.images);
          } catch {
            imagesArray = [];
          }
        }
      }
      
      // Filtrer les valeurs invalides des images (comme "bookings", valeurs sans extension, etc.)
      imagesArray = imagesArray.filter(img => {
        if (!img || typeof img !== 'string') return false;
        const trimmed = img.trim();
        // Ignorer les valeurs invalides
        if (
          trimmed === '' ||
          trimmed === 'bookings' ||
          trimmed === 'vehicles' ||
          (!trimmed.startsWith('http://') && 
           !trimmed.startsWith('https://') && 
           !trimmed.includes('.')) // Doit avoir une extension de fichier ou être une URL complète
        ) {
          return false;
        }
        return true;
      });
      
      // Handle JSONB features - could be array or JSON string
      let featuresArray: string[] = [];
      if (vehicle.features) {
        if (Array.isArray(vehicle.features)) {
          featuresArray = vehicle.features;
        } else if (typeof vehicle.features === 'string') {
          try {
            featuresArray = JSON.parse(vehicle.features);
          } catch {
            featuresArray = [];
          }
        }
      }
      
      return {
        ...vehicle,
        id: vehicle.id,
        brand: vehicle.brand || vehicle.make,
        make: vehicle.make || vehicle.brand,
        price: vehicle.price_per_day || vehicle.price,
        price_per_day: vehicle.price_per_day || vehicle.price,
        name: `${vehicle.brand || vehicle.make} ${vehicle.model} ${vehicle.year}`,
        image_url: vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : (vehicle.image_url || undefined),
        images: vehicle.images || [],
        fuel: vehicle.fuel_type || vehicle.fuel,
        fuel_type: vehicle.fuel_type || vehicle.fuel,
        isPremium: vehicle.is_premium || false,
        is_premium: vehicle.is_premium || false,
        features: vehicle.features || [],
        status: status,
        location: locationStr,
        publication_status: vehicle.is_approved ? 'active' : 'pending_review',
        rating: vehicle.rating || 0,
        reviews_count: vehicle.review_count || 0,
        category: vehicle.category || null,
        owner_id: vehicle.host_id || vehicle.owner_id, // Map host_id to owner_id for interface compatibility
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
      } as Vehicle;
    });

    return { vehicles: formattedVehicles, error: null };
  } catch (error) {
    console.error('Get available vehicles error:', error);
    return { vehicles: [], error };
  }
};

/**
 * Get a single vehicle by ID
 */
export const getVehicleById = async (vehicleId: string): Promise<{ vehicle: Vehicle | null; error: any }> => {
  try {
    const tableName = await getTableName();
    
    if (!tableName) {
      return { 
        vehicle: null, 
        error: { 
          message: 'Table des véhicules introuvable',
          code: 'TABLE_NOT_FOUND'
        } 
      };
    }

    // Use explicit foreign key to avoid ambiguity between multiple relationships
    const isCarsTable = tableName === 'cars';
    const ownerForeignKey = isCarsTable ? 'host_id' : 'owner_id';
    
    const { data, error } = await supabase
      .from(tableName)
      .select(`
        *,
        owner:profiles!${ownerForeignKey}(id, first_name, last_name, avatar_url, rating, created_at)
      `)
      .eq('id', vehicleId)
      .single();

    if (error) {
      console.error('Error fetching vehicle by ID:', error);
      return { vehicle: null, error };
    }

    if (!data) {
      return { vehicle: null, error: { message: 'Vehicle not found' } };
    }

    // Format vehicle to match Vehicle type
    const locationStr = data.location || '';
    const status = isCarsTable 
      ? (data.is_available === false ? 'unavailable' : 'available')
      : (data.status || 'available');
    
    // Handle JSONB images
    let imagesArray: string[] = [];
    if (data.images) {
      if (Array.isArray(data.images)) {
        imagesArray = data.images;
      } else if (typeof data.images === 'string') {
        try {
          imagesArray = JSON.parse(data.images);
        } catch {
          imagesArray = [];
        }
      }
    }
    
    // Filtrer les valeurs invalides des images (comme "bookings", valeurs sans extension, etc.)
    imagesArray = imagesArray.filter(img => {
      if (!img || typeof img !== 'string') return false;
      const trimmed = img.trim();
      // Ignorer les valeurs invalides
      if (
        trimmed === '' ||
        trimmed === 'bookings' ||
        trimmed === 'vehicles' ||
        (!trimmed.startsWith('http://') && 
         !trimmed.startsWith('https://') && 
         !trimmed.includes('.')) // Doit avoir une extension de fichier ou être une URL complète
      ) {
        return false;
      }
      return true;
    });
    
    // Ensure owner is loaded; if not, fetch from profiles using owner_id/host_id
    let ownerProfile = (data as any).owner || null;
    const possibleOwnerId = (data as any).host_id || (data as any).owner_id;
    if (!ownerProfile && possibleOwnerId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, rating, created_at')
        .eq('id', possibleOwnerId)
        .single();
      if (!profileError && profile) {
        ownerProfile = profile;
      }
    }

    // Handle JSONB features
    let featuresArray: string[] = [];
    if (data.features) {
      if (Array.isArray(data.features)) {
        featuresArray = data.features;
      } else if (typeof data.features === 'string') {
        try {
          featuresArray = JSON.parse(data.features);
        } catch {
          featuresArray = [];
        }
      }
    }
    
    // Fetch real statistics from Supabase
    const [reviewStats, bookingCount] = await Promise.all([
      getVehicleReviewStats(vehicleId),
      getVehicleBookingCount(vehicleId),
    ]);

    // Use real stats if available, otherwise fall back to database values
    const actualRating = reviewStats.stats.totalReviews > 0 
      ? reviewStats.stats.averageRating 
      : (data.rating || 0);
    const actualReviewCount = reviewStats.stats.totalReviews || data.review_count || 0;

    const formattedVehicle: Vehicle = {
      ...data,
      id: data.id,
      brand: data.brand || data.make,
      make: data.make || data.brand,
      price: data.price_per_day || data.price,
      price_per_day: data.price_per_day || data.price,
      name: `${data.brand || data.make} ${data.model} ${data.year}`,
      image_url: imagesArray.length > 0 ? imagesArray[0] : (data.image_url || undefined),
      images: imagesArray,
      fuel: data.fuel_type || data.fuel,
      fuel_type: data.fuel_type || data.fuel,
      isPremium: data.is_premium || false,
      is_premium: data.is_premium || false,
      features: featuresArray,
      status: status,
      location: locationStr,
      publication_status: data.is_approved ? 'active' : 'pending_review',
      rating: actualRating,
      reviews_count: actualReviewCount,
      bookings_count: bookingCount.count, // Add booking count
      category: data.category || null,
      owner_id: data.host_id || data.owner_id, // Map host_id to owner_id for interface compatibility
      // Attach resolved owner profile for UI components (OwnerInfo, MobileOwnerCard)
      owner: ownerProfile,
    } as Vehicle;

    return { vehicle: formattedVehicle, error: null };
  } catch (error) {
    console.error('Get vehicle by ID error:', error);
    return { vehicle: null, error };
  }
};

/**
 * Get all vehicles for a specific owner
 */
export const getOwnerVehicles = async (ownerId: string): Promise<{ vehicles: Vehicle[]; error: any }> => {
  try {
    const tableName = await getTableName();
    
    if (!tableName) {
      return { 
        vehicles: [], 
        error: { 
          message: 'Table des véhicules introuvable',
          code: 'TABLE_NOT_FOUND'
        } 
      };
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(tableName === 'cars' ? 'host_id' : 'owner_id', ownerId) // cars uses host_id, vehicles uses owner_id
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owner vehicles:', error);
      return { vehicles: [], error };
    }

    // Format vehicles to match Vehicle type
    const formattedVehicles = (data || []).map((vehicle: any) => {
      const isCarsTable = tableName === 'cars';
      const locationStr = vehicle.location || '';
      const status = isCarsTable 
        ? (vehicle.is_available === false ? 'unavailable' : 'available')
        : (vehicle.status || 'available');
      
      // Handle JSONB images
      let imagesArray: string[] = [];
      if (vehicle.images) {
        if (Array.isArray(vehicle.images)) {
          imagesArray = vehicle.images;
        } else if (typeof vehicle.images === 'string') {
          try {
            imagesArray = JSON.parse(vehicle.images);
          } catch {
            imagesArray = [];
          }
        }
      }
      
      // Filtrer les valeurs invalides des images (comme "bookings", valeurs sans extension, etc.)
      imagesArray = imagesArray.filter(img => {
        if (!img || typeof img !== 'string') return false;
        const trimmed = img.trim();
        // Ignorer les valeurs invalides
        if (
          trimmed === '' ||
          trimmed === 'bookings' ||
          trimmed === 'vehicles' ||
          (!trimmed.startsWith('http://') && 
           !trimmed.startsWith('https://') && 
           !trimmed.includes('.')) // Doit avoir une extension de fichier ou être une URL complète
        ) {
          return false;
        }
        return true;
      });
      
      // Handle JSONB features
      let featuresArray: string[] = [];
      if (vehicle.features) {
        if (Array.isArray(vehicle.features)) {
          featuresArray = vehicle.features;
        } else if (typeof vehicle.features === 'string') {
          try {
            featuresArray = JSON.parse(vehicle.features);
          } catch {
            featuresArray = [];
          }
        }
      }
      
      return {
        ...vehicle,
        id: vehicle.id,
        brand: vehicle.brand || vehicle.make,
        make: vehicle.make || vehicle.brand,
        price: vehicle.price_per_day || vehicle.price,
        price_per_day: vehicle.price_per_day || vehicle.price,
        name: `${vehicle.brand || vehicle.make} ${vehicle.model} ${vehicle.year}`,
        image_url: vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : (vehicle.image_url || undefined),
        images: vehicle.images || [],
        fuel: vehicle.fuel_type || vehicle.fuel,
        fuel_type: vehicle.fuel_type || vehicle.fuel,
        isPremium: vehicle.is_premium || false,
        is_premium: vehicle.is_premium || false,
        features: vehicle.features || [],
        status: status,
        location: locationStr,
        publication_status: vehicle.is_approved ? 'active' : 'pending_review',
        rating: vehicle.rating || 0,
        reviews_count: vehicle.review_count || 0,
        category: vehicle.category || null,
        owner_id: vehicle.host_id || vehicle.owner_id, // Map host_id to owner_id for interface compatibility
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
      } as Vehicle;
    });

    return { vehicles: formattedVehicles, error: null };
  } catch (error) {
    console.error('Get owner vehicles error:', error);
    return { vehicles: [], error };
  }
};

/**
 * Create a new vehicle
 */
export const createVehicle = async (
  ownerId: string,
  vehicleData: VehicleFormData
): Promise<{ vehicle: Vehicle | null; error: any }> => {
  try {
    const tableName = await getTableName();
    
    if (!tableName) {
      return { 
        vehicle: null, 
        error: { 
          message: 'Table des véhicules introuvable',
          code: 'TABLE_NOT_FOUND'
        } 
      };
    }

    const isCarsTable = tableName === 'cars';
    let insertData: any;
    
    if (isCarsTable) {
      // For cars table, use different structure
      // Parse location string to extract city if it contains it
      const locationParts = vehicleData.location?.split(',') || [];
      const city = locationParts.length > 1 ? locationParts[0].trim() : 'Casablanca';
      const address = locationParts.length > 1 ? locationParts.slice(1).join(',').trim() : vehicleData.location || '';
      
      insertData = {
        owner_id: ownerId,
        brand: vehicleData.make || vehicleData.brand,
        model: vehicleData.model,
        year: vehicleData.year,
        price_per_day: vehicleData.price_per_day,
        description: vehicleData.description || '',
        images: vehicleData.images || [],
        is_available: (vehicleData.status === 'available' || vehicleData.status === undefined),
        fuel_type: vehicleData.fuel_type || 'gasoline',
        mileage: vehicleData.mileage || 0,
        transmission: vehicleData.transmission || 'manual',
        seats: vehicleData.seats || 5,
        features: vehicleData.features || [],
        location: vehicleData.location || address || city, // cars table has location as TEXT
      };
    } else {
      // For vehicles table
      insertData = {
        owner_id: ownerId,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        price_per_day: vehicleData.price_per_day,
        location: vehicleData.location,
        description: vehicleData.description,
        images: vehicleData.images || [],
        status: vehicleData.status || 'available',
        fuel_type: vehicleData.fuel_type,
        luggage: vehicleData.luggage,
        mileage: vehicleData.mileage,
        color: vehicleData.color,
        transmission: vehicleData.transmission,
        seats: vehicleData.seats,
        features: vehicleData.features || [],
        category: vehicleData.category,
        latitude: vehicleData.latitude,
        longitude: vehicleData.longitude,
        is_premium: vehicleData.is_premium || false,
        publication_status: vehicleData.publication_status || 'draft',
      };
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      return { vehicle: null, error };
    }

    const formattedVehicle: Vehicle = {
      ...data,
      id: data.id,
      brand: data.make || data.brand,
      price: data.price_per_day || data.price,
      price_per_day: data.price_per_day || data.price,
      name: `${data.make || data.brand} ${data.model} ${data.year}`,
      image_url: data.images && data.images.length > 0 ? data.images[0] : data.image_url,
      images: data.images || [],
      fuel: data.fuel_type || data.fuel,
      fuel_type: data.fuel_type || data.fuel,
      isPremium: data.is_premium,
      is_premium: data.is_premium,
      features: data.features || [],
      status: data.status || 'available',
      publication_status: data.publication_status,
      rating: data.rating || 0,
      reviews_count: data.reviews_count || 0,
    } as Vehicle;

    return { vehicle: formattedVehicle, error: null };
  } catch (error) {
    console.error('Create vehicle error:', error);
    return { vehicle: null, error };
  }
};

/**
 * Update an existing vehicle
 */
export const updateVehicle = async (
  vehicleId: string,
  vehicleData: Partial<VehicleFormData>
): Promise<{ vehicle: Vehicle | null; error: any }> => {
  try {
    const tableName = await getTableName();
    
    if (!tableName) {
      return { 
        vehicle: null, 
        error: { 
          message: 'Table des véhicules introuvable',
          code: 'TABLE_NOT_FOUND'
        } 
      };
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (vehicleData.make !== undefined) updateData.make = vehicleData.make;
    if (vehicleData.model !== undefined) updateData.model = vehicleData.model;
    if (vehicleData.year !== undefined) updateData.year = vehicleData.year;
    if (vehicleData.price_per_day !== undefined) updateData.price_per_day = vehicleData.price_per_day;
    if (vehicleData.location !== undefined) updateData.location = vehicleData.location;
    if (vehicleData.description !== undefined) updateData.description = vehicleData.description;
    if (vehicleData.images !== undefined) updateData.images = vehicleData.images;
    if (vehicleData.status !== undefined) updateData.status = vehicleData.status;
    if (vehicleData.fuel_type !== undefined) updateData.fuel_type = vehicleData.fuel_type;
    if (vehicleData.luggage !== undefined) updateData.luggage = vehicleData.luggage;
    if (vehicleData.mileage !== undefined) updateData.mileage = vehicleData.mileage;
    if (vehicleData.color !== undefined) updateData.color = vehicleData.color;
    if (vehicleData.transmission !== undefined) updateData.transmission = vehicleData.transmission;
    if (vehicleData.seats !== undefined) updateData.seats = vehicleData.seats;
    if (vehicleData.features !== undefined) updateData.features = vehicleData.features;
    if (vehicleData.category !== undefined) updateData.category = vehicleData.category;
    if (vehicleData.latitude !== undefined) updateData.latitude = vehicleData.latitude;
    if (vehicleData.longitude !== undefined) updateData.longitude = vehicleData.longitude;
    if (vehicleData.is_premium !== undefined) updateData.is_premium = vehicleData.is_premium;
    if (vehicleData.publication_status !== undefined) updateData.publication_status = vehicleData.publication_status;

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      return { vehicle: null, error };
    }

    const formattedVehicle: Vehicle = {
      ...data,
      id: data.id,
      brand: data.make || data.brand,
      price: data.price_per_day || data.price,
      price_per_day: data.price_per_day || data.price,
      name: `${data.make || data.brand} ${data.model} ${data.year}`,
      image_url: data.images && data.images.length > 0 ? data.images[0] : data.image_url,
      images: data.images || [],
      fuel: data.fuel_type || data.fuel,
      fuel_type: data.fuel_type || data.fuel,
      isPremium: data.is_premium,
      is_premium: data.is_premium,
      features: data.features || [],
      status: data.status || 'available',
      publication_status: data.publication_status,
      rating: data.rating || 0,
      reviews_count: data.reviews_count || 0,
    } as Vehicle;

    return { vehicle: formattedVehicle, error: null };
  } catch (error) {
    console.error('Update vehicle error:', error);
    return { vehicle: null, error };
  }
};

/**
 * Delete a vehicle
 */
export const deleteVehicle = async (vehicleId: string): Promise<{ error: any }> => {
  try {
    const tableName = await getTableName();
    
    if (!tableName) {
      return { 
        error: { 
          message: 'Table des véhicules introuvable',
          code: 'TABLE_NOT_FOUND'
        } 
      };
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', vehicleId);

    if (error) {
      console.error('Error deleting vehicle:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return { error };
  }
};

/**
 * Check vehicle availability for specific dates
 */
export const checkVehicleAvailability = async (
  vehicleId: string,
  startDate: string,
  endDate: string
): Promise<{ available: boolean; error: any }> => {
  try {
    // Check if vehicle exists and is available
    const { vehicle, error: vehicleError } = await getVehicleById(vehicleId);
    
    if (vehicleError || !vehicle) {
      return { available: false, error: vehicleError || { message: 'Vehicle not found' } };
    }

    // Check availability based on status (for vehicles) or available field (for cars)
    const tableName = await getTableName();
    const isCarsTable = tableName === 'cars';
    
    if (isCarsTable) {
      // For cars table, check if is_available is true
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .select('is_available')
        .eq('id', vehicleId)
        .single();
      
      if (carError || !carData || !carData.is_available) {
        return { available: false, error: null };
      }
    } else {
      // For vehicles table, check status
      if (vehicle.status !== 'available') {
        return { available: false, error: null };
      }
    }

    // Check for conflicting bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('car_id', vehicleId) // bookings table uses car_id, not vehicle_id
      .in('status', ['pending', 'confirmed', 'active'])
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError);
      return { available: false, error: bookingsError };
    }

    const available = !bookings || bookings.length === 0;
    return { available, error: null };
  } catch (error) {
    console.error('Check vehicle availability error:', error);
    return { available: false, error };
  }
};