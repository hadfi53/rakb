import { supabase } from '@/lib/supabase';
import type { Booking, BookingRequest, BookingStatus } from '@/types/booking';

export interface CreateBookingData extends BookingRequest {
  renterId: string;
  ownerId: string;
  basePrice: number;
  insuranceFee: number;
  serviceFee: number;
  totalPrice: number;
  depositAmount: number;
  durationDays: number;
  message?: string; // Optional message from renter to owner
}

/**
 * Create a new booking
 */
export const createBooking = async (
  bookingData: CreateBookingData
): Promise<{ booking: Booking | null; error: any }> => {
  try {
    // First check vehicle availability - try RPC function if it exists
    // Note: May not exist, so we'll check bookings directly
    let available = true;
    try {
      const { data: conflictingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('car_id', bookingData.vehicleId)
        .in('status', ['pending', 'confirmed', 'active'])
        .or(`start_date.lte.${bookingData.endDate},end_date.gte.${bookingData.startDate}`);
      
      if (!bookingsError && conflictingBookings && conflictingBookings.length > 0) {
        available = false;
      }
    } catch {
      // If query fails, proceed anyway
    }

    if (!available) {
      return {
        booking: null,
        error: { message: 'Vehicle is not available for the selected dates' },
      };
    }

    // Create booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        car_id: bookingData.vehicleId, // bookings table uses car_id, not vehicle_id
        user_id: bookingData.renterId, // bookings table uses user_id for renter
        host_id: bookingData.ownerId, // bookings table uses host_id, not owner_id
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        pickup_location: bookingData.pickupLocation,
        return_location: bookingData.returnLocation,
        total_amount: bookingData.totalPrice, // bookings table uses total_amount
        caution_amount: bookingData.depositAmount, // bookings table uses caution_amount
        status: 'pending',
        payment_status: 'pending',
      })
      .select(`
        *,
        car:cars(*),
        renter:profiles!user_id(*),
        host:profiles!host_id(*)
      `)
      .single();

    if (error) {
      return { booking: null, error };
    }

    // Format booking - map database fields to Booking interface
    const car = data.car || data.vehicle;
    const host = data.host || data.owner;
    const renter = data.renter;
    
    // Handle JSONB images from car
    let carImages: string[] = [];
    if (car?.images) {
      if (Array.isArray(car.images)) {
        carImages = car.images;
      } else if (typeof car.images === 'string') {
        try {
          carImages = JSON.parse(car.images);
        } catch {
          carImages = [];
        }
      }
    }
    
    const formattedBooking: Booking = {
      id: data.id,
      vehicle_id: data.car_id || data.vehicle_id, // Map car_id to vehicle_id for interface
      renter_id: data.user_id || data.renter_id, // Map user_id to renter_id
      owner_id: data.host_id || data.owner_id, // Map host_id to owner_id
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status as BookingStatus,
      total_price: data.total_amount || data.total_price,
      pickup_location: data.pickup_location,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at,
      vehicle: car
        ? {
            id: car.id,
            make: car.brand || car.make,
            model: car.model,
            year: car.year,
            images: carImages,
            price_per_day: car.price_per_day,
            location: car.location,
          }
        : undefined,
      owner: host
        ? {
            id: host.id,
            first_name: host.first_name || '',
            last_name: host.last_name || '',
            email: host.email || '',
            phone: host.phone_number || host.phone || '',
          }
        : undefined,
    };

    // Create message thread for this booking
    try {
      const { getOrCreateThread } = await import('@/lib/backend/messaging');
      const { thread: messageThread, error: threadError } = await getOrCreateThread(
        data.id, // booking id
        bookingData.renterId, // tenant_id
        bookingData.ownerId // host_id
      );
      
      if (threadError) {
        console.error('Error creating message thread:', threadError);
        // Continue even if thread creation fails
      }

      // If there's a message from the renter, send it as the first message
      if (bookingData.message && messageThread) {
        const { sendMessage } = await import('@/lib/backend/messaging');
        await sendMessage(
          messageThread.id,
          bookingData.renterId,
          bookingData.ownerId,
          bookingData.message
        );
      }
    } catch (threadError) {
      console.error('Error setting up messaging thread:', threadError);
      // Continue even if messaging setup fails
    }

    // Create notification for owner
    await supabase.from('notifications').insert({
      user_id: bookingData.ownerId,
      type: 'booking_request',
      title: 'Nouvelle demande de réservation',
      message: `Vous avez reçu une nouvelle demande de réservation`,
      related_id: data.id,
      is_read: false,
    });

    return { booking: formattedBooking, error: null };
  } catch (error) {
    console.error('Create booking error:', error);
    return { booking: null, error };
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (bookingId: string): Promise<{ booking: Booking | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        car:cars(*),
        renter:profiles!user_id(*),
        host:profiles!host_id(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      return { booking: null, error };
    }

    // Map database fields to Booking interface
    const car = data.car || data.vehicle;
    const host = data.host || data.owner;
    const renter = data.renter;
    
    // Handle JSONB images from car
    let carImages: string[] = [];
    if (car?.images) {
      if (Array.isArray(car.images)) {
        carImages = car.images;
      } else if (typeof car.images === 'string') {
        try {
          carImages = JSON.parse(car.images);
        } catch {
          carImages = [];
        }
      }
    }
    
    const formattedBooking: Booking = {
      id: data.id,
      vehicle_id: data.car_id || data.vehicle_id, // Map car_id to vehicle_id
      renter_id: data.user_id || data.renter_id, // Map user_id to renter_id
      owner_id: data.host_id || data.owner_id, // Map host_id to owner_id
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status as BookingStatus,
      total_price: data.total_amount || data.total_price, // Map total_amount to total_price
      pickup_location: data.pickup_location,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at,
      vehicle: car
        ? {
            id: car.id,
            make: car.brand || car.make, // Map brand to make
            model: car.model,
            year: car.year,
            images: carImages,
            price_per_day: car.price_per_day,
            location: car.location,
          }
        : undefined,
      owner: host
        ? {
            id: host.id,
            first_name: host.first_name || '',
            last_name: host.last_name || '',
            email: host.email || '',
            phone: host.phone_number || host.phone || '',
          }
        : undefined,
      renter: renter
        ? {
            id: renter.id,
            first_name: renter.first_name || '',
            last_name: renter.last_name || '',
            email: renter.email || '',
            phone: renter.phone_number || renter.phone || '',
          }
        : undefined,
    };

    return { booking: formattedBooking, error: null };
  } catch (error) {
    console.error('Get booking by ID error:', error);
    return { booking: null, error };
  }
};

/**
 * Get bookings for a renter
 */
export const getRenterBookings = async (
  renterId: string,
  status?: BookingStatus
): Promise<{ bookings: Booking[]; error: any }> => {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        car:cars(*),
        renter:profiles!user_id(*),
        host:profiles!host_id(*)
      `)
      .eq('user_id', renterId) // bookings table uses user_id, not renter_id
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return { bookings: [], error };
    }

    const formattedBookings: Booking[] = (data || []).map((booking: any) => {
      // Map database fields to Booking interface
      const car = booking.car || booking.vehicle;
      const host = booking.host || booking.owner;
      const renter = booking.renter;
      
      // Handle JSONB images from car
      let carImages: string[] = [];
      if (car?.images) {
        if (Array.isArray(car.images)) {
          carImages = car.images;
        } else if (typeof car.images === 'string') {
          try {
            carImages = JSON.parse(car.images);
          } catch {
            carImages = [];
          }
        }
      }
      
      return {
        id: booking.id,
        vehicle_id: booking.car_id || booking.vehicle_id, // Map car_id to vehicle_id
        renter_id: booking.user_id || booking.renter_id, // Map user_id to renter_id
        owner_id: booking.host_id || booking.owner_id, // Map host_id to owner_id
        start_date: booking.start_date,
        end_date: booking.end_date,
        status: booking.status as BookingStatus,
        total_price: booking.total_amount || booking.total_price, // Map total_amount to total_price
        pickup_location: booking.pickup_location,
        created_at: booking.created_at,
        updated_at: booking.updated_at || booking.created_at,
        vehicle: car
          ? {
              id: car.id,
              make: car.brand || car.make, // Map brand to make
              model: car.model,
              year: car.year,
              images: carImages,
              price_per_day: car.price_per_day,
              location: car.location,
            }
          : undefined,
        owner: host
          ? {
              id: host.id,
              first_name: host.first_name || '',
              last_name: host.last_name || '',
              email: host.email || '',
              phone: host.phone_number || host.phone || '',
            }
          : undefined,
        renter: renter
          ? {
              id: renter.id,
              first_name: renter.first_name || '',
              last_name: renter.last_name || '',
              email: renter.email || '',
              phone: renter.phone_number || renter.phone || '',
            }
          : undefined,
      };
    });

    return { bookings: formattedBookings, error: null };
  } catch (error) {
    console.error('Get renter bookings error:', error);
    return { bookings: [], error };
  }
};

/**
 * Get bookings for an owner
 */
export const getOwnerBookings = async (
  ownerId: string,
  status?: BookingStatus
): Promise<{ bookings: Booking[]; error: any }> => {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        car:cars(*),
        renter:profiles!user_id(*),
        host:profiles!host_id(*)
      `)
      .eq('host_id', ownerId) // bookings table uses host_id, not owner_id
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return { bookings: [], error };
    }

    const formattedBookings: Booking[] = (data || []).map((booking: any) => {
      // Map database fields to Booking interface
      const car = booking.car || booking.vehicle;
      const host = booking.host || booking.owner;
      const renter = booking.renter;
      
      // Handle JSONB images from car
      let carImages: string[] = [];
      if (car?.images) {
        if (Array.isArray(car.images)) {
          carImages = car.images;
        } else if (typeof car.images === 'string') {
          try {
            carImages = JSON.parse(car.images);
          } catch {
            carImages = [];
          }
        }
      }
      
      return {
        id: booking.id,
        vehicle_id: booking.car_id || booking.vehicle_id, // Map car_id to vehicle_id
        renter_id: booking.user_id || booking.renter_id, // Map user_id to renter_id
        owner_id: booking.host_id || booking.owner_id, // Map host_id to owner_id
        start_date: booking.start_date,
        end_date: booking.end_date,
        status: booking.status as BookingStatus,
        total_price: booking.total_amount || booking.total_price, // Map total_amount to total_price
        pickup_location: booking.pickup_location,
        created_at: booking.created_at,
        updated_at: booking.updated_at || booking.created_at,
        vehicle: car
          ? {
              id: car.id,
              make: car.brand || car.make, // Map brand to make
              model: car.model,
              year: car.year,
              images: carImages,
              price_per_day: car.price_per_day,
              location: car.location,
            }
          : undefined,
        owner: host
          ? {
              id: host.id,
              first_name: host.first_name || '',
              last_name: host.last_name || '',
              email: host.email || '',
              phone: host.phone_number || host.phone || '',
            }
          : undefined,
        renter: renter
          ? {
              id: renter.id,
              first_name: renter.first_name || '',
              last_name: renter.last_name || '',
              email: renter.email || '',
              phone: renter.phone_number || renter.phone || '',
            }
          : undefined,
      };
    });

    return { bookings: formattedBookings, error: null };
  } catch (error) {
    console.error('Get owner bookings error:', error);
    return { bookings: [], error };
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus,
  userId: string
): Promise<{ booking: Booking | null; error: any }> => {
  try {
    // First verify user has permission (is owner or renter of this booking)
    const { data: bookingData, error: fetchError } = await supabase
      .from('bookings')
      .select('user_id, host_id') // bookings table uses user_id and host_id
      .eq('id', bookingId)
      .single();

    if (fetchError || !bookingData) {
      return { booking: null, error: { message: 'Booking not found' } };
    }

    if (bookingData.user_id !== userId && bookingData.host_id !== userId) {
      return { booking: null, error: { message: 'Unauthorized' } };
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select(`
        *,
        car:cars(*),
        renter:profiles!user_id(*),
        host:profiles!host_id(*)
      `)
      .single();

    if (error) {
      return { booking: null, error };
    }

    // Create notification
    const notifyUserId = bookingData.user_id === userId ? bookingData.host_id : bookingData.user_id;
    await supabase.from('notifications').insert({
      user_id: notifyUserId,
      type: 'booking_status_changed',
      title: 'Statut de réservation mis à jour',
      message: `La réservation a été mise à jour: ${status}`,
      related_id: bookingId,
      is_read: false,
    });

    const car = data.car || data.vehicle;
    const host = data.host || data.owner;
    const renter = data.renter;

    const formattedBooking: Booking = {
      id: data.id,
      vehicle_id: data.car_id || data.vehicle_id, // Map car_id to vehicle_id
      renter_id: data.user_id || data.renter_id, // Map user_id to renter_id
      owner_id: data.host_id || data.owner_id, // Map host_id to owner_id
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status as BookingStatus,
      total_price: data.total_amount || data.total_price,
      pickup_location: data.pickup_location,
      created_at: data.created_at,
      updated_at: data.updated_at,
      vehicle: car
        ? {
            id: car.id,
            make: car.make || car.brand,
            model: car.model,
            year: car.year,
            images: car.images || [],
            price_per_day: car.price_per_day,
            location: car.location,
          }
        : undefined,
      owner: host
        ? {
            id: host.id,
            first_name: host.first_name || '',
            last_name: host.last_name || '',
            email: host.email || '',
            phone: host.phone_number || host.phone || '',
          }
        : undefined,
    };

    return { booking: formattedBooking, error: null };
  } catch (error) {
    console.error('Update booking status error:', error);
    return { booking: null, error };
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (
  bookingId: string,
  userId: string,
  reason?: string
): Promise<{ booking: Booking | null; error: any }> => {
  try {
    return await updateBookingStatus(bookingId, 'cancelled', userId);
  } catch (error) {
    console.error('Cancel booking error:', error);
    return { booking: null, error };
  }
};

/**
 * Accept a booking request (owner only)
 */
export const acceptBookingRequest = async (
  bookingId: string,
  ownerId: string
): Promise<{ booking: Booking | null; error: any }> => {
  try {
    // Verify owner has permission and get booking details
    const { data: bookingData, error: fetchError } = await supabase
      .from('bookings')
      .select('host_id, status, user_id, car_id, start_date, end_date, total_amount, pickup_location, dropoff_location')
      .eq('id', bookingId)
      .single();

    if (fetchError || !bookingData) {
      return { booking: null, error: { message: 'Booking not found' } };
    }

    if (bookingData.host_id !== ownerId) {
      return { booking: null, error: { message: 'Unauthorized' } };
    }

    if (bookingData.status !== 'pending') {
      return { booking: null, error: { message: 'Booking is not pending' } };
    }

    // Update status to confirmed
    const result = await updateBookingStatus(bookingId, 'confirmed', ownerId);

    // Send confirmation email via Resend if booking was successfully confirmed
    if (result.booking && result.booking.status === 'confirmed') {
      try {
        // Get renter and vehicle details for email
        const { data: renterProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', bookingData.user_id)
          .single();

        const { data: carData } = await supabase
          .from('cars')
          .select('make, model, year, brand')
          .eq('id', bookingData.car_id)
          .single();

        // Get renter email from auth.users
        const { data: renterEmailData } = await supabase
          .rpc('get_user_emails', { user_ids: [bookingData.user_id] });

        const renterEmail = renterEmailData?.[0]?.email;
        const renterName = renterProfile 
          ? `${renterProfile.first_name || ''} ${renterProfile.last_name || ''}`.trim()
          : 'Locataire';
        
        const vehicleName = carData 
          ? `${carData.make || carData.brand || ''} ${carData.model || ''} ${carData.year || ''}`.trim()
          : 'Véhicule';

        if (renterEmail) {
          // Send email via Edge Function (which uses Resend)
          await supabase.functions.invoke('send-event-email', {
            body: {
              event_type: 'booking_confirmed',
              recipient_email: renterEmail,
              recipient_name: renterName,
              data: {
                booking_id: bookingId,
                vehicle_name: vehicleName,
                start_date: bookingData.start_date ? new Date(bookingData.start_date).toLocaleDateString('fr-FR') : '',
                end_date: bookingData.end_date ? new Date(bookingData.end_date).toLocaleDateString('fr-FR') : '',
                total_price: bookingData.total_amount || 0,
                pickup_location: bookingData.pickup_location || '',
                return_location: bookingData.dropoff_location || bookingData.pickup_location || '',
              },
            },
          });
        }
      } catch (emailError) {
        // Log error but don't fail the booking confirmation
        console.error('Error sending booking confirmation email:', emailError);
      }
    }

    return result;
  } catch (error) {
    console.error('Accept booking request error:', error);
    return { booking: null, error };
  }
};

/**
 * Reject a booking request (owner only)
 */
export const rejectBookingRequest = async (
  bookingId: string,
  ownerId: string,
  reason?: string
): Promise<{ booking: Booking | null; error: any }> => {
  try {
    // Verify owner has permission
    const { data: bookingData, error: fetchError } = await supabase
      .from('bookings')
      .select('host_id, status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !bookingData) {
      return { booking: null, error: { message: 'Booking not found' } };
    }

    if (bookingData.host_id !== ownerId) {
      return { booking: null, error: { message: 'Unauthorized' } };
    }

    if (bookingData.status !== 'pending') {
      return { booking: null, error: { message: 'Booking is not pending' } };
    }

    // Update status to rejected
    const result = await updateBookingStatus(bookingId, 'rejected', ownerId);
    
    // Store rejection reason if provided (could be in a separate table or as metadata)
    if (reason && result.booking) {
      // Optionally store reason in booking metadata or a separate table
      await supabase
        .from('bookings')
        .update({ 
          updated_at: new Date().toISOString(),
          // Could add a rejection_reason field if the table has it
        })
        .eq('id', bookingId);
    }

    return result;
  } catch (error) {
    console.error('Reject booking request error:', error);
    return { booking: null, error };
  }
};

