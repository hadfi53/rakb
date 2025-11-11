import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleFormData, VehicleSearch, VehicleAvailability, VehiclePublicationStatus } from '@/types/vehicle';

/**
 * Map database car to Vehicle interface
 */
const mapCarToVehicle = (car: any): Vehicle => {
  // Parse images (can be JSONB array or string array)
  let images: string[] = [];
  if (car.images) {
    if (typeof car.images === 'string') {
      try {
        images = JSON.parse(car.images);
      } catch {
        images = [car.images];
      }
    } else if (Array.isArray(car.images)) {
      // Handle JSONB array - ensure all items are strings
      images = car.images.map((img: any) => {
        if (typeof img === 'string') {
          return img;
        }
        // If it's an object, try to extract the URL
        return img?.url || img?.href || String(img);
      }).filter((img: string) => img && img.trim() !== '');
    }
  }
  
  // Debug log in development
  if (import.meta.env.DEV && images.length > 0) {
    console.log('📸 Parsed images for vehicle:', car.id, {
      original: car.images,
      parsed: images,
      firstImage: images[0]
    });
  }

  // Parse features (can be JSONB array or string array)
  let features: string[] = [];
  if (car.features) {
    if (typeof car.features === 'string') {
      try {
        features = JSON.parse(car.features);
      } catch {
        features = [];
      }
    } else if (Array.isArray(car.features)) {
      features = car.features;
    }
  }

  // Map publication_status from is_approved
  let publication_status: VehiclePublicationStatus = 'pending_review';
  if (car.is_approved === true) {
    publication_status = 'active';
  } else if (car.is_approved === false) {
    publication_status = 'pending_review';
  }

  // Map status from is_available
  const status: Vehicle['status'] = car.is_available === false ? 'unavailable' : 'available';

  // Ensure image_url is set correctly
  const image_url = images.length > 0 ? images[0] : undefined;

  return {
    id: car.id,
    owner_id: car.host_id, // Map host_id to owner_id for compatibility
    make: car.make || car.brand || '',
    model: car.model || '',
    year: car.year || 0,
    price_per_day: parseFloat(car.price_per_day?.toString() || '0'),
    location: car.location || '',
    description: car.description || '',
    images: images,
    status: status,
    publication_status: publication_status,
    fuel_type: car.fuel_type as any,
    transmission: car.transmission as any,
    seats: car.seats || null,
    features: features,
    rating: car.rating ? parseFloat(car.rating.toString()) : 0,
    reviews_count: car.review_count || 0,
    category: car.category as any,
    latitude: car.latitude ? parseFloat(car.latitude.toString()) : undefined,
    longitude: car.longitude ? parseFloat(car.longitude.toString()) : undefined,
    created_at: car.created_at || new Date().toISOString(),
    updated_at: car.updated_at || new Date().toISOString(),
    // Compatibility fields
    brand: car.make || car.brand,
    price: parseFloat(car.price_per_day?.toString() || '0'),
    name: `${car.make || car.brand || ''} ${car.model || ''} ${car.year || ''}`,
    image_url: image_url, // First image from array
  };
};

/**
 * Get available vehicles with search filters
 */
export const getAvailableVehicles = async (searchParams?: VehicleSearch): Promise<{ vehicles: Vehicle[]; error: any }> => {
  try {
    if (import.meta.env.DEV) {
      console.log('🔍 [getAvailableVehicles] Starting search with params:', searchParams);
    }

    let query = supabase
      .from('cars')
      .select('*')
      .eq('is_available', true)
      .eq('is_approved', true);

    // Apply search filters
    if (searchParams?.location) {
      // Trim and normalize location for better matching
      const normalizedLocation = searchParams.location.trim();
      query = query.ilike('location', `%${normalizedLocation}%`);
      if (import.meta.env.DEV) {
        console.log('📍 [getAvailableVehicles] Filtering by location:', normalizedLocation);
        console.log('📍 [getAvailableVehicles] Using ILIKE pattern:', `%${normalizedLocation}%`);
      }
    } else {
      if (import.meta.env.DEV) {
        console.log('📍 [getAvailableVehicles] No location filter - searching all locations');
      }
    }

    if (searchParams?.minPrice) {
      query = query.gte('price_per_day', searchParams.minPrice);
      if (import.meta.env.DEV) {
        console.log('💰 [getAvailableVehicles] Min price:', searchParams.minPrice);
      }
    }

    if (searchParams?.maxPrice) {
      query = query.lte('price_per_day', searchParams.maxPrice);
      if (import.meta.env.DEV) {
        console.log('💰 [getAvailableVehicles] Max price:', searchParams.maxPrice);
      }
    }

    if (searchParams?.category) {
      query = query.eq('category', searchParams.category);
      if (import.meta.env.DEV) {
        console.log('🏷️ [getAvailableVehicles] Category:', searchParams.category);
      }
    }

    if (import.meta.env.DEV) {
      console.log('📤 [getAvailableVehicles] Executing query...');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [getAvailableVehicles] Error fetching available vehicles:', error);
      console.error('❌ [getAvailableVehicles] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return { vehicles: [], error };
    }

    // Debug: Check if user is authenticated
    if (import.meta.env.DEV) {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 [getAvailableVehicles] User auth status:', user ? `Authenticated as ${user.id}` : 'Anonymous');
    }

    if (import.meta.env.DEV) {
      console.log(`✅ [getAvailableVehicles] Query successful. Found ${data?.length || 0} cars in database`);
      if (data && data.length > 0) {
        console.log('📋 [getAvailableVehicles] Sample car:', {
          id: data[0].id,
          brand: data[0].brand,
          model: data[0].model,
          location: data[0].location,
          is_available: data[0].is_available,
          is_approved: data[0].is_approved
        });
      } else {
        console.warn('⚠️ [getAvailableVehicles] No cars found. Possible reasons:');
        console.warn('   - No cars in database');
        console.warn('   - All cars have is_available = false');
        console.warn('   - All cars have is_approved = false');
        console.warn('   - RLS policy blocking access');
      }
    }

    let vehicles = (data || []).map(mapCarToVehicle);

    if (import.meta.env.DEV) {
      console.log(`🔄 [getAvailableVehicles] Mapped ${vehicles.length} vehicles after conversion`);
    }

    // Filter out vehicles with blocked dates if startDate and endDate are provided
    if (searchParams?.startDate && searchParams?.endDate) {
      if (import.meta.env.DEV) {
        console.log(`📅 [getAvailableVehicles] Filtering by dates: ${searchParams.startDate} to ${searchParams.endDate}`);
        console.time('⏱️ Date filtering');
      }
      
      // OPTIMIZATION: Check all vehicles in parallel instead of sequentially
      const availabilityChecks = vehicles.map(async (vehicle) => {
        const [blockedResult, bookingResult] = await Promise.all([
          checkBlockedDatesInRange(
            vehicle.id,
            searchParams.startDate!,
            searchParams.endDate!
          ),
          checkVehicleAvailability(
            vehicle.id,
            searchParams.startDate!,
            searchParams.endDate!
          )
        ]);

        const { hasBlockedDates, error: blockedError } = blockedResult;
        const { available, error: bookingError } = bookingResult;

        // If errors, still include the vehicle (fail open)
        if (blockedError || bookingError) {
          if (import.meta.env.DEV) {
            if (blockedError) {
              console.error(`Error checking blocked dates for vehicle ${vehicle.id}:`, blockedError);
            }
            if (bookingError) {
              console.error(`Error checking bookings for vehicle ${vehicle.id}:`, bookingError);
            }
          }
          return { vehicle, isAvailable: true }; // Fail open
        }

        // Only include vehicle if it's available and has no blocked dates
        const isAvailable = available.isAvailable && !hasBlockedDates;
        return { vehicle, isAvailable };
      });

      // Wait for all checks to complete in parallel
      const results = await Promise.all(availabilityChecks);
      
      // Filter to only available vehicles
      vehicles = results
        .filter(result => result.isAvailable)
        .map(result => result.vehicle);

      if (import.meta.env.DEV) {
        console.timeEnd('⏱️ Date filtering');
        console.log(`📅 [getAvailableVehicles] After date filtering: ${vehicles.length} vehicles available`);
      }
    }

    if (import.meta.env.DEV) {
      console.log(`✅ [getAvailableVehicles] Final result: ${vehicles.length} vehicles returned`);
    }

    return { vehicles, error: null };
  } catch (error: any) {
    console.error('Error in getAvailableVehicles:', error);
    return { vehicles: [], error };
  }
};

/**
 * Get vehicles owned by a specific user
 */
export const getOwnerVehicles = async (ownerId: string): Promise<{ vehicles: Vehicle[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('host_id', ownerId) // Use host_id in database
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owner vehicles:', error);
      return { vehicles: [], error };
    }

    const vehicles = (data || []).map(mapCarToVehicle);
    return { vehicles, error: null };
  } catch (error: any) {
    console.error('Error in getOwnerVehicles:', error);
    return { vehicles: [], error };
  }
};

/**
 * Get a single vehicle by ID
 */
export const getVehicleById = async (vehicleId: string): Promise<{ vehicle: Vehicle | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error) {
      console.error('Error fetching vehicle by ID:', error);
      return { vehicle: null, error };
    }

    if (!data) {
      return { vehicle: null, error: new Error('Vehicle not found') };
    }

    const vehicle = mapCarToVehicle(data);
    return { vehicle, error: null };
  } catch (error: any) {
    console.error('Error in getVehicleById:', error);
    return { vehicle: null, error };
  }
};

/**
 * Create a new vehicle
 */
export const createVehicle = async (
  ownerId: string,
  vehicleData: VehicleFormData & { publication_status?: VehiclePublicationStatus }
): Promise<{ vehicle: Vehicle | null; error: any }> => {
  try {
    // Map VehicleFormData to database schema
    const carData: any = {
      host_id: ownerId, // Use host_id in database
      brand: vehicleData.make || vehicleData.brand,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      price_per_day: vehicleData.price_per_day,
      location: vehicleData.location,
      description: vehicleData.description || '',
      images: vehicleData.images || [],
      features: vehicleData.features || [],
      seats: vehicleData.seats || null,
      transmission: vehicleData.transmission || null,
      fuel_type: vehicleData.fuel_type || null,
      category: vehicleData.category || null,
      latitude: vehicleData.latitude || null,
      longitude: vehicleData.longitude || null,
      is_available: true,
      is_approved: vehicleData.publication_status === 'active' ? true : false, // Map publication_status to is_approved
    };

    const { data, error } = await supabase
      .from('cars')
      .insert(carData)
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      return { vehicle: null, error };
    }

    const vehicle = mapCarToVehicle(data);
    return { vehicle, error: null };
  } catch (error: any) {
    console.error('Error in createVehicle:', error);
    return { vehicle: null, error };
  }
};

/**
 * Update an existing vehicle
 */
export const updateVehicle = async (
  vehicleId: string,
  ownerId: string,
  updates: Partial<VehicleFormData & { publication_status?: VehiclePublicationStatus }>
): Promise<{ vehicle: Vehicle | null; error: any }> => {
  try {
    // Map updates to database schema
    const updateData: any = {};

    if (updates.make !== undefined) {
      updateData.make = updates.make;
      updateData.brand = updates.make; // Also update brand for compatibility
    }
    if (updates.model !== undefined) updateData.model = updates.model;
    if (updates.year !== undefined) updateData.year = updates.year;
    if (updates.price_per_day !== undefined) updateData.price_per_day = updates.price_per_day;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.features !== undefined) updateData.features = updates.features;
    if (updates.seats !== undefined) updateData.seats = updates.seats;
    if (updates.transmission !== undefined) updateData.transmission = updates.transmission;
    if (updates.fuel_type !== undefined) updateData.fuel_type = updates.fuel_type;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    if (updates.publication_status !== undefined) {
      // Explicitly set is_approved based on publication_status
      updateData.is_approved = updates.publication_status === 'active';
      console.log('📝 Updating publication_status:', {
        publication_status: updates.publication_status,
        is_approved: updateData.is_approved
      });
    }

    const { data, error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', vehicleId)
      .eq('host_id', ownerId) // Ensure ownership
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      return { vehicle: null, error };
    }

    if (!data) {
      return { vehicle: null, error: new Error('Vehicle not found or access denied') };
    }

    const vehicle = mapCarToVehicle(data);
    return { vehicle, error: null };
  } catch (error: any) {
    console.error('Error in updateVehicle:', error);
    return { vehicle: null, error };
  }
};

/**
 * Delete a vehicle
 */
export const deleteVehicle = async (vehicleId: string, ownerId: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', vehicleId)
      .eq('host_id', ownerId); // Ensure ownership

    if (error) {
      console.error('Error deleting vehicle:', error);
      return { error };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error in deleteVehicle:', error);
    return { error };
  }
};

/**
 * Blocked date interface
 */
export interface BlockedDate {
  id: string;
  vehicle_id: string;
  blocked_date: string; // ISO date string (YYYY-MM-DD)
  reason?: 'maintenance' | 'manual' | 'other';
  note?: string;
  created_at: string;
  created_by?: string;
}

/**
 * Check if a vehicle has blocked dates in a date range
 */
export const checkBlockedDatesInRange = async (
  vehicleId: string,
  startDate: string,
  endDate: string
): Promise<{ hasBlockedDates: boolean; error: any }> => {
  try {
    // Convert dates to DATE format (remove time component)
    const startDateOnly = startDate.split('T')[0];
    const endDateOnly = endDate.split('T')[0];

    const { data, error } = await supabase
      .from('vehicle_blocked_dates')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .gte('blocked_date', startDateOnly)
      .lte('blocked_date', endDateOnly)
      .limit(1);

    if (error) {
      console.error('Error checking blocked dates:', error);
      return { hasBlockedDates: false, error };
    }

    return {
      hasBlockedDates: data && data.length > 0,
      error: null,
    };
  } catch (error: any) {
    console.error('Error in checkBlockedDatesInRange:', error);
    return { hasBlockedDates: false, error };
  }
};

/**
 * Check vehicle availability for a date range (bookings only)
 * Note: This only checks bookings, not blocked dates (to avoid double-checking)
 */
export const checkVehicleAvailability = async (
  vehicleId: string,
  startDate: string,
  endDate: string
): Promise<{ available: VehicleAvailability; error: any }> => {
  try {
    // Convert dates to DATE format (remove time component) for proper comparison
    const startDateOnly = startDate.split('T')[0];
    const endDateOnly = endDate.split('T')[0];

    // Check if there are any overlapping bookings
    // Using proper date comparison: bookings overlap if start_date <= endDate AND end_date >= startDate
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('car_id', vehicleId)
      .in('status', ['pending', 'confirmed', 'active', 'in_progress'])
      .lte('start_date', endDateOnly)
      .gte('end_date', startDateOnly)
      .limit(1); // Only need to know if any exist

    if (bookingsError) {
      console.error('Error checking vehicle availability (bookings):', bookingsError);
      return {
        available: { isAvailable: false },
        error: bookingsError,
      };
    }

    // Vehicle is available if there are no conflicting bookings
    const isAvailable = !bookings || bookings.length === 0;

    return {
      available: { isAvailable },
      error: null,
    };
  } catch (error: any) {
    console.error('Error in checkVehicleAvailability:', error);
    return {
      available: { isAvailable: false },
      error,
    };
  }
};

/**
 * Get all blocked dates for a vehicle
 */
export const getBlockedDates = async (vehicleId: string): Promise<{ blockedDates: BlockedDate[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('vehicle_blocked_dates')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('blocked_date', { ascending: true });

    if (error) {
      console.error('Error fetching blocked dates:', error);
      return { blockedDates: [], error };
    }

    const blockedDates = (data || []).map((bd: any) => ({
      id: bd.id,
      vehicle_id: bd.vehicle_id,
      blocked_date: bd.blocked_date,
      reason: bd.reason || 'manual',
      note: bd.note || undefined,
      created_at: bd.created_at,
      created_by: bd.created_by || undefined,
    }));

    return { blockedDates, error: null };
  } catch (error: any) {
    console.error('Error in getBlockedDates:', error);
    return { blockedDates: [], error };
  }
};

/**
 * Block dates for a vehicle
 */
export const blockDates = async (
  vehicleId: string,
  dates: string[],
  reason: 'maintenance' | 'manual' | 'other' = 'manual',
  note?: string
): Promise<{ blockedDates: BlockedDate[]; error: any }> => {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        blockedDates: [],
        error: new Error('User not authenticated'),
      };
    }

    // Prepare data for insertion
    const blockedDatesData = dates.map(date => ({
      vehicle_id: vehicleId,
      blocked_date: date,
      reason,
      note: note || null,
      created_by: user.id,
    }));

    // Insert blocked dates (ignore duplicates due to UNIQUE constraint)
    const { data, error } = await supabase
      .from('vehicle_blocked_dates')
      .insert(blockedDatesData)
      .select();

    if (error) {
      console.error('Error blocking dates:', error);
      // If error is due to duplicate, try to fetch existing dates
      if (error.code === '23505') {
        const { blockedDates } = await getBlockedDates(vehicleId);
        return { blockedDates, error: null };
      }
      return { blockedDates: [], error };
    }

    const blockedDates = (data || []).map((bd: any) => ({
      id: bd.id,
      vehicle_id: bd.vehicle_id,
      blocked_date: bd.blocked_date,
      reason: bd.reason || 'manual',
      note: bd.note || undefined,
      created_at: bd.created_at,
      created_by: bd.created_by || undefined,
    }));

    return { blockedDates, error: null };
  } catch (error: any) {
    console.error('Error in blockDates:', error);
    return { blockedDates: [], error };
  }
};

/**
 * Unblock dates for a vehicle
 */
export const unblockDates = async (
  vehicleId: string,
  dateIds: string[]
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('vehicle_blocked_dates')
      .delete()
      .eq('vehicle_id', vehicleId)
      .in('id', dateIds);

    if (error) {
      console.error('Error unblocking dates:', error);
      return { error };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error in unblockDates:', error);
    return { error };
  }
};

